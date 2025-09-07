import { useState, useEffect, useRef, useCallback } from 'react';
import callApi from '../api/callApi';
import { CallDTO } from '../types/call';
import webrtcService, { CallEvent } from '../services/webrtcService';

export const useCallHistory = (conversationId: string | null) => {
  const [callHistory, setCallHistory] = useState<CallDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  const loadCallHistory = useCallback(async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const calls = await callApi.getCallsByConversation(conversationId);
      setCallHistory(calls);
    } catch (err: any) {
      console.error('Error loading call history:', err);
      setError(err.message || 'Failed to load call history');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadCallHistory();
  }, [conversationId, loadCallHistory]);

  // Proactively refresh call history when realtime call events arrive
  useEffect(() => {
    if (!conversationId) return;

    const handlerId = webrtcService.onCallEvent((event: CallEvent) => {
      const mapTypeToStatus = (t: CallEvent['type']): CallDTO['status'] | null => {
        switch (t) {
          case 'call_ended':
            return 'ended';
          case 'call_failed':
            return 'failed';
          case 'call_rejected':
            return 'canceled';
          case 'call_accepted':
            return 'ongoing';
          case 'call_incoming':
          case 'call_outgoing':
            return 'ringing';
          default:
            return null;
        }
      };

      const status = mapTypeToStatus(event.type);
      if (!status) return;

      // Update state functionally to avoid dependency loops
      let shouldRefresh = false;
      setCallHistory(prev => {
        // 1) Try to update by callId
        const byIdIndex = prev.findIndex(c => c.id === event.callId);
        if (byIdIndex !== -1) {
          const next = [...prev];
          next[byIdIndex] = { ...next[byIdIndex], status };
          return next;
        }

        // 2) Fallback: update the latest 'ringing' item (common when IDs differ)
        const latestRingingIndex = prev.findIndex(c => c.status === 'ringing');
        if (latestRingingIndex !== -1 && (status === 'ended' || status === 'failed' || status === 'canceled' || status === 'ongoing')) {
          const next = [...prev];
          next[latestRingingIndex] = { ...next[latestRingingIndex], status };
          return next;
        }

        // 3) Otherwise leave as is and request a background refresh
        shouldRefresh = true;
        return prev;
      });

      if (shouldRefresh) {
        // Debounce background refresh to avoid update depth loops
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
        }
        refreshTimerRef.current = window.setTimeout(() => {
          loadCallHistory();
          refreshTimerRef.current = null;
        }, 250);
      }
    });

    return () => {
      webrtcService.offCallEvent(handlerId);
    };
  }, [conversationId]);

  const addCallToHistory = (call: CallDTO) => {
    setCallHistory(prev => [call, ...prev]);
  };

  const updateCallInHistory = (callId: string, updates: Partial<CallDTO>) => {
    setCallHistory(prev => 
      prev.map(call => 
        call.id === callId ? { ...call, ...updates } : call
      )
    );
  };

  const removeCallFromHistory = (callId: string) => {
    setCallHistory(prev => prev.filter(call => call.id !== callId));
  };

  return {
    callHistory,
    isLoading,
    error,
    loadCallHistory,
    addCallToHistory,
    updateCallInHistory,
    removeCallFromHistory
  };
};

