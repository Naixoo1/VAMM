"use client";
import {useEffect,useId,useRef,useState} from "react";
import {ArrowUpRight,ChartNoAxesCombined,RefreshCw} from "lucide-react";
import {MotionMark} from "@/components/motion";
import styles from "./tradingview-chart.module.css";
export const TRADINGVIEW_MODULE_URL="https://widgets.tradingview-widget.com/w/en/tv-advanced-chart.js";
export const TRADINGVIEW_LOAD_TIMEOUT_MS=20_000;
const ELEMENT_NAME="tv-advanced-chart";
// The provider owns selection inside its closed UI. This link explicitly opens the default.
const DEFAULT_CHART_URL="https://www.tradingview.com/chart/?symbol=NASDAQ%3AAAPL";
let registration:Promise<void>|undefined;
/** One browser registration serves dashboard/market instances and route remounts. */
function ensureTradingViewModule():Promise<void>{
 if(customElements.get(ELEMENT_NAME))return Promise.resolve();
 if(registration)return registration;
 registration=new Promise<void>((resolve,reject)=>{
  let script=Array.from(document.scripts).find(item=>item.src===TRADINGVIEW_MODULE_URL);
  const isNew=!script;
  if(!script){script=document.createElement("script");script.type="module";script.src=TRADINGVIEW_MODULE_URL;script.dataset.vammTradingviewModule=""}
  const moduleScript=script;
  const onError=()=>{moduleScript.dataset.vammTradingviewState="failed";reject(new Error("TradingView module unavailable"))};
  moduleScript.addEventListener("error",onError,{once:true});
  void customElements.whenDefined(ELEMENT_NAME).then(()=>{moduleScript.dataset.vammTradingviewState="registered";moduleScript.removeEventListener("error",onError);resolve()});
  if(moduleScript.dataset.vammTradingviewState==="failed")onError();else if(isNew)document.head.append(moduleScript);
 });
 return registration;
}
type ChartState="loading"|"ready"|"error";
export function TradingViewChart({variant="market"}:{variant?:"market"|"dashboard"}){
 const host=useRef<HTMLDivElement>(null);const headingId=useId();
 const[attempt,setAttempt]=useState(0);const[state,setState]=useState<ChartState>("loading");const[moduleAvailable,setModuleAvailable]=useState(false);const[retryRequested,setRetryRequested]=useState(false);
 useEffect(()=>{
  const container=host.current;if(!container)return;let active=true;
  const widget=document.createElement(ELEMENT_NAME);
  widget.setAttribute("symbol","NASDAQ:AAPL");widget.setAttribute("interval","1D");widget.setAttribute("theme","dark");widget.setAttribute("allow-symbol-change","");widget.setAttribute("aria-label","TradingView Advanced Chart");
  let timer:number|undefined;let settled=false;
  const clearTimer=()=>{window.clearTimeout(timer);timer=undefined};
  const startTimer=()=>{if(!active||settled||timer!==undefined)return;timer=window.setTimeout(()=>{if(active&&!settled){settled=true;setState("error")}},TRADINGVIEW_LOAD_TIMEOUT_MS)};
  // The provider defers chart work outside the viewport. Do not time out a hidden panel.
  const visibility=typeof IntersectionObserver==="undefined"?null:new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))startTimer();else clearTimer()});
  if(visibility)visibility.observe(container);else startTimer();
  const onReady=(event:Event)=>{if(event.target!==widget||!active)return;settled=true;clearTimer();setState("ready")};
  const onError=(event:Event)=>{if(event.target!==widget||!active)return;settled=true;clearTimer();setState("error")};
  // Provider event details are untrusted. The UI always shows fixed fallback text.
  widget.addEventListener("tv-widget-ready",onReady);widget.addEventListener("tv-widget-error",onError);
  container.append(widget);
  void ensureTradingViewModule().then(()=>{if(active)setModuleAvailable(true)},()=>{if(active){settled=true;clearTimer();setState("error")}});
  return()=>{active=false;clearTimer();visibility?.disconnect();widget.removeEventListener("tv-widget-ready",onReady);widget.removeEventListener("tv-widget-error",onError);widget.remove()};
 },[attempt]);
 function retry(){
  if(state==="loading")return;
  if(!customElements.get(ELEMENT_NAME)){
   // Failed ES modules can remain cached in this document's module map.
   // Explicit reload starts a fresh registration attempt without changing app data.
   window.location.reload();return;
  }
  setRetryRequested(true);setState("loading");setAttempt(value=>value+1);
 }
 return <section className={[styles.card,variant==="dashboard"?styles.dashboard:""].join(" ")} aria-labelledby={headingId} data-tradingview-state={state} data-motion-surface="provider">
  <header className={styles.header}><div><h2 id={headingId} className={styles.title}>TradingView market chart</h2><p className={styles.description}>Starts with NASDAQ:AAPL · Daily interval · Change symbols inside the chart</p></div><span className={styles.external}>External market data</span></header>
  <div className={styles.frame}><div ref={host} className={styles.host} data-testid="tradingview-host"/>{state!=="ready"&&<div className={styles.placeholder} aria-hidden="true">{state==="loading"?<><MotionMark preset="chart-loading" state="loading"/><p>Loading TradingView chart…</p></>:<><ChartNoAxesCombined size={28} strokeWidth={1.4}/><strong>TradingView couldn’t load this chart here.</strong><p className={styles.hint}>The provider may be blocked or temporarily unavailable. Retry below, or open the chart on TradingView.</p></>}</div>}</div>
  <footer className={styles.footer}><div className={styles.provenance}><p className={[styles.status,state==="error"?styles.error:""].join(" ")} role={state==="error"?"alert":"status"}>{state==="loading"?"Loading TradingView chart…":state==="ready"?"Chart loaded by TradingView.":"TradingView couldn’t load this chart here."}</p><p>Chart by <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView</a> · Quotes may be delayed. The selected instrument determines the chart currency.</p><p>This external chart is separate from VAMM’s synthetic baskets and simulation calculations.</p><p>The external link opens the default AAPL chart; symbol changes inside this panel stay with TradingView.</p></div><div className={styles.actions}>{(state==="error"||retryRequested)&&<button type="button" className={styles.button} aria-disabled={state==="loading"} onClick={retry}><RefreshCw size={14} aria-hidden="true"/>{state==="loading"?"Reconnecting chart…":!moduleAvailable?"Reload page":state==="error"?"Retry chart":"Refresh chart"}</button>}<a href={DEFAULT_CHART_URL} target="_blank" rel="noreferrer" className={styles.link}>Open default AAPL on TradingView <ArrowUpRight size={14} aria-hidden="true"/></a></div></footer>
 </section>
}
