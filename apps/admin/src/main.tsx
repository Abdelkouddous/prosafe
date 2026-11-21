import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/index";
import { initAccessibility } from "./lib/accessibility";

initAccessibility();

createRoot(document.getElementById("root")!).render(<App />);
