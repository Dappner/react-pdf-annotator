import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppQuoteDemo } from "./AppQuoteDemo";

// biome-ignore lint/style/noNonNullAssertion: Root element must be there
const container = document.getElementById("root")!;
const root = createRoot(container);
const demo = import.meta.env.VITE_DEMO;
root.render(demo === "quote" ? <AppQuoteDemo /> : <App />);
