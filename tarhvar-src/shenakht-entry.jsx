// shenakht-entry.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

let root = null;
let containerEl = null;

window.ShenakhtApp = {
  mount(element) {
    containerEl = element;
    root = createRoot(element);
    root.render(React.createElement(App));
  },
  unmount() {
    if (root) {
      root.unmount();
      root = null;
    }
    if (containerEl) {
      containerEl.innerHTML = "";
      containerEl = null;
    }
  }
};
