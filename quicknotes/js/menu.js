let current = null;

export function closeMenu() {
  if (!current) return;
  current.ul.remove();
  current.off();
  current = null;
}

/** items: [{label, run, danger?, disabled?} | "-"] */
export function showMenu(x, y, items) {
  closeMenu();
  const ul = document.createElement("ul");
  ul.className = "ctx"; ul.setAttribute("role", "menu"); ul.tabIndex = -1;

  for (const it of items) {
    const li = document.createElement("li");
    if (it === "-") { li.className = "ctx-sep"; li.setAttribute("role", "separator"); ul.append(li); continue; }
    li.setAttribute("role", "menuitem"); li.tabIndex = -1; li.textContent = it.label;
    li.classList.toggle("danger", !!it.danger);
    if (it.disabled) li.setAttribute("aria-disabled", "true");
    else li.addEventListener("click", () => { closeMenu(); it.run(); });
    ul.append(li);
  }
  document.body.append(ul);

  const r = ul.getBoundingClientRect();
  ul.style.left = `${Math.max(4, Math.min(x, innerWidth - r.width - 4))}px`;
  ul.style.top = `${Math.max(4, Math.min(y, innerHeight - r.height - 4))}px`;

  const focusables = () => [...ul.querySelectorAll("[role=menuitem]:not([aria-disabled])")];
  ul.addEventListener("keydown", e => {
    const f = focusables(), i = f.indexOf(document.activeElement);
    if (e.key === "ArrowDown") f[(i + 1) % f.length]?.focus();
    else if (e.key === "ArrowUp") f[(i - 1 + f.length) % f.length]?.focus();
    else if (e.key === "Enter" || e.key === " ") document.activeElement?.click();
    else if (e.key === "Escape") closeMenu();
    else return;
    e.preventDefault(); e.stopPropagation();
  });

  const outside = e => { if (!ul.contains(e.target)) closeMenu(); };
  addEventListener("pointerdown", outside, true);
  addEventListener("scroll", closeMenu, true);
  addEventListener("resize", closeMenu);
  addEventListener("blur", closeMenu);
  current = { ul, off() {
    removeEventListener("pointerdown", outside, true);
    removeEventListener("scroll", closeMenu, true);
    removeEventListener("resize", closeMenu);
    removeEventListener("blur", closeMenu);
  }};
  (focusables()[0] ?? ul).focus();
  return ul;
}
