"use client";
import type {CSSProperties,ReactNode} from "react";
import {resolveMotionPreset,type MotionKind,type MotionState} from "@/lib/motion/presets";
import {useMotionPreferences} from "./preferences";
import styles from "./motion.module.css";

export interface MotionMarkProps {preset:string;state?:MotionState;label?:string;className?:string}
export interface MotionBoundaryProps extends MotionMarkProps {children:ReactNode;motionKey?:string|number}
function Artwork({kind}:{kind:MotionKind}){
 if(kind==="focus")return null;
 if(kind==="check")return <svg className={styles.artwork} data-motion-artwork="" viewBox="0 0 64 32" aria-hidden="true"><circle cx="32" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity=".45"/><path d="m26 16 4 4 9-9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
 if(kind==="skeleton")return <svg className={styles.artwork} data-motion-artwork="" viewBox="0 0 64 32" aria-hidden="true"><g opacity=".35"><rect x="4" y="5" width="56" height="3" rx="1.5"/><rect x="4" y="14" width="42" height="3" rx="1.5"/><rect x="4" y="23" width="49" height="3" rx="1.5"/></g><g className={styles.sweep}><rect x="4" y="5" width="11" height="3" rx="1.5"/><rect x="4" y="14" width="9" height="3" rx="1.5"/><rect x="4" y="23" width="12" height="3" rx="1.5"/></g></svg>;
 if(kind==="orbit")return <svg className={styles.artwork} data-motion-artwork="" viewBox="0 0 64 32" aria-hidden="true"><g className={styles.orbit}>{Array.from({length:12},(_,index)=>{const angle=index/12*Math.PI*2;return <circle key={index} cx={(32+Math.cos(angle)*19).toFixed(3)} cy={(16+Math.sin(angle)*9).toFixed(3)} r={index%3===0?1.5:1} opacity={.4+index/24}/>})}</g><circle cx="32" cy="16" r="1.3" opacity=".65"/></svg>;
 if(kind==="line")return <svg className={styles.artwork} data-motion-artwork="" viewBox="0 0 64 32" aria-hidden="true"><path d="M5 16h54" stroke="currentColor" strokeWidth=".7" opacity=".25"/><g className={styles.signal}>{Array.from({length:14},(_,index)=><circle key={index} cx={6+index*4} cy={(16+Math.sin(index*Math.PI/3)*2).toFixed(3)} r={index%4===0?1.2:.8} opacity=".8"/>)}</g></svg>;
 if(kind==="grain")return <svg className={styles.artwork} data-motion-artwork="" viewBox="0 0 64 32" aria-hidden="true">{Array.from({length:20},(_,index)=><circle key={index} cx={13+(index*17%39)} cy={5+(index*11%22)} r={index%3===0?1.1:.7} opacity={.3+index%5*.12}/>)}</svg>;
 return <svg className={styles.artwork} data-motion-artwork="" viewBox="0 0 64 32" aria-hidden="true"><g className={styles.helix}>{Array.from({length:16},(_,index)=>{const x=5+index*3.6;const y=Math.sin(index/15*Math.PI*3)*8;return <g key={index}><circle cx={x.toFixed(3)} cy={(16+y).toFixed(3)} r=".9" opacity=".85"/><circle cx={x.toFixed(3)} cy={(16-y).toFixed(3)} r=".75" opacity=".5"/>{index%5===0&&<path d={"M"+x.toFixed(3)+" "+(16-y).toFixed(3)+"v"+(y*2).toFixed(3)} stroke="currentColor" strokeWidth=".55" strokeDasharray="1 2" opacity=".3"/>}</g>})}</g></svg>;
}
function usePresentation(presetId:string,state:MotionState){
 const{id,preset}=resolveMotionPreset(presetId);const preferences=useMotionPreferences();
 const eligible=preset.behavior==="loop"?state==="loading":preset.behavior==="arrival"?state==="ready":false;
 return{id,preset,preferences,eligible,running:eligible&&!preferences.effectiveStatic&&!preferences.paused};
}
export function MotionMark({preset:presetId,state="loading",label,className}:MotionMarkProps){
 const{id,preset,preferences,eligible,running}=usePresentation(presetId,state);
 return <span className={[styles.mark,preset.compact?styles.compact:"",className??""].join(" ")} data-motion-preset={id} data-motion-number={preset.number} data-motion-state={state} data-motion-kind={preset.kind} data-motion-behavior={preset.behavior} data-motion-palette={preset.palette} data-motion-eligible={eligible} data-motion-running={running} data-motion-static={preferences.effectiveStatic} data-motion-paused={preferences.paused} style={{"--motion-duration":preset.seconds+"s"} as CSSProperties} aria-hidden={label?undefined:true}>
  <span className={styles.decorative} aria-hidden="true"><Artwork kind={preset.kind}/></span>{label&&<span className={styles.label}>{label}</span>}
 </span>;
}
export function MotionBoundary({preset:presetId,state="ready",label,className,children,motionKey}:MotionBoundaryProps){
 const{id,preset,preferences,eligible,running}=usePresentation(presetId,state);
 return <div className={[styles.boundary,className??""].join(" ")} data-motion-preset={id} data-motion-number={preset.number} data-motion-state={state} data-motion-kind={preset.kind} data-motion-behavior={preset.behavior} data-motion-palette={preset.palette} data-motion-eligible={eligible} data-motion-running={running} data-motion-static={preferences.effectiveStatic} data-motion-paused={preferences.paused} style={{"--motion-duration":preset.seconds+"s"} as CSSProperties}>
  <span key={motionKey} className={styles.boundaryAccent} aria-hidden="true"><Artwork kind={preset.kind}/></span>
  {children}{label&&<span className={styles.boundaryLabel}>{label}</span>}
 </div>;
}
