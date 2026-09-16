export function initDrawer({ drawer, backdrop, edge, toggle, main, mq = "(max-width: 760px)" }) {
  const media = matchMedia(mq);
  let opened = false, lastFocus = null, drag = null;
  const width = () => drawer.getBoundingClientRect().width;

  function set(open) {
    opened = open && media.matches;
    drawer.classList.toggle("open", opened);
    backdrop.classList.toggle("show", opened);
    drawer.classList.remove("dragging"); backdrop.classList.remove("dragging");
    drawer.style.transform = ""; backdrop.style.opacity = "";
    toggle.setAttribute("aria-expanded", String(opened));
    main?.toggleAttribute("inert", opened);
    document.body.classList.toggle("drawer-lock", opened);
    if (opened) {
      lastFocus = document.activeElement;
      (drawer.querySelector("a,button,input,[tabindex]:not([tabindex=\"-1\"])") ?? drawer).focus({ preventScroll: true });
    } else if (lastFocus && media.matches) { lastFocus.focus?.({ preventScroll: true }); lastFocus = null; }
  }
  const open = () => set(true), close = () => set(false), toggleFn = () => set(!opened);

  toggle.addEventListener("click", toggleFn);
  backdrop.addEventListener("click", close);
  media.addEventListener("change", () => set(false));

  /* swipe: edge-open, drawer/backdrop-close */
  const onDown = e => {
    if (!media.matches || e.pointerType === "mouse") return;
    const from = opened ? (drawer.contains(e.target) || e.target === backdrop) : e.target === edge;
    if (!from) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), dir: null };
  };
  const onMove = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.dir) { if (Math.hypot(dx, dy) < 8) return; drag.dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v"; }
    if (drag.dir !== "h") return;
    e.preventDefault();
    const w = width();
    const x = opened ? Math.min(0, dx) : Math.min(0, dx - w);
    drawer.classList.add("dragging"); backdrop.classList.add("dragging", "show");
    drawer.style.transform = `translateX(${x}px)`;
    backdrop.style.opacity = String(1 + x / w);
  };
  const onUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (d.dir !== "h") return set(opened);
    const dx = e.clientX - d.x, v = dx / Math.max(1, performance.now() - d.t), w = width();
    set(opened ? !(dx < -w / 3 || v < -0.5) : (dx > w / 3 || v > 0.5));
  };
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointermove", onMove, { passive: false });
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", () => { drag = null; set(opened); });

  return { open, close, toggle: toggleFn, get isOpen() { return opened; } };
}
