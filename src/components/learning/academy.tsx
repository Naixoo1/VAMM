"use client";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,BookOpenText,Check,ExternalLink,LockKeyhole} from "lucide-react";
import {Badge,PageHeading,Panel,styles as workspace} from "@/components/features/workspace";
import {useLearningProgress} from "@/hooks/use-learning-progress";
import {getLearningSummary} from "@/lib/learning/progress";
import {GLOSSARY,LESSONS,TRACKS,getLesson,isLessonAvailable} from "@/lib/learning/catalog";
import type {LearningLesson} from "@/lib/learning/types";
import {LearningDisclosure,LearningStatus} from "./shared";
import {LessonDiagram} from "./lesson-diagram";
import styles from "./learning.module.css";

const lessonHref=(id:string)=>"/academy?lesson="+encodeURIComponent(id);
const trackQuiz:Record<string,{id:string;title:string}>={"stock-essentials":{id:"stocks-101",title:"Stock Basics"},"portfolio-risk":{id:"risk-and-return",title:"Risk Detective"},"market-research":{id:"facts-and-news",title:"Facts, Opinions & News"},"long-term":{id:"risk-and-return",title:"Risk Detective"}};
export function AcademyWorkspace(){
 const params=useSearchParams();const requested=params.get("lesson");const learning=useLearningProgress();const[search,setSearch]=useState("");const heading=useRef<HTMLHeadingElement>(null);
 const lesson=requested?getLesson(requested):undefined;const track=lesson?TRACKS.find(item=>item.lessons.includes(lesson.id)):undefined;
 const summary=learning.progress?getLearningSummary(learning.progress):null;const completed=learning.progress?.completedLessonIds??[];
 useEffect(()=>{if(requested)heading.current?.focus()},[requested]);
 const text=search.trim().toLowerCase();const matches=(item:LearningLesson)=>[item.title,item.description,item.level,...item.objectives].join(" ").toLowerCase().includes(text);
 const matching=LESSONS.filter(matches);const visibleTracks=TRACKS.filter(item=>item.lessons.some(id=>{const candidate=getLesson(id);return !!candidate&&matches(candidate)}));
 const available=lesson&&isLessonAvailable(lesson.id,completed);const done=lesson&&completed.includes(lesson.id);
 const next=track&&lesson?track.lessons[track.lessons.indexOf(lesson.id)+1]:undefined;const quiz=track?trackQuiz[track.id]:undefined;
 return <div className={styles.page} data-learning-page="academy">
  <PageHeading eyebrow="Learn at your pace" title="Learning Academy" description="Build understanding one lesson at a time. Reviewed lessons, thoughtful reflection, and progress that stays on this device."/>
  <LearningStatus learning={learning}/>
  <dl className={styles.stats}><div><dt>Academy points</dt><dd data-testid="learning-academy-points">{summary?.academyPoints??"—"}</dd></div><div><dt>Lessons completed</dt><dd>{summary?summary.completedLessons+" / "+LESSONS.length:"—"}</dd></div><div><dt>Learning XP</dt><dd data-testid="learning-xp">{summary?.xp??"—"}</dd></div></dl>
  {requested?<>
   <Link className={[workspace.button,workspace.secondary].join(" ")} style={{justifySelf:"start"}} href="/academy"><ArrowLeft size={15} aria-hidden="true"/>Back to Academy</Link>
   {!lesson||!track?<p className={styles.empty} role="alert">This lesson is unavailable. Choose a lesson from the Academy catalog.</p>:learning.loading?null:!available?<div className={styles.notice}><h2 ref={heading} tabIndex={-1}>{lesson.title}</h2><p>{learning.progress?"Complete the preceding lessons in this course to unlock this lesson.":"Learning progress is unavailable. Reload it before opening this lesson."}</p><Link href="/academy">Choose an available lesson</Link></div>:<>
    <ol className={styles.lessons} aria-label="Course lessons">{track.lessons.map((id,index)=>{const item=getLesson(id)!;const unlocked=isLessonAvailable(id,completed);return <li key={id}>{unlocked?<Link className={styles.lessonLink} href={lessonHref(id)} aria-current={id===lesson.id?"step":undefined}>{completed.includes(id)?<Check size={14} aria-hidden="true"/>:<span aria-hidden="true">{index+1}</span>}{item.title}</Link>:<button type="button" className={styles.lessonLink} disabled><LockKeyhole size={14} aria-hidden="true"/>{item.title} · Complete earlier lessons</button>}</li>})}</ol>
    <article className={styles.reader} data-learning-lesson={lesson.id} data-motion-surface="panel">
     <header><div className={styles.meta}><Badge>{lesson.level}</Badge><span>{lesson.minutes} min · {track.title}</span></div><h2 ref={heading} tabIndex={-1}>{lesson.title}</h2><p>{lesson.description}</p></header>
     <section className={styles.objectives} aria-labelledby="lesson-objectives"><h3 id="lesson-objectives">In this lesson</h3><ul>{lesson.objectives.map(item=><li key={item}>{item}</li>)}</ul></section>
     <LessonDiagram lessonId={lesson.id}/>
     <div className={styles.sections}>{lesson.sections.map(([title,body])=><section key={title}><h3>{title}</h3><p>{body}</p></section>)}</div>
     <section aria-labelledby="lesson-takeaways"><h3 id="lesson-takeaways">What to take with you</h3><ul>{lesson.takeaways.map(item=><li key={item}>{item}</li>)}</ul></section>
     <aside className={styles.watchout}><strong>Keep in mind</strong><p>{lesson.watchout}</p></aside>
     <details className={styles.reflection}><summary><small>Apply it yourself · unscored reflection</small>{lesson.reflection.prompt}<span>Reveal a way to reason</span></summary><div><p>{lesson.reflection.answer}</p></div></details>
     <div className={styles.actions}><button type="button" className={workspace.button} aria-disabled={learning.blocked||!!done} onClick={()=>{if(!learning.blocked&&!done)void learning.complete(lesson.id)}}>{learning.busy?"Saving lesson…":done?"Lesson complete":"Mark lesson complete"}{done&&<Check size={15} aria-hidden="true"/>}</button>{next&&isLessonAvailable(next,completed)?<Link className={[workspace.button,workspace.secondary].join(" ")} href={lessonHref(next)}>Next lesson<ArrowRight size={15} aria-hidden="true"/></Link>:next?<span className={workspace.fieldHelp}>Complete this lesson to unlock the next one.</span>:null}</div>
     {done&&<p role="status">Lesson complete. Review it anytime; completing it again earns no extra points.</p>}
     {quiz&&<Link className={[workspace.button,workspace.secondary].join(" ")} style={{justifySelf:"start"}} href={"/missions?quiz="+quiz.id}>Practice quiz: {quiz.title}<ArrowRight size={15} aria-hidden="true"/></Link>}
     <section aria-labelledby="lesson-sources"><h3 id="lesson-sources">Learn from the source</h3><div className={styles.sources}>{lesson.sources.map(source=><a key={source.url} className={styles.source} href={source.url} target="_blank" rel="noopener noreferrer"><span>{source.publisher}</span><strong>{source.title}<ExternalLink size={12} style={{marginLeft:7}} aria-hidden="true"/></strong><span>Open publisher page · opens in a new tab</span></a>)}</div></section>
    </article>
   </>}
  </>:<>
   <div className={styles.search}><label htmlFor="lesson-search">Search lessons</label><input id="lesson-search" type="search" value={search} placeholder="Try inflation, risk, or company research" onChange={event=>setSearch(event.target.value)} aria-describedby="lesson-search-count"/><p className={styles.count} id="lesson-search-count" role="status">{matching.length} of {LESSONS.length} lessons match{search.trim()?" “"+search.trim()+"”":""}.</p></div>
   <section aria-labelledby="academy-courses"><h2 id="academy-courses">Courses</h2><div className={styles.catalog}>{visibleTracks.map(item=>{const count=item.lessons.filter(id=>completed.includes(id)).length;const first=item.lessons.find(id=>!completed.includes(id))??item.lessons[0];const label=count===item.lessons.length?"Review course":count?"Continue course":"Start course";return <article key={item.id} className={styles.card} data-learning-track={item.id} data-motion-surface="panel"><BookOpenText size={27} color="#1964c8" strokeWidth={1.6} aria-hidden="true"/><div className={styles.meta}><Badge>{item.level}</Badge><span>{item.lessons.length} lessons</span></div><h3>{item.title}</h3><p>{item.description}</p>{summary?<><p>{count} of {item.lessons.length} lessons complete</p><progress className={styles.progress} max={item.lessons.length} value={count} aria-label={item.title+" progress"}>{count} of {item.lessons.length}</progress></>:<p>Progress unavailable until loaded.</p>}<details className={styles.outline}><summary>Course outline</summary><ol>{item.lessons.map(id=>{const candidate=getLesson(id)!;return <li key={id}>{candidate.title}<small>{candidate.minutes} min · {completed.includes(id)?"Completed":isLessonAvailable(id,completed)?"Available":"Complete earlier lessons"}{text&&matches(candidate)?" · Search match":""}</small></li>})}</ol></details><Link href={lessonHref(first)} className={workspace.button} aria-label={label+": "+item.title}>{label}<ArrowRight size={15} aria-hidden="true"/></Link></article>})}</div>{visibleTracks.length===0&&<div className={styles.empty}><p>No lessons match your search.</p><button type="button" className={[workspace.button,workspace.secondary].join(" ")} onClick={()=>setSearch("")}>Clear lesson search</button></div>}</section>
   <Panel title="Learning milestones" description="Each lesson earns 10 Academy points once. Milestone XP rewards understanding, never investment performance.">{summary?<ul className={styles.milestones}>{summary.milestones.map(item=><li key={item.points} data-earned={item.earned}><strong>{item.title}</strong><span>{item.points} points · {item.xp} XP</span><span>{item.earned?"Earned":"Not earned yet"}</span></li>)}</ul>:<p className={workspace.fieldHelp}>Load learning progress to see earned milestones.</p>}</Panel>
   <Panel title="Quick glossary" description="A few terms to return to as you learn."><div className={styles.glossary}>{GLOSSARY.map(item=><details key={item.term}><summary>{item.term}</summary><p>{item.definition}</p></details>)}</div></Panel>
  </>}
  <LearningDisclosure/>
 </div>;
}
