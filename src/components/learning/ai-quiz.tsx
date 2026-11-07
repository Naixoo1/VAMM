"use client";
import {useId,useRef,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Sparkles} from "lucide-react";
import {MotionBoundary,MotionMark} from "@/components/motion";
import type {GeneratedQuiz,QuizTopic} from "@/lib/ai/quiz-generation";
import styles from "./ai-quiz.module.css";

const topics=[{id:"stocks",label:"Stocks"},{id:"risk",label:"Risk"},{id:"news",label:"News"}] as const;
function validQuiz(value:unknown,topic:QuizTopic):value is GeneratedQuiz{
 if(!value||typeof value!=="object")return false;const quiz=value as GeneratedQuiz;
 return quiz.topic===topic&&quiz.origin==="model"&&Array.isArray(quiz.questions)&&quiz.questions.length===3&&new Set(quiz.questions.map(item=>item?.id)).size===3&&quiz.questions.every(item=>item&&["q1","q2","q3"].includes(item.id)&&typeof item.question==="string"&&item.question.trim().length>0&&item.question.length<=320&&typeof item.explanation==="string"&&item.explanation.trim().length>0&&item.explanation.length<=600&&Array.isArray(item.choices)&&item.choices.length===4&&item.choices.every(choice=>typeof choice==="string"&&choice.trim().length>0&&choice.length<=180)&&new Set(item.choices.map(choice=>choice.trim().toLowerCase())).size===4&&Number.isInteger(item.correctIndex)&&item.correctIndex>=0&&item.correctIndex<=3);
}
function problem(code:unknown):string{
 if(code==="NOT_CONFIGURED")return"AI generation is not configured yet. The reviewed quizzes below are still available.";
 if(code==="MODEL_AUTH_FAILED")return"The site’s configured model credentials were rejected. The site owner needs to update them.";
 if(code==="MODEL_ACCESS_DENIED"||code==="MODEL_NOT_FOUND")return"The configured model is unavailable to this site. The site owner needs to check model access.";
 if(code==="MODEL_QUOTA_EXCEEDED")return"The model provider’s quota or billing limit has been reached. Try the reviewed quizzes below.";
 if(code==="RATE_LIMITED"||code==="MODEL_RATE_LIMITED")return"AI generation is busy or rate-limited. Wait a moment, then choose Generate 3 questions to retry.";
 if(code==="MODEL_TIMEOUT")return"AI generation took too long. Choose Generate 3 questions to retry when you’re ready.";
 if(code==="MODEL_INVALID_OUTPUT")return"The generated questions could not be validated. Choose Generate 3 questions to try again.";
 return"AI questions could not be generated. Choose Generate 3 questions to retry, or use the reviewed quizzes below.";
}

export function AiQuizPractice(){
 const available=useQuery({queryKey:["vamm-ai-quiz-availability"],queryFn:async({signal})=>{const response=await fetch("/api/quiz-generation",{method:"GET",credentials:"same-origin",cache:"no-store",signal});if(!response.ok)throw new Error("unavailable");const value:unknown=await response.json();if(!value||typeof value!=="object"||typeof(value as {configured?:unknown}).configured!=="boolean")throw new Error("unavailable");return(value as {configured:boolean}).configured},retry:false,refetchOnWindowFocus:false});
 const[topic,setTopic]=useState<QuizTopic>("stocks");const[quiz,setQuiz]=useState<GeneratedQuiz|null>(null);const[answers,setAnswers]=useState<Array<number|null>>([null,null,null]);const[submitted,setSubmitted]=useState(false);const[busy,setBusy]=useState(false);const[error,setError]=useState<string|null>(null);const[checked,setChecked]=useState(false);const lock=useRef(false);const id=useId();
 const score=quiz?quiz.questions.filter((question,index)=>answers[index]===question.correctIndex).length:0;
 async function generate(){
  if(lock.current||available.data!==true||available.isFetching)return;lock.current=true;setBusy(true);setError(null);const requestedTopic=topic;
  const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),25_000);
  try{
   const response=await fetch("/api/quiz-generation",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({topic:requestedTopic}),signal:controller.signal});
   const payload=await response.json() as {ok?:boolean;data?:unknown;error?:{code?:unknown}};
   if(!response.ok||payload?.ok!==true){setError(problem(payload?.error?.code));return}
   if(!validQuiz(payload.data,requestedTopic)){setError(problem("MODEL_INVALID_OUTPUT"));return}
   setQuiz(payload.data);setAnswers([null,null,null]);setSubmitted(false);
  }catch{setError("The connection failed or timed out. Choose Generate 3 questions to retry. Your current practice has not been replaced.")}
  finally{window.clearTimeout(timeout);lock.current=false;setBusy(false)}
 }
 return <section className={styles.panel} aria-labelledby={`${id}-title`} data-ai-quiz="" data-motion-surface="panel">
  <header className={styles.header}><div><p className={styles.eyebrow}><Sparkles size={14} aria-hidden="true"/>Optional AI practice</p><h2 id={`${id}-title`}>AI-generated challenges</h2><p>Generate three questions on a topic, check your understanding, then read the explanations.</p></div><span className={styles.badge}>Practice only · No XP</span></header>
  <div className={styles.body}>
   <div className={styles.controls}><label htmlFor={`${id}-topic`}>AI quiz topic<select id={`${id}-topic`} value={topic} onChange={event=>setTopic(event.target.value as QuizTopic)} disabled={busy}>{topics.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><button type="button" className={styles.primary} aria-disabled={busy||available.data!==true||available.isFetching} onClick={()=>void generate()}>{busy?"Generating questions…":"Generate 3 questions"}</button></div>
   {available.isPending&&<p className={styles.note} role="status"><MotionMark preset="query-inline" state="loading"/>Checking AI availability…</p>}
   {available.data===false&&<p className={styles.notice} role="status">AI generation is not configured yet. The reviewed quiz challenges below remain available.</p>}
   {(available.error||available.data===false||checked)&&<div className={styles.availability}><p role={available.error?"alert":"status"}>{available.error?"AI quiz availability could not be checked.":available.data?"AI generation is available.":"AI generation is currently unavailable."}</p><button type="button" className={styles.secondary} aria-disabled={available.isFetching} onClick={()=>{if(available.isFetching)return;setChecked(true);void available.refetch()}}>{available.isFetching?"Checking availability…":"Check AI availability"}</button></div>}
   {busy&&<p className={styles.note} role="status"><MotionMark preset="mentor-orbit" state="loading"/>Creating three AI practice questions…</p>}
   {error&&<p className={styles.error} role="alert">{error}</p>}
   {quiz&&<MotionBoundary preset="evidence-arrival" state="ready"><form aria-label="AI-generated practice questions" onSubmit={event=>{event.preventDefault();if(!busy&&!submitted&&answers.every(answer=>answer!==null))setSubmitted(true)}}>
    <div className={styles.quizHeading}><h3>{topics.find(item=>item.id===quiz.topic)?.label} practice</h3><span className={styles.badge}>Generated by AI</span></div>
    {quiz.questions.map((question,index)=><fieldset className={styles.question} key={question.id} disabled={busy||submitted}><legend><span>Question {index+1} of 3</span>{question.question}</legend><div className={styles.choices}>{question.choices.map((choice,choiceIndex)=><label key={choiceIndex} className={styles.choice}><input type="radio" name={`${id}-${question.id}`} value={choiceIndex} checked={answers[index]===choiceIndex} onChange={()=>{if(busy||submitted)return;setAnswers(current=>current.map((answer,answerIndex)=>answerIndex===index?choiceIndex:answer))}}/><span>{choice}</span></label>)}</div>{submitted&&<div className={styles.explanation}><strong>{answers[index]===question.correctIndex?"Correct":"Review this answer"}</strong><p>Correct answer: {question.choices[question.correctIndex]}</p><p>{question.explanation}</p></div>}</fieldset>)}
    <div className={styles.resultActions}><button type="submit" className={styles.primary} aria-disabled={busy||submitted||answers.some(answer=>answer===null)}>{submitted?"Answers submitted":"Submit AI answers"}</button>{submitted&&<><p className={styles.score} role="status">Score: {score}/3 · {Math.round(score/3*100)}%</p><button type="button" className={styles.secondary} onClick={()=>{if(!busy){setAnswers([null,null,null]);setSubmitted(false)}}} aria-disabled={busy}>Try these questions again</button></>}</div>
   </form></MotionBoundary>}
   <p className={styles.disclosure}>AI-generated questions can be wrong. Treat them as educational practice and check the explanations. This panel awards no XP, saves no attempt history, and never changes your simulation. Only the selected topic is sent to OpenAI when you choose Generate.</p>
  </div>
 </section>;
}
