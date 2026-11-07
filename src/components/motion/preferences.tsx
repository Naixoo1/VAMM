"use client";
import {createContext,useCallback,useContext,useId,useMemo,useState,useSyncExternalStore,type ReactNode} from "react";
import styles from "./motion.module.css";

const query="(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange:()=>void){
 if(typeof window==="undefined"||typeof window.matchMedia!=="function")return()=>{};
 const media=window.matchMedia(query);
 media.addEventListener("change",onChange);
 return()=>media.removeEventListener("change",onChange);
}
function reducedSnapshot(){return typeof window==="undefined"||typeof window.matchMedia!=="function"||window.matchMedia(query).matches}
interface Preferences {reducedMotion:boolean;staticMode:boolean;effectiveStatic:boolean;paused:boolean;setStaticMode:(value:boolean)=>void;setPaused:(value:boolean)=>void;toggleStaticMode:()=>void;togglePaused:()=>void}
const noop=()=>{};
const safeDefaults:Preferences={reducedMotion:true,staticMode:false,effectiveStatic:true,paused:false,setStaticMode:noop,setPaused:noop,toggleStaticMode:noop,togglePaused:noop};
const Context=createContext<Preferences|null>(null);
export function MotionPreferenceProvider({children}:{children:ReactNode}){
 const reducedMotion=useSyncExternalStore(subscribeReduced,reducedSnapshot,()=>true);
 const[staticMode,setStaticMode]=useState(false);const[paused,setPaused]=useState(false);
 const toggleStaticMode=useCallback(()=>setStaticMode(value=>!value),[]);
 const togglePaused=useCallback(()=>setPaused(value=>!value),[]);
 const value=useMemo(()=>({reducedMotion,staticMode,effectiveStatic:reducedMotion||staticMode,paused,setStaticMode,setPaused,toggleStaticMode,togglePaused}),[reducedMotion,staticMode,paused,toggleStaticMode,togglePaused]);
 return <Context.Provider value={value}><div className={styles.scope} data-motion-scope="" data-motion-static={value.effectiveStatic} data-motion-paused={paused} data-motion-os-reduced={reducedMotion}>{children}</div></Context.Provider>;
}
export function useMotionPreferences(){return useContext(Context)??safeDefaults}
export function MotionControls({className}:{className?:string}){
 const context=useContext(Context);const noteId=useId();if(!context)return null;
 const{effectiveStatic,paused,reducedMotion,togglePaused,toggleStaticMode}=context;
 return <div className={[styles.controls,className??""].join(" ")} role="group" aria-label="Animation preferences">
  <button type="button" aria-pressed={paused} disabled={effectiveStatic} onClick={togglePaused} aria-describedby={noteId}>{paused?"Resume animations":"Pause animations"}</button>
  <button type="button" role="switch" aria-checked={effectiveStatic} disabled={reducedMotion} onClick={toggleStaticMode} aria-describedby={noteId}>Static motion</button>
  <span id={noteId} className={styles.preferenceNote}>{reducedMotion?"Device setting keeps decorative motion static.":effectiveStatic?"Decorative motion is static.":paused?"Decorative motion is paused.":"Controls affect VAMM decoration, not data updates."}</span>
 </div>;
}
