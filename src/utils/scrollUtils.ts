/**
 * Find the ancestor element that actually scrolls `el`.
 *
 * The app shell renders inside a `h-screen overflow-hidden` wrapper with
 * an `overflow-y-auto` <main> doing the scrolling, so `window.scrollY` is
 * always 0 there. Anything that saves/restores a scroll position must
 * target the real scroll container, not the window. Returns null when the
 * window itself is the scroller (e.g. pages outside the shell).
 */
export function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    if (node.scrollHeight > node.clientHeight) {
      const { overflowY } = window.getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll") return node;
    }
    node = node.parentElement;
  }
  return null;
}
