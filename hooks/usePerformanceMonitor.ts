import { useCallback, useEffect, useRef, useState } from 'react';

const FRAME_DROP_THRESHOLD_MS = 1000 / 45;
const UI_UPDATE_INTERVAL_MS = 400;
const JS_HEARTBEAT_MS = 100;
const JS_BUSY_DRIFT_MS = 50;
const FPS_WINDOW_SIZE = 30;
const MAX_SAMPLES = 600;

export interface PerformanceMetrics {
  fps: number;
  frameDrops: number;
  jsThreadBusy: boolean;
  p50FrameTime: number;
  p95FrameTime: number;
  worstFrameTime: number;
  totalFrames: number;
  windowSamples: number;
}

function percentile(values: number[], p: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;

  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function averageFps(frameTimes: number[]) {
  if (frameTimes.length === 0) {
    return 0;
  }

  const window = frameTimes.slice(-FPS_WINDOW_SIZE);
  const avgFrameTime = window.reduce((sum, time) => sum + time, 0) / window.length;

  return 1000 / avgFrameTime;
}

const EMPTY_METRICS: PerformanceMetrics = {
  fps: 0,
  frameDrops: 0,
  jsThreadBusy: false,
  p50FrameTime: 0,
  p95FrameTime: 0,
  worstFrameTime: 0,
  totalFrames: 0,
  windowSamples: 0,
};

export function usePerformanceMonitor(enabled = true) {
  const frameTimesRef = useRef<number[]>([]);
  const frameDropsRef = useRef(0);
  const totalFramesRef = useRef(0);
  const worstFrameRef = useRef(0);
  const jsBusyRef = useRef(false);

  const [metrics, setMetrics] = useState<PerformanceMetrics>(EMPTY_METRICS);

  const reset = useCallback(() => {
    frameTimesRef.current = [];
    frameDropsRef.current = 0;
    totalFramesRef.current = 0;
    worstFrameRef.current = 0;
    jsBusyRef.current = false;
    setMetrics(EMPTY_METRICS);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let rafId = 0;
    let lastFrameTime = performance.now();

    const onFrame = (now: number) => {
      const frameTime = now - lastFrameTime;
      lastFrameTime = now;

      if (frameTime > 0 && frameTime < 1000) {
        const frameTimes = frameTimesRef.current;
        frameTimes.push(frameTime);
        totalFramesRef.current += 1;

        if (frameTimes.length > MAX_SAMPLES) {
          frameTimes.splice(0, frameTimes.length - MAX_SAMPLES);
        }

        if (frameTime > FRAME_DROP_THRESHOLD_MS) {
          frameDropsRef.current += 1;
        }

        if (frameTime > worstFrameRef.current) {
          worstFrameRef.current = frameTime;
        }
      }

      rafId = requestAnimationFrame(onFrame);
    };

    rafId = requestAnimationFrame(onFrame);

    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let lastHeartbeat = Date.now();

    const heartbeatId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastHeartbeat;
      lastHeartbeat = now;
      jsBusyRef.current = elapsed > JS_HEARTBEAT_MS + JS_BUSY_DRIFT_MS;
    }, JS_HEARTBEAT_MS);

    return () => clearInterval(heartbeatId);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const uiUpdateId = setInterval(() => {
      const frameTimes = frameTimesRef.current;

      setMetrics({
        fps: Math.round(averageFps(frameTimes)),
        frameDrops: frameDropsRef.current,
        jsThreadBusy: jsBusyRef.current,
        p50FrameTime: Math.round(percentile(frameTimes, 50) * 10) / 10,
        p95FrameTime: Math.round(percentile(frameTimes, 95) * 10) / 10,
        worstFrameTime: Math.round(worstFrameRef.current * 10) / 10,
        totalFrames: totalFramesRef.current,
        windowSamples: frameTimes.length,
      });
    }, UI_UPDATE_INTERVAL_MS);

    return () => clearInterval(uiUpdateId);
  }, [enabled]);

  return { metrics, reset };
}
