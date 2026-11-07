import type { Page } from "@playwright/test";
/** A deterministic external-widget host fixture; never represents live prices. */
export async function installTradingViewStub(page: Page) {
  await page.route("https://widgets.tradingview-widget.com/w/en/tv-advanced-chart.js", route => route.fulfill({
    contentType: "application/javascript", headers: { "Access-Control-Allow-Origin": "*" },
    body: `if(!customElements.get("tv-advanced-chart"))customElements.define("tv-advanced-chart",class extends HTMLElement{connectedCallback(){this.attachShadow({mode:"closed"}).innerHTML='<style>:host{display:block;width:100%;height:100%}div{display:grid;place-items:center;height:100%;background:#111722;color:#e3eaf1;font:13px Arial;padding:16px;box-sizing:border-box;text-align:center}</style><div>Chart integration fixture · no live market data</div>';queueMicrotask(()=>{if(this.isConnected)this.dispatchEvent(new CustomEvent("tv-widget-ready",{bubbles:true,composed:true}))})}});`
  }));
}
