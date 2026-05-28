'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { WSServerProgressMessage } from '@vedaai/types';

export function useJobSocket(assignmentId: string | null) {
  const router = useRouter();
  const setStatus = useAssignmentStore((s) => s.setGenerationStatus);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!assignmentId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
    console.log(`[websocket-client]: Connecting to ${wsUrl} for assignment ${assignmentId}`);
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[websocket-client]: Socket channel established. Subscribing...');
      ws.send(JSON.stringify({
        type: 'subscribe',
        assignmentId,
      }));
    };

    ws.onmessage = (event) => {
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
      setStatus('failed');
    };

    ws.onclose = () => {
      console.log('[websocket-client]: Socket channel closed');
    };

    // Cleanup on unmount or assignment ID shift
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [assignmentId, setStatus, router]);

  return socketRef.current;
}
