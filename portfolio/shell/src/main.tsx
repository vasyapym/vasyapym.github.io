import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installChunkRecovery } from "./shell/chunk-recovery";
import "./styles.css";

// Own every scroll restore: each page sets its own offset instantly
// (pre-paint layout effects). Native popstate restoration fires after paint
// and would race/undo the `history.back()` restores (r38 navigation round).
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

installChunkRecovery();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
