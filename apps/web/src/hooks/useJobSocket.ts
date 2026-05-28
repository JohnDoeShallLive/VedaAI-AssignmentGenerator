'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { WSServerProgressMessage } from '@vedaai/types';

export function useJobSocket(assignmentId: string | null) {
  const router = useRouter();
  const setStatus = useAssignmentStore((s) => s.setGenerationStatus);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    if (!assignmentId) return;

    isUnmountedRef.current = false;
    reconnectCountRef.current = 0;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

    function connect() {
      if (isUnmountedRef.current) return;

      console.log(`[websocket-client]: Connecting to ${wsUrl} for assignment ${assignmentId} (Attempt ${reconnectCountRef.current + 1})`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        console.log('[websocket-client]: Socket channel established. Subscribing...');
        reconnectCountRef.current = 0; // Reset reconnect count on successful connection
        ws.send(JSON.stringify({
          type: 'subscribe',
          assignmentId,
        }));
      };

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const payload = JSON.parse(event.data) as WSServerProgressMessage;
          console.log('[websocket-client]: Received state message:', payload);
          
          if (payload.assignmentId === assignmentId) {
            // Map WS events to Mongoose assignment statuses
            const statusMap: Record<string, string> = {
              'job.queued': 'queued',
              'job.processing': 'processing',
              'job.done': 'done',
              'job.failed': 'failed',
            };
            
            const mappedStatus = statusMap[payload.event] || 'draft';
            setStatus(mappedStatus as any);

            if (payload.event === 'job.done' && payload.resultId) {
              console.log(`[websocket-client]: Job complete! Redirecting to paper results...`);
              router.push(`/assignments/${assignmentId}/result`);
            }
          }
        } catch (err) {
          console.error('[websocket-client]: Error decoding server WS frame:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[websocket-client]: Socket connection encountered an error:', err);
        // Do not immediately fail. Let close event handle the retry logic
      };

      ws.onclose = (event) => {
        if (isUnmountedRef.current) {
          console.log('[websocket-client]: Socket channel closed (cleanup)');
          return;
        }
        console.log(`[websocket-client]: Socket channel closed. Code: ${event.code}, Reason: ${event.reason}`);
        
        const maxAttempts = 5;
        if (reconnectCountRef.current < maxAttempts) {
          const delay = Math.min(5000, 1000 * Math.pow(2, reconnectCountRef.current));
          console.log(`[websocket-client]: Reconnecting in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, delay);
        } else {
          console.error('[websocket-client]: Maximum reconnection attempts exhausted. Setting status to failed.');
          setStatus('failed');
        }
      };
    }

    connect();

    // Cleanup on unmount or assignment ID shift
    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        const ws = socketRef.current;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }
    };
  }, [assignmentId, setStatus, router]);

  return socketRef.current;
}
