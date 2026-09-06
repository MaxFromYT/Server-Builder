/**
 * Load a rack's models a few at a time instead of all at once.
 *
 * The wired rack asks for ten glTF files, and their textures are embedded,
 * so what the browser is really handed is ten downloads and around thirty
 * six image decodes kicked off in the same tick. On a desktop that is fine.
 * On a phone it is not: iOS Safari decodes these through an img element
 * rather than createImageBitmap, and past a certain number of simultaneous
 * decodes some of them simply never fire load or error. Not slow, not
 * failed: nothing. The request sits there forever, the device waiting on it
 * stays behind its placeholder, and the progress readout stops partway and
 * never moves again.
 *
 * That was the eighty three percent. It was never a decoder or a transcoder
 * problem, which is worth writing down because an earlier fix went after the
 * Basis transcoder on the theory that it was: sharing one transcoder instead
 * of building ten was a real improvement and could not have been the cause,
 * because these models carry no KTX2 at all. Their textures are webp. The
 * Dell teardown was the clue and it was misread twice: it works not because
 * it is one model rather than ten, but because being one model means its
 * textures decode alone.
 *
 * So the fix is to stop asking for everything at once. Devices mount in a
 * sliding window: a few at first, and each one that finishes lets the next
 * one start. Total bytes are unchanged and the rack still fills in visibly,
 * but the browser is never holding more decodes than it can finish.
 */

import { useCallback, useMemo, useRef, useState } from "react";

/**
 * How many models may be in flight at once.
 *
 * A coarse pointer is the closest thing to a reliable "this is a phone"
 * signal that does not involve parsing a user agent string, and phones are
 * where this breaks. Four is comfortable on a desktop and two is what a
 * phone on a weak connection can actually finish.
 */
function concurrency(): number {
  if (typeof window === "undefined" || !window.matchMedia) return 3;
  return window.matchMedia("(pointer: coarse)").matches ? 2 : 4;
}

export interface LoadWindow {
  /** How many of the list may render right now. */
  visible: number;
  /** Called by a device once its model has resolved. */
  markReady: (key: string) => void;
  /** How many have finished, for an honest progress readout. */
  ready: number;
}

export function useLoadWindow(total: number): LoadWindow {
  const limit = useMemo(concurrency, []);
  const done = useRef(new Set<string>());
  const [ready, setReady] = useState(0);

  /*
    Keyed by device rather than counted, because a device can re-render for
    reasons that have nothing to do with loading (a selection change, a
    dim toggle) and counting those would open the window early and put us
    back where we started.
  */
  const markReady = useCallback((key: string) => {
    if (done.current.has(key)) return;
    done.current.add(key);
    setReady(done.current.size);
  }, []);

  return { visible: Math.min(total, ready + limit), markReady, ready };
}
