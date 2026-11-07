"use client";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {ArrowLeft,RefreshCw} from "lucide-react";
import {listMentorAnswers} from "@/lib/learning/mentor-history";
import styles from "./chat.module.css";

export function EarlierBasketAnswers({onBack}:{onBack:()=>void}){
 const history=useQuery({queryKey:["vamm-mentor-history"],queryFn:async()=>{const result=await listMentorAnswers();if(!result.ok)throw new Error(result.error.message);return result.data},retry:false,refetchOnWindowFocus:false});
 const[selected,setSelected]=useState<string|null>(null);const answer=history.data?.find(item=>item.id===selected);
 return <section className={styles.archive} aria-label="Earlier basket answers">
  <button type="button" className={styles.secondary} onClick={onBack}><ArrowLeft size={15} aria-hidden="true"/>Back to chat</button>
  <p className={styles.eyebrow}>Read-only archive</p><h2>Earlier basket answers</h2>
  <p className={styles.note}>These saved synthetic-basket answers belong to the earlier Mentor. Opening them makes no model request. They are never included in chat context.</p>
  <button type="button" className={styles.secondary} aria-disabled={history.isFetching} onClick={()=>{if(!history.isFetching)void history.refetch()}}><RefreshCw size={14} aria-hidden="true"/>Refresh earlier answers</button>
  {history.isPending&&<p role="status">Reading earlier answers…</p>}{history.error&&<p role="alert" className={styles.error}>{history.error.message}</p>}
  {!history.isPending&&!history.error&&!history.data?.length&&<p className={styles.note}>No earlier basket answers on this device.</p>}
  <ul className={styles.archiveList}>{history.data?.map(item=><li key={item.id}><button type="button" className={styles.archiveEntry} aria-label={`Open earlier answer: ${item.question}`} aria-expanded={selected===item.id} onClick={()=>setSelected(item.id)}>{item.question}<span>{new Date(item.createdAt).toLocaleDateString("en-GB")} · {item.response.origin==="prewritten"?"Prewritten fallback":"Model-selected explanation"}</span></button></li>)}</ul>
  {answer&&<article className={styles.archiveAnswer}><h3>{answer.question}</h3><p className={styles.note}>Saved snapshot · Synthetic teaching evidence · No new request</p><p className={styles.messageText}>{answer.response.summary}</p><h4>Grounded observations</h4><ul>{answer.response.facts.map((fact,index)=><li key={index}>{fact.text}</li>)}</ul><h4>Limits</h4><ul>{answer.response.limitations.map((limit,index)=><li key={index}>{limit}</li>)}</ul></article>}
 </section>;
}
