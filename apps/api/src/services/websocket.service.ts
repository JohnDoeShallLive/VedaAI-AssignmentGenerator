import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { WSClientSubscribeMessage, WSServerProgressMessage } from '@vedaai/types';
import { Assignment } from '../models/assignment.model';

// Map: assignmentId -> Set of WebSockets
const subscriptions = new Map<string, Set<WebSocket>>();

export function initializeWebSocketServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  // Attach upgrade handler in index.ts
  httpServer.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[websocket]: Client connected');

    let subscribedAssignmentId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as WSClientSubscribeMessage;
        
        if (msg.type === 'subscribe' && msg.assignmentId) {
          subscribedAssignmentId = msg.assignmentId;
          
          if (!subscriptions.has(msg.assignmentId)) {
            subscriptions.set(msg.assignmentId, new Set());
          }
          subscriptions.get(msg.assignmentId)!.add(ws);
          
          console.log(`[websocket]: Client subscribed to assignment ${msg.assignmentId}`);
          
          // Query assignment state from MongoDB asynchronously to prevent over-writing UI state on client disconnect/reconnects
          (async () => {
            try {
              const assignment = await Assignment.findById(msg.assignmentId);
              let event: 'job.queued' | 'job.processing' | 'job.done' | 'job.failed' = 'job.queued';
              let resultId: string | undefined;

              if (assignment) {
                if (assignment.status === 'processing') {
                  event = 'job.processing';
                } else if (assignment.status === 'done') {
                  event = 'job.done';
                  resultId = assignment.resultId ? assignment.resultId.toString() : undefined;
                } else if (assignment.status === 'failed') {
                  event = 'job.failed';
                }
              }

              const ack: WSServerProgressMessage = {
                event,
                assignmentId: msg.assignmentId,
                resultId,
              };
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(ack));
                console.log(`[websocket]: Sent custom state subscription ACK "${event}" for assignment ${msg.assignmentId}`);
              }
            } catch (dbErr) {
              console.error('[websocket]: Failed to fetch assignment for subscription ACK:', dbErr);
              const ack: WSServerProgressMessage = {
                event: 'job.queued',
                assignmentId: msg.assignmentId,
              };
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(ack));
              }
            }
          })();
        }
      } catch (err) {
        console.error('[websocket]: Error processing client message:', err);
      }
    });

    ws.on('close', () => {
      console.log('[websocket]: Client disconnected');
      if (subscribedAssignmentId) {
        const clients = subscriptions.get(subscribedAssignmentId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            subscriptions.delete(subscribedAssignmentId);
          }
          console.log(`[websocket]: Cleaned subscription for assignment ${subscribedAssignmentId}`);
        }
      }
    });

    ws.on('error', (err) => {
      console.error('[websocket]: WebSocket connection error:', err);
    });
  });

  console.log('[websocket]: WebSocket Server initialized');
  return wss;
}

export function broadcastJobEvent(assignmentId: string, payload: Omit<WSServerProgressMessage, 'assignmentId'>) {
  const clients = subscriptions.get(assignmentId);
  if (!clients || clients.size === 0) {
    console.log(`[websocket]: Broadcast skipped - no subscribers for assignment ${assignmentId}`);
    return;
  }

  const msgPayload: WSServerProgressMessage = {
    ...payload,
    assignmentId,
  };

  const stringified = JSON.stringify(msgPayload);
  let activeClients = 0;

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(stringified);
      activeClients++;
    }
  });

  console.log(`[websocket]: Broadcasted "${payload.event}" to ${activeClients} active client(s) for assignment ${assignmentId}`);
}
