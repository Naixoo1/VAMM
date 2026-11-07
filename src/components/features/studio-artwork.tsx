"use client";
import {useEffect,useId,useRef,useState,useSyncExternalStore} from "react";
import {useMotionPreferences} from "@/components/motion";
import styles from "./studio-artwork.module.css";

function subscribeVisibility(listener:()=>void){if(typeof document==="undefined")return()=>{};document.addEventListener("visibilitychange",listener);return()=>document.removeEventListener("visibilitychange",listener)}
function pageVisible(){return typeof document!=="undefined"&&!document.hidden}

/** Decorative learning motif. No chart data, persistence, requests or application actions. */
export function StudioArtwork({className}:{className?:string}){
 const root=useRef<HTMLDivElement>(null);const[visible,setVisible]=useState(false);const id=useId();
 const documentVisible=useSyncExternalStore(subscribeVisibility,pageVisible,()=>false);
 const{effectiveStatic,paused}=useMotionPreferences();const running=visible&&documentVisible&&!effectiveStatic&&!paused;
 useEffect(()=>{
  const element=root.current;if(!element||typeof IntersectionObserver==="undefined")return;
  let active=true;const observer=new IntersectionObserver(entries=>{if(active)setVisible(entries.some(entry=>entry.isIntersecting))},{threshold:.05});observer.observe(element);
  return()=>{active=false;observer.disconnect()};
 },[]);
 const panel=id+"-panel",chart=id+"-illustration";
 return <div ref={root} className={[styles.artwork,className??""].join(" ")} data-studio-artwork="" data-studio-running={running} data-studio-static={effectiveStatic} aria-hidden="true">
  <svg viewBox="0 0 520 420" fill="none" focusable="false">
   <defs><linearGradient id={panel} x1="148" y1="117" x2="368" y2="306" gradientUnits="userSpaceOnUse"><stop stopColor="#243747"/><stop offset="1" stopColor="#142332"/></linearGradient><linearGradient id={chart} x1="0" y1="196" x2="0" y2="272" gradientUnits="userSpaceOnUse"><stop stopColor="#8df0d2" stopOpacity=".28"/><stop offset="1" stopColor="#8df0d2" stopOpacity="0"/></linearGradient></defs>
   <circle cx="260" cy="210" r="142" fill="#8df0d2" fillOpacity=".025"/>
   <g data-studio-part="ring" className={styles.ring}><circle cx="260" cy="210" r="157" stroke="#8df0d2" strokeOpacity=".28" strokeDasharray="160 24 6 24"/></g>
   <g data-studio-part="ring" className={[styles.ring,styles.outerRing].join(" ")}><circle cx="260" cy="210" r="192" stroke="#b0c1d2" strokeOpacity=".23" strokeDasharray="2 11"/></g>
   <path d="M68 210h384M260 18v384" stroke="#a9c7d9" strokeOpacity=".12" strokeDasharray="4 8"/>
   <g data-studio-part="core" className={styles.core}>
    <rect x="146" y="116" width="228" height="191" rx="22" fill={"url(#"+panel+")"} stroke="#8df0d2" strokeOpacity=".35"/>
    <circle cx="168" cy="139" r="3" fill="#ffae79"/><circle cx="179" cy="139" r="3" fill="#8df0d2" fillOpacity=".6"/><circle cx="190" cy="139" r="3" fill="#8df0d2" fillOpacity=".25"/>
    <text x="168" y="170" fill="#e7f5f1" fontSize="14" fontWeight="600">Practice, not prediction</text><text x="168" y="188" fill="#b1c8d0" fontSize="10" letterSpacing="1.5">A SPACE TO EXPERIMENT</text>
    <path d="M168 211h184m-184 28h184m-184 28h184" stroke="#b4d9d1" strokeOpacity=".12"/>
    <path d="m168 251 23-13 23 8 24-27 23 10 24-29 22 13 23-8 22 16v51H168Z" fill={"url(#"+chart+")"}/>
    <g data-studio-part="signal" className={styles.signal}><path d="m168 251 23-13 23 8 24-27 23 10 24-29 22 13 23-8 22 16" stroke="#8df0d2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="352" cy="221" r="5" fill="#8df0d2" stroke="#203444" strokeWidth="3"/></g>
    <text x="168" y="288" fill="#b1c8d0" fontSize="11">Illustrative learning path</text><path d="m332 282 5 5 11-11" stroke="#ffae79" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
   </g>
   <g data-studio-part="token" className={styles.token}>
    <rect x="40" y="62" width="155" height="65" rx="16" fill="#e2f8ef"/><rect x="53" y="75" width="39" height="39" rx="12" fill="#c7eadc"/><path d="M73 85v20m0-18c-5-4-10-3-13-2v16c4-1 8 0 13 4 5-4 9-5 13-4V85c-3-1-8-2-13 2Z" stroke="#1b6651" strokeWidth="1.8" strokeLinejoin="round"/><text x="103" y="88" fill="#2e6e58" fontSize="10" letterSpacing="1.2">STAY CURIOUS</text><text x="103" y="108" fill="#163f34" fontSize="19" fontWeight="600">Learn</text>
   </g>
   <g data-studio-part="token" className={[styles.token,styles.practice].join(" ")}>
    <rect x="360" y="167" width="150" height="65" rx="16" fill="#ffdec6"/><rect x="373" y="180" width="39" height="39" rx="12" fill="#f7c7a6"/><path d="M382 207v-6m10 6v-18m10 18v-12" stroke="#8e4c2f" strokeWidth="3" strokeLinecap="round"/><text x="423" y="193" fill="#805037" fontSize="10" letterSpacing="1.2">TRY AN IDEA</text><text x="423" y="213" fill="#573825" fontSize="19" fontWeight="600">Practice</text>
   </g>
   <g data-studio-part="token" className={[styles.token,styles.reflect].join(" ")}>
    <rect x="81" y="309" width="166" height="65" rx="16" fill="#e1e7ff"/><rect x="94" y="322" width="39" height="39" rx="12" fill="#cbd5f5"/><path d="M107 346c-8-9 7-17 13-9 4 5-2 9-2 13h-9v-4Zm3 8h7" stroke="#4e5790" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><text x="144" y="335" fill="#4e5b8b" fontSize="10" letterSpacing="1.2">CONNECT DOTS</text><text x="144" y="355" fill="#384368" fontSize="19" fontWeight="600">Reflect</text>
   </g>
   <g data-studio-part="speck" className={styles.specks}><circle cx="350" cy="55" r="6" fill="#8df0d2"/><circle cx="399" cy="335" r="4" fill="#ffae79"/><circle cx="70" cy="231" r="4" fill="#becbff"/><path d="M418 84v14m-7-7h14M295 354v10m-5-5h10" stroke="#8df0d2" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round"/></g>
  </svg>
 </div>;
}
