"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/** Peak scale of the item under the pointer, and of its direct neighbours. */
const HOVER_SCALE = 1.22;
const NEIGHBOUR_SCALE = 1.08;
/** How far the hovered item (and its neighbours) lift toward the viewer. */
const HOVER_LIFT = -4;
const NEIGHBOUR_LIFT = -2;
/** The click bounce, on top of the hover state: dip, pop, settle. */
const POP_MS = 560;

type Pose = { x: number; y: number; s: number };
const REST: Pose = { x: 0, y: 0, s: 1 };
const toTransform = (p: Pose) => `translate(${p.x.toFixed(2)}px, ${p.y}px) scale(${p.s})`;

/**
 * macOS Dock-style magnification for a row of links (SiteNav, 2026-09-26).
 *
 * Hovering (or keyboard-focusing) an item grows it to ~1.22x and lifts it;
 * its direct neighbours grow a little less. Items slide sideways by exactly
 * the width they gained, so grown pills never overlap: everything happens in
 * `transform`, nothing reflows and the page layout never moves. The springy
 * timing is a CSS transition on the row (see `.nav-dock` in globals.css).
 *
 * `pop(el)` adds a click bounce on top of the current pose with the Web
 * Animations API, so it plays in full even while the page scrolls to the
 * link's section.
 *
 * Does nothing when `enabled` is false (reduced motion).
 */
export function useDockMagnify(rowRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const poses = useRef(new Map<HTMLElement, Pose>());

  const items = useCallback(
    () => (rowRef.current ? (Array.from(rowRef.current.children) as HTMLElement[]).filter((el) => el.tagName === "A") : []),
    [rowRef]
  );

  const apply = useCallback(
    (focus: HTMLElement | null) => {
      const list = items();
      const at = focus ? list.indexOf(focus) : -1;
      // Scale by distance from the focused item.
      const scale = list.map((_, i) => {
        if (at < 0) return 1;
        const d = Math.abs(i - at);
        return d === 0 ? HOVER_SCALE : d === 1 ? NEIGHBOUR_SCALE : 1;
      });
      // Half of the width each item gains, on each side (offsetWidth is the
      // untransformed layout width).
      const half = list.map((el, i) => (el.offsetWidth * (scale[i] - 1)) / 2);
      const shift = list.map(() => 0);
      for (let i = at + 1; at >= 0 && i < list.length; i++) shift[i] = shift[i - 1] + half[i - 1] + half[i];
      for (let i = at - 1; i >= 0; i--) shift[i] = shift[i + 1] - half[i + 1] - half[i];
      list.forEach((el, i) => {
        const d = at < 0 ? Infinity : Math.abs(i - at);
        const pose: Pose = { x: shift[i], y: d === 0 ? HOVER_LIFT : d === 1 ? NEIGHBOUR_LIFT : 0, s: scale[i] };
        poses.current.set(el, pose);
        el.style.transform = pose.s === 1 && pose.x === 0 && pose.y === 0 ? "" : toTransform(pose);
        el.style.zIndex = d === 0 ? "3" : d === 1 ? "2" : "";
      });
    },
    [items]
  );

  useEffect(() => {
    const row = rowRef.current;
    if (!row || !enabled) return;
    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = (event.target as HTMLElement).closest("a");
      if (target && row.contains(target)) apply(target as HTMLElement);
    };
    const onLeave = () => apply(null);
    // Keyboard users get the same magnification on the focused item.
    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "A" && target.matches(":focus-visible")) apply(target);
    };
    const onBlur = (event: FocusEvent) => {
      if (!row.contains(event.relatedTarget as Node | null) && !row.matches(":hover")) apply(null);
    };
    row.addEventListener("pointerover", onOver);
    row.addEventListener("pointerleave", onLeave);
    row.addEventListener("focusin", onFocus);
    row.addEventListener("focusout", onBlur);
    return () => {
      row.removeEventListener("pointerover", onOver);
      row.removeEventListener("pointerleave", onLeave);
      row.removeEventListener("focusin", onFocus);
      row.removeEventListener("focusout", onBlur);
      apply(null);
    };
  }, [rowRef, enabled, apply]);

  const pop = useCallback(
    (el: HTMLElement) => {
      if (!enabled || typeof el.animate !== "function") return;
      const base = poses.current.get(el) ?? REST;
      // Without a hover pose (touch, or a click from the keyboard) the pop
      // itself carries the whole magnification.
      const peak = base.s > 1 ? 1.07 : 1.26;
      const at = (s: number, lift = 0) => toTransform({ x: base.x, y: base.y + lift, s: base.s * s });
      el.style.zIndex = "3";
      el.animate(
        [
          { transform: at(1), easing: "cubic-bezier(.3, 0, .6, 1)" },
          { transform: at(0.93), offset: 0.16, easing: "cubic-bezier(.2, .9, .3, 1.2)" },
          { transform: at(peak, -3), offset: 0.48, easing: "cubic-bezier(.4, 0, .5, 1)" },
          { transform: at(0.98), offset: 0.76, easing: "cubic-bezier(.3, 0, .3, 1)" },
          { transform: at(1) },
        ],
        { duration: POP_MS, easing: "linear" }
      );
      window.setTimeout(() => {
        const pose = poses.current.get(el);
        el.style.zIndex = pose && pose.s > 1 ? el.style.zIndex : "";
      }, POP_MS + 40);
    },
    [enabled]
  );

  return pop;
}
