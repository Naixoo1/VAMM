"use client";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import type {ErrorResponse,SessionBundle,TurnRecord} from "@/contracts";
import {getSession} from "@/lib/simulation/gateway";
import {Badge,ErrorNotice,LoadingPanel,Panel,money,styles} from "./workspace";
export function TurnHistory({turns}:{turns:TurnRecord[]}){return turns.length===0?<p className={styles.fieldHelp}>Your first turn will appear here after you advance.</p>:<div className={styles.tableWrap}><table className={styles.table}><caption className={styles.fieldHelp} style={{textAlign:"left",paddingBottom:12}}>Committed turn history · IDR · pending bills remain undeducted</caption><thead><tr><th scope="col">Age / turn</th><th scope="col">Contribution</th><th scope="col">Investment gain</th><th scope="col">Bill paid</th><th scope="col">Unmet cost</th><th scope="col">Nominal</th><th scope="col">Real</th></tr></thead><tbody>{turns.map(turn=><tr key={turn.turnIndex}><th scope="row">{turn.ageAfter} / {turn.turnIndex}<p className={styles.fieldHelp}>{turn.decisionStatus}</p></th><td>{money(turn.contributionRupiah)}</td><td>{money(turn.investmentGainRupiah)}</td><td>{money(turn.paidShockCostRupiah)}</td><td>{turn.unmetShockCostRupiah===null?"Undecided":money(turn.unmetShockCostRupiah)}</td><td>{money(turn.nominalBalanceRupiah)}</td><td>{money(turn.realBalanceRupiah)}</td></tr>)}</tbody></table></div>}
export function PreservedSession({snapshot,index}:{snapshot:SessionBundle;index:number}){
 const[open,setOpen]=useState(false);
 const[retried,setRetried]=useState(false);
 const history=useQuery({queryKey:["vamm-preserved-session",snapshot.session.id],queryFn:async()=>{const result=await getSession({sessionId:snapshot.session.id});if(!result.ok)throw new Error(result.error.message);return result.data},enabled:open,retry:false,refetchOnWindowFocus:false});
 return <details className={styles.details} data-motion-surface="history" onToggle={event=>setOpen(event.currentTarget.open)}><summary>View preserved session {index+1} · {snapshot.turns.length} recorded turns</summary>{open&&<>{history.isPending?<LoadingPanel message="Loading preserved history…"/>:history.error?<ErrorNotice message={history.error.message}/>:history.data&&<><Badge tone="muted">Previous session · retained on this device</Badge><TurnHistory turns={history.data.turns}/></>}{(history.error||retried)&&<button type="button" className={[styles.button,styles.secondary,styles.smallButton].join(" ")} aria-disabled={history.isFetching} onClick={()=>{if(history.isFetching)return;setRetried(true);void history.refetch()}}>{history.isFetching?"Loading preserved history…":history.error?"Reload preserved history":"Refresh preserved history"}</button>}</>}</details>
}

export function PreservedHistory({sessions,loading,error,onReload}:{sessions:SessionBundle[];loading:boolean;error:ErrorResponse|null;onReload:()=>void}){
 const[retried,setRetried]=useState(false);
 if(!loading&&!error&&sessions.length===0&&!retried)return null;
 return <Panel title="Preserved sessions" description="Starting fresh keeps your earlier session and history.">
  {error&&<ErrorNotice message={error.message}><p>Earlier sessions have not been reset. Reload this list to try reading them again.</p></ErrorNotice>}
  {loading&&sessions.length===0&&<LoadingPanel message="Loading saved sessions…"/>}
  {sessions.map((snapshot,index)=><PreservedSession key={snapshot.session.id} snapshot={snapshot} index={index}/>)}
  {!loading&&!error&&sessions.length===0&&<p className={styles.fieldHelp}>There are no previous sessions for this browser profile.</p>}
  {(error||retried)&&<button type="button" className={[styles.button,styles.secondary,styles.smallButton].join(" ")} aria-disabled={loading} onClick={()=>{if(loading)return;setRetried(true);onReload()}}>{loading?"Loading saved sessions…":error?"Reload preserved sessions":"Refresh sessions"}</button>}
 </Panel>
}
