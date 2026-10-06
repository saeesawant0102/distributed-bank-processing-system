// Custom simulation hook for event queuing, stepping, playback speed, and cluster state
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';

export function useSimulation(activeExperiment = null) {
  const [clusterState, setClusterState] = useState(null);
  const [eventQueue, setEventQueue] = useState([]);
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1); // 0.5x, 1x, 2x, 4x
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const queueRef = useRef(eventQueue);
  queueRef.current = eventQueue;

  const refreshState = useCallback(async () => {
    try {
      const data = await api.getState();
      if (data && data.nodes) {
        setClusterState(data);
      }
    } catch (err) {
      console.warn('Failed to fetch cluster state:', err);
    }
  }, []);

  // Connect socket and listen to events
  useEffect(() => {
    socket.connect();
    const unsubStatus = socket.subscribeStatus(setConnected);

    const unsubEvents = socket.subscribe((event) => {
      if (event.type === 'CONNECTED') {
        if (event.data?.clusterState) {
          setClusterState(event.data.clusterState);
        }
        return;
      }

      // If event matches current experiment or is general
      if (!activeExperiment || event.experiment === activeExperiment || event.experiment === 'general') {
        setEventQueue((prev) => [...prev, event]);
      }
    });

    refreshState();

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, [activeExperiment, refreshState]);

  // Apply single event effects to local state
  const applyEvent = useCallback((event) => {
    setDisplayedEvents((prev) => [event, ...prev.slice(0, 200)]);
    setLastEvent(event);

    // Dynamic UI updates based on event data
    if (event.type === 'SIM_RESET') {
      refreshState();
    } else if (event.type === 'NODE_FAILED') {
      setClusterState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === event.data?.nodeId ? { ...n, alive: false } : n)),
        };
      });
    } else if (event.type === 'NODE_RECOVERED') {
      setClusterState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === event.data?.nodeId ? { ...n, alive: true } : n)),
        };
      });
    } else if (event.type === 'COORDINATOR_ELECTED') {
      setClusterState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          coordinatorId: event.data?.winnerId,
          nodes: prev.nodes.map((n) => ({
            ...n,
            role: n.id === event.data?.winnerId ? 'coordinator' : n.role === 'coordinator' ? 'idle' : n.role,
          })),
        };
      });
    } else if (event.type === 'PRIMARY_CHANGED') {
      setClusterState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          primaryId: event.data?.newPrimaryId,
          epoch: event.data?.epoch || prev.epoch + 1,
        };
      });
    } else if (event.type === 'CLOCK_UPDATED') {
      refreshState();
    } else if (event.type === 'TRANSACTION_COMPLETED' || event.type === 'RPC_RESPONSE') {
      refreshState();
    }
  }, [refreshState]);

  // Step one event manually
  const step = useCallback(() => {
    if (queueRef.current.length > 0) {
      const nextEvent = queueRef.current[0];
      setEventQueue((prev) => prev.slice(1));
      applyEvent(nextEvent);
    }
  }, [applyEvent]);

  // Timer loop for automatic playback
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(100, Math.floor(700 / speed));
    const timer = setInterval(() => {
      if (queueRef.current.length > 0) {
        const nextEvent = queueRef.current[0];
        setEventQueue((prev) => prev.slice(1));
        applyEvent(nextEvent);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, speed, applyEvent]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  const reset = useCallback(async () => {
    setEventQueue([]);
    setDisplayedEvents([]);
    setLastEvent(null);
    try {
      const res = await api.reset();
      setClusterState(res);
    } catch (e) {
      console.error('Reset failed:', e);
    }
  }, []);

  const clearLog = useCallback(() => {
    setDisplayedEvents([]);
  }, []);

  const toggleNodeLiveness = useCallback(async (nodeId, isCurrentlyAlive) => {
    try {
      if (isCurrentlyAlive) {
        await api.killNode(nodeId);
      } else {
        await api.recoverNode(nodeId);
      }
      refreshState();
    } catch (e) {
      console.error('Node toggle failed:', e);
    }
  }, [refreshState]);

  return {
    clusterState,
    eventQueue,
    displayedEvents,
    lastEvent,
    isPlaying,
    speed,
    connected,
    play,
    pause,
    step,
    reset,
    clearLog,
    setSpeed,
    refreshState,
    toggleNodeLiveness,
  };
}
