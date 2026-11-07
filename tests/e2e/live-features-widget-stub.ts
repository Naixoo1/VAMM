import type { Page } from "@playwright/test";

export type LiveFeatureWidgetKind = "chart" | "news" | "summary" | "comparison" | "profile" | "fundamentals" | "technical";
export interface LiveFeatureProbe {
  modules: Record<string, number>;
  configurations: { kind: string; configuration: Record<string, unknown> }[];
  connections: Record<string, number>;
}
type ProbeWindow = Window & { __vammFeatureProbe?: LiveFeatureProbe; __vammMotionSeen?: { id: string; number: number; state: string }[] };
const modules = [
  { kind: "chart", element: "tv-advanced-chart", url: "https://widgets.tradingview-widget.com/w/en/tv-advanced-chart.js" },
  { kind: "news", element: "tv-news-feed", url: "https://widgets.tradingview-widget.com/w/en/tv-news-feed.js" },
  { kind: "summary", element: "tv-market-summary", url: "https://widgets.tradingview-widget.com/w/en/tv-market-summary.js" },
  { kind: "profile", element: "tv-company-profile", url: "https://widgets.tradingview-widget.com/w/en/tv-company-profile.js" },
  { kind: "technical", element: "tv-technical-analysis", url: "https://widgets.tradingview-widget.com/w/en/tv-technical-analysis.js" },
] as const;
const embeds = [
  { kind: "comparison", url: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js" },
  { kind: "fundamentals", url: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js" },
] as const;

/** Exact-URL host fixtures only. They verify configuration/lifecycle, never real market content. */
export async function installLiveFeatureWidgetStubs(page: Page, options: { blocked?: LiveFeatureWidgetKind[]; silent?: LiveFeatureWidgetKind[] } = {}) {
  for (const item of modules) await page.route(item.url, async route => {
    if (options.blocked?.includes(item.kind)) { await route.abort("blockedbyclient"); return; }
    const silent = Boolean(options.silent?.includes(item.kind));
    await route.fulfill({ contentType: "application/javascript", headers: { "Access-Control-Allow-Origin": "*" }, body: `
      const probe = window.__vammFeatureProbe ??= { modules: {}, configurations: [], connections: {} };
      probe.modules["${item.kind}"] = (probe.modules["${item.kind}"] || 0) + 1;
      if (!customElements.get("${item.element}")) customElements.define("${item.element}", class extends HTMLElement {
        constructor() {
          super();
          const shadow = this.attachShadow({mode:"closed"});
          shadow.innerHTML = '<style>:host{display:block;width:100%;height:100%;min-width:0}div{box-sizing:border-box;padding:20px;color:#53665c;overflow-wrap:anywhere}</style><div>Deterministic ${item.kind} host stub. No provider quotes or content verified.</div>';
        }
        connectedCallback() {
          probe.connections["${item.kind}"] = (probe.connections["${item.kind}"] || 0) + 1;
          this.setAttribute("data-live-feature-stub", "${item.kind}");
          if (!${silent}) this.timer = setTimeout(() => {
            if (this.isConnected) this.dispatchEvent(new CustomEvent("tv-widget-ready", {bubbles:true,composed:true}));
          },40);
        }
        disconnectedCallback() { clearTimeout(this.timer); }
      });
    ` });
  });
  for (const item of embeds) {
    const panelUrl = "https://www.tradingview-widget.com/embed-widget/" + (item.kind === "comparison" ? "symbol-overview" : "financials") + "/?vamm-stub=1";
    await page.route(panelUrl, route => route.fulfill({contentType:"text/html",body:"<!doctype html><html><body style=\"font:14px Arial;color:#53665c\">Stub provider frame opened. Real market data is not verified.</body></html>"}));
    await page.route(item.url, async route => {
    if (options.blocked?.includes(item.kind)) { await route.abort("blockedbyclient"); return; }
    const silent = Boolean(options.silent?.includes(item.kind));
    await route.fulfill({ contentType: "application/javascript", body: `
      (() => {
        const script = document.currentScript;
        const probe = window.__vammFeatureProbe ??= { modules: {}, configurations: [], connections: {} };
        probe.modules["${item.kind}"] = (probe.modules["${item.kind}"] || 0) + 1;
        let configuration = {};
        try { configuration = JSON.parse(script.textContent || "{}"); } catch {}
        probe.configurations.push({kind:"${item.kind}",configuration});
        if (${silent} || !script.parentElement) return;
        const parent = script.parentElement;
        setTimeout(() => {
          if (!parent.isConnected) return;
          const iframe = document.createElement("iframe");
          iframe.title = "Deterministic ${item.kind} provider frame stub";
          iframe.setAttribute("data-live-feature-stub","${item.kind}");
          iframe.style.cssText = "width:100%;height:100%;border:0;display:block";
          iframe.src = "${panelUrl}";
          const mount = parent.querySelector(".tradingview-widget-container__widget");
          if (mount) mount.replaceChildren(iframe);
        },40);
      })();
    ` });
    });
  }
}
export async function readLiveFeatureProbe(page: Page): Promise<LiveFeatureProbe | undefined> {
  return page.evaluate(() => (window as ProbeWindow).__vammFeatureProbe);
}

/** Records visible production presets reached by real UI states, including brief restoration states. */
export async function captureProductionMotion(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as ProbeWindow;
    target.__vammMotionSeen = [];
    const seen = new Set<string>();
    const collect = () => {
      for (const element of document.querySelectorAll<HTMLElement>("[data-motion-preset][data-motion-number]")) {
        const bounds = element.getBoundingClientRect();
        if (!bounds.width || !bounds.height || getComputedStyle(element).visibility === "hidden") continue;
        const entry = { id: element.dataset.motionPreset ?? "", number: Number(element.dataset.motionNumber), state: element.dataset.motionState ?? "" };
        const key = JSON.stringify(entry);
        if (!seen.has(key)) { seen.add(key); target.__vammMotionSeen!.push(entry); }
      }
    };
    new MutationObserver(collect).observe(document, {subtree:true,childList:true,attributes:true,attributeFilter:["data-motion-preset","data-motion-number","data-motion-state","data-motion-static","data-motion-paused","data-motion-os-reduced","open","hidden"]});
    addEventListener("DOMContentLoaded", collect);
  });
}
export async function readProductionMotion(page: Page) {
  return page.evaluate(() => (window as ProbeWindow).__vammMotionSeen ?? []);
}
