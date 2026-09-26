// House scroll glide: the same easeInOutCubic family as the landing's
// anchor animation, for return-restore flights (project → catalogue/about)
// that would otherwise snap. Distance-scaled duration, capped; reduced
// motion degrades to the instant jump.

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function animateScrollToY(targetY: number): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: targetY, behavior: "instant" });
    return;
  }

  const startY = window.scrollY;
  const distance = Math.abs(targetY - startY);
  if (distance < 2) {
    return;
  }
  const duration = Math.min(1000, Math.max(480, distance / 2.6));
  const start = performance.now();
  let cancelled = false;
  let raf = 0;

  const cancel = () => {
    cancelled = true;
  };
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });

  const step = (now: number) => {
    if (cancelled) {
      return;
    }
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    const position = startY + (targetY - startY) * easeInOutCubic(t);
    window.scrollTo({ top: position, behavior: "instant" });
    if (t < 1) {
      raf = requestAnimationFrame(step);
    } else {
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
    }
  };
  raf = requestAnimationFrame(step);

  // If the tab is backgrounded mid-glide, rAF stalls — release the listeners.
  document.addEventListener("visibilitychange", function onHide() {
    if (document.hidden) {
      cancel();
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      document.removeEventListener("visibilitychange", onHide);
    }
  });
}
