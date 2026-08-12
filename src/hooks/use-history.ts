import { useCallback, useRef, useState } from "react";

export type History<T> = {
  state: T;
  set: (next: T, options?: { merge?: boolean }) => void;
  reset: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

const LIMIT = 60;

/**
 * State container with an undo/redo stack. Consecutive quick edits (typing)
 * are merged into one history step.
 */
export function useHistory<T>(initial: T, mergeMs = 700): History<T> {
  const [past, setPast] = useState<T[]>([]);
  const [state, setState] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);
  const lastPush = useRef(0);

  const set = useCallback(
    (next: T, options?: { merge?: boolean }) => {
      const now = Date.now();
      const merge = options?.merge !== false && now - lastPush.current < mergeMs;
      setState((prev) => {
        if (!merge) setPast((p) => [...p, prev].slice(-LIMIT));
        return next;
      });
      if (!merge) lastPush.current = now;
      else lastPush.current = now;
      setFuture([]);
    },
    [mergeMs],
  );

  const reset = useCallback((next: T) => {
    setPast([]);
    setFuture([]);
    lastPush.current = 0;
    setState(next);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1]!;
      setState((cur) => {
        setFuture((f) => [cur, ...f].slice(0, LIMIT));
        return prev;
      });
      lastPush.current = 0;
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0]!;
      setState((cur) => {
        setPast((p) => [...p, cur].slice(-LIMIT));
        return next;
      });
      lastPush.current = 0;
      return f.slice(1);
    });
  }, []);

  return { state, set, reset, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
