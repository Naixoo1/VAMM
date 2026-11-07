"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { MotionBoundary, MotionMark } from "@/components/motion";
import { ensureTradingViewWidget, getTradingViewWidgetSpec, LIVE_WIDGET_TIMEOUT_MS } from "@/lib/data/tradingview-widgets";
import type { LiveCompanySymbol, LiveWidgetKind, TradingViewWidgetSpec } from "@/lib/data/tradingview-widgets";
import styles from "./live-market-widget.module.css";

type PanelState = "loading" | "ready" | "panel" | "error" | "offline" | "paused";
interface Props { kind: LiveWidgetKind; symbol?: LiveCompanySymbol; comparison?: LiveCompanySymbol }
export function LiveMarketWidget({ kind, symbol = "NASDAQ:AAPL", comparison = "NASDAQ:MSFT" }: Props) {
  const spec = useMemo(() => getTradingViewWidgetSpec(kind, symbol, comparison), [kind, symbol, comparison]);
  // Selecting a different company deliberately replaces the provider instance and its loading state.
  return <WidgetInstance key={JSON.stringify(spec)} spec={spec} />;
}

function WidgetInstance({ spec }: { spec: TradingViewWidgetSpec }) {
  const host = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const frameId = useId();
  const [state, setState] = useState<PanelState>("loading");
  const [attempt, setAttempt] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [moduleAvailable, setModuleAvailable] = useState(false);
  const [retryRequested, setRetryRequested] = useState(false);
  useEffect(() => {
    const container = host.current;
    if (!container || hidden) return;
    let active = true;
    let loadFinished = false;
    let timer: number | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    let removeProvider = () => {};
    const stopWaiting = () => { loadFinished = true; window.clearTimeout(timer); visibilityObserver?.disconnect(); };
    const fail = () => { if (active) { stopWaiting(); setState(navigator.onLine === false ? "offline" : "error"); } };
    const startDeadline = () => { if (active && !loadFinished && timer === undefined) timer = window.setTimeout(fail, LIVE_WIDGET_TIMEOUT_MS); };
    // Provider components may defer data until visible. Offscreen waiting is not an outage.
    if (typeof IntersectionObserver === "function") {
      visibilityObserver = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) startDeadline(); });
      visibilityObserver.observe(container);
    } else startDeadline();
    const onOffline = () => { if (active) { stopWaiting(); setState("offline"); } };
    const onOnline = () => { if (active) { setState("loading"); setAttempt(value => value + 1); } };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    if (navigator.onLine === false) queueMicrotask(onOffline);

    if (spec.format === "web-component") {
      const widget = document.createElement(spec.element);
      for (const [name, value] of Object.entries(spec.attributes)) widget.setAttribute(name, value);
      widget.setAttribute("aria-label", "TradingView " + spec.title);
      const ready = (event: Event) => {
        if (!active || event.target !== widget) return;
        if (navigator.onLine === false) { onOffline(); return; }
        stopWaiting();
        setState("ready");
      };
      const error = (event: Event) => { if (event.target === widget) fail(); };
      widget.addEventListener("tv-widget-ready", ready);
      widget.addEventListener("tv-widget-error", error);
      container.append(widget);
      void ensureTradingViewWidget(spec).then(() => { if (active) setModuleAvailable(true); }, fail);
      removeProvider = () => {
        widget.removeEventListener("tv-widget-ready", ready);
        widget.removeEventListener("tv-widget-error", error);
        widget.remove();
      };
    } else {
      const wrapper = document.createElement("div");
      wrapper.className = "tradingview-widget-container";
      const mount = document.createElement("div");
      mount.className = "tradingview-widget-container__widget";
      mount.style.width = "100%";
      mount.style.height = "100%";
      wrapper.append(mount);
      const copyright = document.createElement("div");
      copyright.className = "tradingview-widget-copyright";
      const sourceLink = document.createElement("a");
      sourceLink.href = spec.externalUrl;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer nofollow";
      sourceLink.textContent = spec.title + " by TradingView";
      copyright.append(sourceLink);
      wrapper.append(copyright);
      const opened = (event: Event) => {
        if (!active || !(event.target instanceof HTMLIFrameElement) || !wrapper.contains(event.target)) return;
        try {
          const url = new URL(event.target.src);
          if (!["https://www.tradingview.com", "https://www.tradingview-widget.com"].includes(url.origin) || !url.pathname.startsWith("/embed-widget/")) return;
        } catch { return; }
        event.target.title = "TradingView " + spec.title;
        if (navigator.onLine === false) { onOffline(); return; }
        stopWaiting();
        setState("panel");
      };
      // Iframe document load is only panel-opening evidence, never evidence of fresh quote data.
      wrapper.addEventListener("load", opened, true);
      const script = document.createElement("script");
      script.src = spec.scriptUrl;
      script.type = "text/javascript";
      script.async = true;
      script.textContent = JSON.stringify(spec.configuration);
      script.dataset.vammLiveWidgetEmbed = spec.kind;
      script.addEventListener("error", fail);
      wrapper.append(script);
      container.append(wrapper);
      removeProvider = () => {
        wrapper.removeEventListener("load", opened, true);
        script.removeEventListener("error", fail);
        wrapper.remove();
      };
    }
    return () => {
      active = false;
      stopWaiting();
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      removeProvider();
    };
  }, [spec, attempt, hidden]);

  function retry() {
    if (state === "loading") return;
    if (spec.format === "web-component" && (typeof customElements === "undefined" || !customElements.get(spec.element))) {
      window.location.reload();
      return;
    }
    setRetryRequested(true);
    setState("loading");
    setAttempt(value => value + 1);
  }
  function toggle() { setState(hidden ? "loading" : "paused"); setHidden(value => !value); }
  const failed = state === "error" || state === "offline";
  const usable = state === "ready" || state === "panel";
  const status = state === "loading" ? "Connecting to TradingView…" :
    state === "ready" ? "TradingView panel ready. Provider data and timing apply." :
    state === "panel" ? "Provider panel opened. Check the panel for data availability and timing." :
    state === "paused" ? "Live panel hidden." :
    state === "offline" ? "You’re offline. The live panel is unavailable until this browser reconnects." :
    "This live panel couldn’t load here.";
  return <MotionBoundary preset="content-arrival" state={state === "paused" ? "idle" : failed ? "error" : usable ? "ready" : "loading"} motionKey={state}><section className={styles.card} aria-labelledby={headingId} data-live-market-kind={spec.kind} data-live-market-state={state} data-motion-surface="provider">
    <header className={styles.header}>
      <div><h2 id={headingId} className={styles.title}>{spec.title}</h2><p className={styles.description}>{spec.description}</p></div>
      <div className={styles.actions}><span className={styles.provider}>External market data</span><button type="button" className={styles.button} aria-expanded={!hidden} aria-controls={frameId} onClick={toggle}>{hidden ? "Show live panel" : "Hide live panel"}</button></div>
    </header>
    <div id={frameId} className={[styles.frame, styles[spec.kind]].join(" ")} hidden={hidden}>
      <div ref={host} className={styles.host} data-testid={"live-" + spec.kind + "-host"} inert={!usable} aria-hidden={!usable} />
      {!usable && state !== "paused" && <div className={styles.placeholder} aria-hidden="true">
        {state === "loading" && <MotionMark preset={spec.kind === "summary" ? "reference-helix" : "query-inline"} state="loading" label={"Opening " + spec.title} />}
        <strong>{state === "loading" ? "Opening the provider’s panel…" : status}</strong>
        <p>{state === "loading" ? "Connecting to the external provider." : "The provider may be blocked or unavailable. Retry below or open its website."}</p>
      </div>}
    </div>
    <footer className={styles.footer}>
      <div className={styles.provenance}>
        <p className={[styles.status, failed ? styles.error : ""].join(" ")} role={failed ? "alert" : "status"}>{status}</p>
        <p className={styles.note}>{spec.currencyNote} Check the provider’s market status, chart range, or reporting period for timing.</p>
        {spec.kind === "technical" && <p className={styles.note}>Technical labels are TradingView’s indicator summaries, not VAMM recommendations or AI answers.</p>}
        <p className={styles.note}>Data by <a href={spec.externalUrl} target="_blank" rel="noopener noreferrer">TradingView</a> · Separate from synthetic learning and simulation calculations.</p>
      </div>
      <div className={styles.actions}>
        {(failed || retryRequested || (spec.format === "iframe" && state === "panel")) && !hidden && <button type="button" className={styles.button} aria-disabled={state === "loading"} onClick={retry}><RefreshCw size={14} aria-hidden="true" />{state === "loading" ? "Reconnecting live panel…" : spec.format === "web-component" && !moduleAvailable ? "Reload page" : failed || state === "panel" ? "Retry live panel" : "Refresh live panel"}</button>}
        <a href={spec.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>Open on TradingView<ExternalLink size={14} aria-hidden="true" /></a>
      </div>
    </footer>
  </section></MotionBoundary>;
}
