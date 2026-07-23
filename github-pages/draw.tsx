import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DrawingPage from "../app/draw/page";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DrawingPage />
  </StrictMode>,
);
