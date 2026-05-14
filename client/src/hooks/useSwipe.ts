/*
 * ATADA — Swipe Detection Hook
 * Handles: mouse drag, touch swipe, edge hover zones
 * Future: Add haptic feedback, velocity-based momentum
 */

import { useCallback, useRef, useState } from "react";

interface SwipeConfig {
  threshold?: number;      // px distance to trigger swipe
  velocityThreshold?: number; // px/ms minimum velocity
  edgeZone?: number;       // px from edge to trigger hover zone
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface SwipeState {
  isDragging: boolean;
  dragDelta: number;
  edgeHover: "left" | "right" | null;
}

export function useSwipe({
  threshold = 80,
  velocityThreshold = 0.3,
  edgeZone = 40,
  onSwipeLeft,
  onSwipeRight,
}: SwipeConfig) {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);
  const isTracking = useRef<boolean>(false);
  const isVertical = useRef<boolean | null>(null);
  const edgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    dragDelta: 0,
    edgeHover: null,
  });

  const startTracking = useCallback((x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    startTime.current = Date.now();
    isTracking.current = true;
    isVertical.current = null;
    setSwipeState({ isDragging: true, dragDelta: 0, edgeHover: null });
  }, []);

  const updateTracking = useCallback((x: number, y: number) => {
    if (!isTracking.current) return;

    const deltaX = x - startX.current;
    const deltaY = y - startY.current;

    // Determine axis lock on first significant movement
    if (isVertical.current === null && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
      isVertical.current = Math.abs(deltaY) > Math.abs(deltaX);
    }

    // If vertical scroll, cancel swipe tracking
    if (isVertical.current) {
      isTracking.current = false;
      setSwipeState({ isDragging: false, dragDelta: 0, edgeHover: null });
      return;
    }

    setSwipeState(prev => ({ ...prev, dragDelta: deltaX }));
  }, []);

  const endTracking = useCallback((x: number) => {
    if (!isTracking.current) {
      setSwipeState({ isDragging: false, dragDelta: 0, edgeHover: null });
      return;
    }

    const deltaX = x - startX.current;
    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(deltaX) / elapsed;

    isTracking.current = false;
    setSwipeState({ isDragging: false, dragDelta: 0, edgeHover: null });

    const meetsThreshold = Math.abs(deltaX) >= threshold;
    const meetsVelocity = velocity >= velocityThreshold;

    if (meetsThreshold || meetsVelocity) {
      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
  }, [threshold, velocityThreshold, onSwipeLeft, onSwipeRight]);

  // Mouse event handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startTracking(e.clientX, e.clientY);
  }, [startTracking]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    updateTracking(e.clientX, e.clientY);
  }, [updateTracking]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    endTracking(e.clientX);
  }, [endTracking]);

  const onMouseLeave = useCallback((e: React.MouseEvent) => {
    if (isTracking.current) {
      endTracking(e.clientX);
    }
  }, [endTracking]);

  // Touch event handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startTracking(touch.clientX, touch.clientY);
  }, [startTracking]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    updateTracking(touch.clientX, touch.clientY);
  }, [updateTracking]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    endTracking(touch.clientX);
  }, [endTracking]);

  // Edge hover detection
  const onMouseMoveForEdge = useCallback((e: React.MouseEvent) => {
    if (isTracking.current) return;

    const { clientX } = e;
    const { innerWidth } = window;

    if (clientX <= edgeZone) {
      setSwipeState(prev => ({ ...prev, edgeHover: "left" }));
      if (edgeTimer.current) clearTimeout(edgeTimer.current);
      edgeTimer.current = setTimeout(() => {
        onSwipeRight?.();
        setSwipeState(prev => ({ ...prev, edgeHover: null }));
      }, 600);
    } else if (clientX >= innerWidth - edgeZone) {
      setSwipeState(prev => ({ ...prev, edgeHover: "right" }));
      if (edgeTimer.current) clearTimeout(edgeTimer.current);
      edgeTimer.current = setTimeout(() => {
        onSwipeLeft?.();
        setSwipeState(prev => ({ ...prev, edgeHover: null }));
      }, 600);
    } else {
      if (edgeTimer.current) {
        clearTimeout(edgeTimer.current);
        edgeTimer.current = null;
      }
      setSwipeState(prev => ({ ...prev, edgeHover: null }));
    }
  }, [edgeZone, onSwipeLeft, onSwipeRight]);

  return {
    swipeState,
    handlers: {
      onMouseDown,
      onMouseMove: (e: React.MouseEvent) => {
        onMouseMove(e);
        onMouseMoveForEdge(e);
      },
      onMouseUp,
      onMouseLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
