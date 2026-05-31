import { useEffect, useRef, useState } from 'react';

export type SpriteAnimationOptions = {
  frames: number;
  fps: number;
  loop: boolean;
  paused?: boolean;
  /** Bumping this resets the animation back to frame 0. */
  resetKey?: string | number;
  onFrame?: (frame: number) => void;
  onComplete?: () => void;
};

/**
 * Drives a frame index 0..frames-1 using requestAnimationFrame.
 *
 * - Looping animations cycle indefinitely.
 * - One-shot animations advance to the last frame and stay there; `onComplete`
 *   fires exactly once when the final frame is reached.
 * - Pausing freezes on the current frame.
 * - Changing `resetKey` rewinds to frame 0.
 */
export function useSpriteAnimation({
  frames,
  fps,
  loop,
  paused = false,
  resetKey,
  onFrame,
  onComplete,
}: SpriteAnimationOptions): number {
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const accumRef = useRef(0);
  const completedRef = useRef(false);

  const onFrameRef = useRef(onFrame);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onFrameRef.current = onFrame;
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    frameRef.current = 0;
    accumRef.current = 0;
    lastTimeRef.current = null;
    completedRef.current = false;
    setFrame(0);
  }, [resetKey, frames, loop]);

  useEffect(() => {
    if (paused || frames <= 0 || fps <= 0) return;
    if (!loop && completedRef.current) return;

    const frameDuration = 1000 / fps;
    let rafId = 0;
    let prevFrame = frameRef.current;

    const tick = (now: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = now;
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      accumRef.current += dt;

      while (accumRef.current >= frameDuration) {
        accumRef.current -= frameDuration;
        const next = frameRef.current + 1;
        if (next >= frames) {
          if (loop) {
            frameRef.current = next % frames;
          } else {
            frameRef.current = frames - 1;
            completedRef.current = true;
            if (frameRef.current !== prevFrame) {
              setFrame(frameRef.current);
              onFrameRef.current?.(frameRef.current);
            }
            onCompleteRef.current?.();
            return;
          }
        } else {
          frameRef.current = next;
        }
      }

      if (frameRef.current !== prevFrame) {
        prevFrame = frameRef.current;
        setFrame(frameRef.current);
        onFrameRef.current?.(frameRef.current);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      lastTimeRef.current = null;
    };
  }, [frames, fps, loop, paused]);

  return frame;
}
