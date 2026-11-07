"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { MotionBoundary, MotionMark } from "@/components/motion";
import { ensureLiveNewsModule, LIVE_NEWS_ELEMENT, LIVE_NEWS_EXTERNAL_URL, LIVE_NEWS_LOAD_TIMEOUT_MS } from "@/lib/data/live-news";
import styles from "./live-news.module.css";

type FeedState = "loading" | "ready" | "error" | "offline" | "paused";
const statusText: Record<FeedState, string> = {
  loading: "Connecting to live market news…",
  ready: "TradingView news feed connected. Automatic updates are provided by TradingView.",
  error: "Live news couldn’t load here.",
  offline: "You’re offline. Live news is unavailable until this browser reconnects.",
  paused: "Live feed hidden.",
};

export function LiveNewsFeed() {
  const host = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const frameId = useId();
  const [state, setState] = useState<FeedState>("loading");
  const [attempt, setAttempt] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [moduleAvailable, setModuleAvailable] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container || hidden) return;
    let active = true;
    const widget = document.createElement(LIVE_NEWS_ELEMENT);
    widget.setAttribute("theme", "light");
    widget.setAttribute("news-type", "all");
    widget.setAttribute("assets-type", "all");
    widget.setAttribute("layout-mode", "flow");
    widget.setAttribute("item-size", "normal");
    widget.setAttribute("aria-label", "TradingView News Feed");

    const timer = window.setTimeout(() => {
      if (active) setState(navigator.onLine === false ? "offline" : "error");
    }, LIVE_NEWS_LOAD_TIMEOUT_MS);
    const onOffline = () => {
      if (!active) return;
      window.clearTimeout(timer);
      setState("offline");
    };
    const onOnline = () => {
      if (!active) return;
      setState("loading");
      setAttempt(value => value + 1);
    };
    const onReady = (event: Event) => {
      if (!active || event.target !== widget) return;
      if (navigator.onLine === false) { onOffline(); return; }
      window.clearTimeout(timer);
      setState("ready");
    };
    const onError = (event: Event) => {
      if (!active || event.target !== widget) return;
      window.clearTimeout(timer);
      setState(navigator.onLine === false ? "offline" : "error");
    };
    // Details supplied by the provider are untrusted; only fixed local status text is rendered.
    widget.addEventListener("tv-widget-ready", onReady);
    widget.addEventListener("tv-widget-error", onError);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    container.append(widget);
    if (navigator.onLine === false) queueMicrotask(onOffline);
    void ensureLiveNewsModule().then(() => {
      if (active) setModuleAvailable(true);
    }, () => {
      if (active) {
        window.clearTimeout(timer);
        setState(navigator.onLine === false ? "offline" : "error");
      }
    });
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      widget.removeEventListener("tv-widget-ready", onReady);
      widget.removeEventListener("tv-widget-error", onError);
      widget.remove();
    };
  }, [attempt, hidden]);

  function retry() {
    if (typeof customElements === "undefined" || !customElements.get(LIVE_NEWS_ELEMENT)) {
      // A failed ES module may be cached for this document. Reload retries its registration.
      window.location.reload();
      return;
    }
    setState("loading");
    setAttempt(value => value + 1);
  }

  function toggleVisibility() {
    setState(hidden ? "loading" : "paused");
    setHidden(value => !value);
  }

  const failed = state === "error" || state === "offline";
  return <section className={styles.card} aria-labelledby={headingId} data-live-news-state={state}>
    <header className={styles.header}>
      <div>
        <h2 id={headingId} className={styles.title}>Live market news</h2>
        <p className={styles.description}>An automatically updating feed supplied by TradingView. Story times appear in the feed. Open a headline on TradingView to check its publisher and full context.</p>
      </div>
      <div className={styles.actions}>
        <span className={styles.provider}>External news feed</span>
        <button type="button" className={styles.button} onClick={toggleVisibility} aria-expanded={!hidden} aria-controls={frameId}>{hidden ? "Show live feed" : "Hide live feed"}</button>
      </div>
    </header>
    <div id={frameId} className={styles.frame} hidden={hidden}>
      <MotionBoundary preset="news-arrival" state={state === "ready" ? "ready" : "idle"} className={styles.arrival}>
        <div ref={host} className={styles.host} data-testid="live-news-host" inert={state !== "ready"} aria-hidden={state !== "ready"} />
      </MotionBoundary>
      {state !== "ready" && state !== "paused" && <div className={styles.placeholder} aria-hidden="true">
        {state === "loading" ? <>
          <MotionMark preset="news-thumbnail" state="loading" />
          <div className={styles.animatedSkeleton}><MotionMark preset="news-skeleton" state="loading" /></div>
          <div className={styles.staticSkeleton}><MotionMark preset="news-static" state="loading" /></div>
        </> : <Newspaper size={28} strokeWidth={1.4} />}
        <strong>{state === "loading" ? "Opening the provider’s news feed…" : statusText[state]}</strong>
        <p>{state === "loading" ? "Connecting to TradingView’s external service." : "The provider may be blocked, offline, or temporarily unavailable. Retry below or open its news page."}</p>
      </div>}
    </div>
    {hidden && <div className={styles.pausedMark}><MotionMark preset="feed-paused" state="idle" /></div>}
    <footer className={styles.footer}>
      <div className={styles.provenance}>
        <p className={[styles.status, failed ? styles.error : ""].join(" ")} role={failed ? "alert" : "status"}>{statusText[state]}</p>
        <p className={styles.note}>News by <a href={LIVE_NEWS_EXTERNAL_URL} target="_blank" rel="noopener noreferrer">TradingView</a>. Delivery timing and availability depend on the provider and publishers.</p>
        <p className={styles.note}>Live headlines are separate from VAMM’s synthetic practice and simulation. VAMM adds no sentiment scores to this feed.</p>
      </div>
      <div className={styles.actions}>
        {failed && !hidden && <button type="button" className={styles.button} onClick={retry}><RefreshCw size={14} aria-hidden="true" />{moduleAvailable ? "Retry live feed" : "Reload page"}</button>}
        <a href={LIVE_NEWS_EXTERNAL_URL} target="_blank" rel="noopener noreferrer" className={styles.link}>Open news on TradingView<ExternalLink size={14} aria-hidden="true" /></a>
      </div>
    </footer>
  </section>;
}
