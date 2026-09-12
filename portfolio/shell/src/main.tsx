import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installChunkRecovery } from "./shell/chunk-recovery";
import "./styles.css";

installChunkRecovery();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
