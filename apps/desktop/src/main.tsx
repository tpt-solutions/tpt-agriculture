import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setDb } from "@tpt/core";
import { getDb } from "./db";
import App from "./App";
import "./index.css";

async function main() {
  const db = await getDb();
  setDb(db as Parameters<typeof setDb>[0]);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

main();
