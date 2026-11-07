"use client";
import {useState} from "react";
import {BookOpenText,RotateCw,ShieldCheck} from "lucide-react";
import type {LearningController} from "@/hooks/use-learning-progress";
import {MotionMark} from "@/components/motion";
import {Badge,LoadingPanel,styles as workspace} from "@/components/features/workspace";
import styles from "./learning.module.css";
export function LearningStatus({learning,onRetry,onReload}:{learning:LearningController;onRetry?:()=>void;onReload?:()=>void}){
 const[used,setUsed]=useState<"retry"|"reload"|null>(null);const error=learning.error;const pending=learning.busy||learning.refreshing;
 if(learning.loading&&!used&&!error)return <LoadingPanel message="Loading your learning progress…"/>;
 if(!error&&!used)return null;
 return <div className={error?styles.error:styles.saved} role={error?"alert":"status"}>
  <p>{error?<><MotionMark preset="stale-context" state="error"/> {error.message}</>:pending?"Refreshing learning progress…":"Learning progress is up to date."}</p>
  {error&&<p>Your current choices stay in this tab. Reload progress to reconcile another tab before choosing a new action.</p>}
  <div className={styles.actions}>
   {(learning.retryIntent||used==="retry")&&<button type="button" className={workspace.button} aria-disabled={pending} onClick={()=>{if(pending)return;setUsed("retry");if(learning.retryIntent){if(onRetry)onRetry();else void learning.retry()}else if(onReload)onReload();else void learning.reload()}}><RotateCw size={15} aria-hidden="true"/>{pending?"Saving learning progress…":learning.retryIntent?"Retry saved learning action":"Refresh learning progress"}</button>}
   {(error||used==="reload")&&<button type="button" className={[workspace.button,workspace.secondary].join(" ")} aria-disabled={pending} onClick={()=>{if(pending)return;setUsed("reload");if(onReload)onReload();else void learning.reload()}}>{pending?"Reloading learning progress…":error?"Reload learning progress":"Refresh learning progress"}</button>}
  </div>
 </div>;
}
export function LearningDisclosure(){return <p className={styles.disclosure}><ShieldCheck size={16} aria-hidden="true"/>Learning rewards reflect completed lessons and reviewed quiz mastery. They never rank investment returns or change your simulation.</p>}
export function ReviewedBadge(){return <Badge tone="muted"><BookOpenText size={13} aria-hidden="true"/>Reviewed practice · fictional examples</Badge>}
