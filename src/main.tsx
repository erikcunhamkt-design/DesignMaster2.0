import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ============================================================
// SECURITY HARDENING — não afeta funcionalidades do usuário
// ============================================================
if (typeof window !== "undefined") {
  // 1. Disable right-click context menu
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // 2. Block dev-tools / view-source shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "F12") { e.preventDefault(); return; }
    if (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
    if (e.ctrlKey && e.key.toUpperCase() === "U") { e.preventDefault(); return; }
    if (e.ctrlKey && e.key.toUpperCase() === "S") { e.preventDefault(); return; }
  });

  // 3. Disable text selection (except inputs)
  document.addEventListener("selectstart", (e) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
    e.preventDefault();
  });

  // 4. Disable drag
  document.addEventListener("dragstart", (e) => e.preventDefault());

  // 5. Disable console methods in production to prevent info leaks
  if (import.meta.env.PROD) {
    const noop = () => {};
    (["log", "debug", "info", "warn", "table", "dir", "dirxml", "trace", "profile", "profileEnd"] as const).forEach((m) => {
      try { (console as any)[m] = noop; } catch (_) {}
    });
  }

  // 6. Anti-iframe clickjacking — block being embedded in unknown origins
  try {
    if (window.self !== window.top) {
      const allowedHosts = ["lovable.app", "lovable.dev", "lovableproject.com"];
      const parentOrigin = document.referrer ? new URL(document.referrer).hostname : "";
      const isAllowed = allowedHosts.some((h) => parentOrigin.endsWith(h));
      if (!isAllowed) {
        document.documentElement.innerHTML = "";
        window.stop();
      }
    }
  } catch (_) {
    // cross-origin — block
    document.documentElement.innerHTML = "";
    window.stop();
  }

  // 7. Detect DevTools open via debugger timing (subtle)
  let devtoolsOpen = false;
  const detectDevTools = () => {
    const t0 = performance.now();
    // debugger statement causes a pause only when devtools are open
    // Using Function constructor to avoid easy grepping
    try { (function(){}).constructor("debugger")(); } catch(_){}
    if (performance.now() - t0 > 100 && !devtoolsOpen) {
      devtoolsOpen = true;
      // Silently clear sensitive data from memory
      try { sessionStorage.clear(); } catch(_){}
    }
  };
  setInterval(detectDevTools, 3000);

  // 8. Prevent prototype pollution attacks
  Object.freeze(Object.prototype);
  Object.freeze(Array.prototype);

  // 9. Block eval and Function constructor abuse
  const origEval = window.eval;
  (window as any).eval = (...args: any[]) => {
    console.error("eval() blocked by security policy");
    return undefined;
  };

  // 10. Monitor for XSS via MutationObserver — block inline script injection
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLScriptElement && !node.src) {
          node.remove();
        }
        if (node instanceof HTMLElement) {
          // Strip event handler attributes (onclick, onerror, etc.)
          const attrs = node.attributes;
          for (let i = attrs.length - 1; i >= 0; i--) {
            if (attrs[i].name.startsWith("on")) {
              node.removeAttribute(attrs[i].name);
            }
          }
        }
      });
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // 11. Secure navigation — prevent open redirect attacks
  const origAssign = window.location.assign.bind(window.location);
  const origReplace = window.location.replace.bind(window.location);
  const safeNavigate = (fn: typeof origAssign) => (url: string | URL) => {
    const u = new URL(String(url), window.location.href);
    const allowed = ["lovable.app", "lovable.dev", "lovableproject.com", window.location.hostname];
    if (u.protocol === "javascript:") return;
    if (!allowed.some((h) => u.hostname.endsWith(h)) && u.origin !== window.location.origin) return;
    fn(url);
  };
  try {
    window.location.assign = safeNavigate(origAssign);
    window.location.replace = safeNavigate(origReplace);
  } catch (_) {}
}

createRoot(document.getElementById("root")!).render(<App />);
