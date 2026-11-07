"use client";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import {ArrowUp,ChevronRight,ImagePlus,MessageCircle,Plus,RefreshCw,ShieldCheck,X} from "lucide-react";
import {MotionBoundary,MotionMark,useMotionPreferences} from "@/components/motion";
import {useMentorChat} from "@/hooks/use-mentor-chat";
import {EarlierBasketAnswers} from "./legacy-history";
import styles from "./chat.module.css";

const suggestions=["Explain what a chart can and cannot tell me.","How do I distinguish a price trend from market noise?","Help me compare bullish, bearish, and uncertain scenarios.","What should I check before trusting an investment headline?"];
export function MentorChatWorkspace(){
 const chat=useMentorChat();const[archive,setArchive]=useState(false);const[availabilityChecked,setAvailabilityChecked]=useState(false);const textarea=useRef<HTMLTextAreaElement>(null);const archiveTrigger=useRef<HTMLButtonElement>(null);
 const blocked=chat.busy||chat.reading;const messages=chat.session?.messages??[];
 const followLatest=useRef(false);const bottom=useRef<HTMLDivElement>(null);const{effectiveStatic,paused}=useMotionPreferences();const lastMessageId=messages.at(-1)?.id;
 useEffect(()=>{if(!followLatest.current)return;bottom.current?.scrollIntoView?.({block:"nearest",behavior:effectiveStatic||paused?"instant":"smooth"});if(!chat.busy)followLatest.current=false},[chat.busy,lastMessageId,chat.unsavedReply,effectiveStatic,paused]);
 function send(){if(chat.canSend){followLatest.current=true;chat.send()}}
 function retry(){if(chat.canRetry){followLatest.current=true;chat.retry()}}
 function newChat(){if(blocked||!chat.newChat())return;setArchive(false);textarea.current?.focus()}
 function backToChat(){setArchive(false);archiveTrigger.current?.focus()}
 return <section className={styles.workspace} aria-label="Mentor chat workspace" onWheel={()=>{followLatest.current=false}} onTouchMove={()=>{followLatest.current=false}}>
  <header className={styles.pageHeader}><div><p className={styles.eyebrow}>A space to think it through</p><h1>AI Investment Mentor</h1><p className={styles.subtitle}>Ask questions. Explore a chart screenshot. Keep the conversation.</p></div><button type="button" className={styles.newChat} aria-disabled={blocked} onClick={newChat}><Plus size={17} aria-hidden="true"/>New chat</button></header>
  <div className={styles.layout}>
   <aside className={styles.sidebar} aria-label="Chat sessions">
    <details className={styles.history} open><summary>Chat history <span>{chat.sessions.length}</span></summary><div className={styles.historyBody}>
     <p className={styles.historyNote}>Saved in this browser, separate from your Google account.</p>
     <button type="button" className={styles.refresh} aria-disabled={blocked||chat.loading} onClick={()=>{if(!blocked&&!chat.loading)void chat.reloadHistory()}}><RefreshCw size={13} aria-hidden="true"/>{chat.reading?"Refreshing history…":"Refresh chat history"}</button>
     {chat.loading&&<p className={styles.note} role="status"><MotionMark preset="query-inline" state="loading"/>Loading chat history…</p>}{chat.historyError&&<p className={styles.error} role="alert">{chat.historyError}</p>}
     {!chat.loading&&!chat.historyError&&!chat.sessions.length&&<p className={styles.note}>Your conversations will appear here after you send a message.</p>}
     <ul className={styles.sessions}>{chat.sessions.map(session=><li key={session.id}><button type="button" className={styles.session} aria-label={`Open chat: ${session.title}`} aria-current={!archive&&session.id===chat.session?.id?"true":undefined} aria-disabled={blocked} onClick={()=>{if(!blocked)void chat.openSession(session.id).then(opened=>{if(opened)setArchive(false)})}}><MessageCircle size={14} aria-hidden="true"/><span>{session.title}<small>{new Date(session.updatedAt).toLocaleDateString("en-GB")} · {session.messages.length} messages</small></span></button></li>)}</ul>
    </div></details>
    <button ref={archiveTrigger} type="button" className={styles.archiveLink} aria-disabled={blocked} aria-expanded={archive} onClick={()=>{if(!blocked)setArchive(true)}}>Earlier basket answers<ChevronRight size={14} aria-hidden="true"/></button>
    <div className={styles.deviceNote}><ShieldCheck size={16} aria-hidden="true"/><p>Chat history is stored on this device, without cloud sync or Google-account isolation. Sending shares the last 20 messages and shown screenshot with OpenAI for processing. Avoid sensitive details; anyone using this browser profile can read saved chats.</p></div>
   </aside>
   <div className={styles.conversation}>
    {archive?<EarlierBasketAnswers onBack={backToChat}/>:<>
     <div className={styles.conversationHeader}><span className={styles.mentorBadge}><span/>VAMM Mentor</span><span>Educational conversation</span></div>
     <div className={styles.messages} role="log" aria-label="Mentor conversation" aria-live="off">
      {!messages.length&&!chat.unsavedReply&&<div className={styles.welcome}><span className={styles.welcomeIcon}><MessageCircle size={28} strokeWidth={1.5} aria-hidden="true"/></span><h2>What would you like to understand?</h2><p>Bring a question or a chart screenshot. We’ll separate what is visible from what remains uncertain.</p><div className={styles.suggestions}>{suggestions.map(prompt=><button type="button" key={prompt} aria-disabled={blocked||chat.hasIntent} onClick={()=>{if(blocked||chat.hasIntent)return;chat.setDraft(prompt);textarea.current?.focus()}}>{prompt}<ChevronRight size={14} aria-hidden="true"/></button>)}</div></div>}
      {messages.map(message=><article className={[styles.message,message.role==="user"?styles.userMessage:styles.assistantMessage].join(" ")} key={message.id} aria-label={message.role==="user"?"Your message":"Mentor reply"}><header><strong>{message.role==="user"?"You":"Mentor"}</strong><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</time>{message.role==="assistant"&&<span>Model response</span>}</header>{message.image&&<figure className={styles.savedImage}><Image src={message.image.dataUrl} alt={`Chart screenshot: ${message.image.name}`} width={600} height={340} unoptimized/><figcaption>{message.image.name} · Supplied screenshot</figcaption></figure>}{message.role==="assistant"?<MotionBoundary preset="evidence-arrival" state="ready" motionKey={message.id}><p className={styles.messageText}>{message.content}</p></MotionBoundary>:<p className={styles.messageText}>{message.content}</p>}</article>)}
      {chat.unsavedReply&&<article className={[styles.message,styles.assistantMessage,styles.unsaved].join(" ")} aria-label="Unsaved Mentor reply"><header><strong>Mentor</strong><span>Not saved yet</span></header><p className={styles.messageText}>{chat.unsavedReply}</p></article>}
      {chat.busy&&<p className={styles.thinking} role="status"><MotionMark preset="mentor-orbit" state="loading"/>Thinking…<span>{chat.phase==="save-user"?"Saving your question first.":chat.phase==="save-assistant"?"Saving the reply on this device.":"No live price feed is attached."}</span></p>}
     </div>
     <div className={styles.composerArea}>
      {chat.issue&&<div className={styles.errorBox} role="alert"><p><MotionMark preset="research-fallback" state="error"/>{chat.issue.message}</p>{chat.issue.conflict&&<p>Refresh chat history before continuing. No stale request is sent automatically.</p>}</div>}
      {(chat.hasIntent||chat.unanswered)&&<div className={styles.retryRow}><p>{chat.unsavedReply?"The reply must be saved before you continue.":"Your saved question is waiting for a reply."}</p><button type="button" className={styles.secondary} aria-disabled={!chat.canRetry} onClick={retry}><RefreshCw size={14} aria-hidden="true"/>{chat.busy?"Thinking…":"Retry reply"}</button></div>}
      {chat.configured===false&&<p className={styles.unavailable} role="status"><MotionMark preset="research-fallback" state="idle"/>The Mentor is not configured on this site yet. You can read earlier chats; sending is unavailable.</p>}
      {(chat.configError||availabilityChecked||chat.configured===false)&&<div className={styles.availability}><p role={chat.configError?"alert":"status"}>{chat.configError??(chat.configured?"The Mentor is available.":"The Mentor is not configured yet.")}</p><button type="button" className={styles.secondary} aria-disabled={chat.checkingConfig} onClick={()=>{if(chat.checkingConfig)return;setAvailabilityChecked(true);void chat.checkAvailability()}}>{chat.checkingConfig?"Checking availability…":"Check Mentor availability"}</button></div>}
      {chat.image&&<div className={styles.imagePreview}><Image src={chat.image.dataUrl} alt="Screenshot for the next message" width={180} height={100} unoptimized/><div><strong>Screenshot context</strong><p>{chat.image.name}</p><span>{chat.hasIntent||chat.unanswered?"This saved question’s screenshot stays fixed for its retry.":"This image will be sent again with your next message."}</span></div><button type="button" className={styles.removeImage} aria-label="Remove screenshot" aria-disabled={blocked||chat.hasIntent||chat.unanswered} onClick={()=>{if(!blocked&&!chat.hasIntent&&!chat.unanswered)chat.removeImage()}}><X size={16} aria-hidden="true"/></button></div>}
      {chat.imageError&&<p className={styles.error} role="alert">{chat.imageError}</p>}
      <form className={styles.composer} onSubmit={event=>{event.preventDefault();send()}}>
       <label htmlFor="mentor-message" className={styles.visuallyHidden}>Message your mentor</label><textarea ref={textarea} id="mentor-message" rows={3} maxLength={4000} placeholder="Message your mentor…" value={chat.draft} onChange={event=>chat.setDraft(event.target.value)} readOnly={blocked||chat.hasIntent||chat.unanswered} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();send()}}} aria-describedby="mentor-input-help"/>
       <div className={styles.composerActions}><label className={styles.attach}><ImagePlus size={17} aria-hidden="true"/><span>{chat.imageReading?"Reading image…":"Attach screenshot"}</span><input type="file" aria-label="Upload screenshot" accept="image/png,image/jpeg,image/webp" disabled={blocked||chat.hasIntent||chat.unanswered} onChange={event=>{const file=event.currentTarget.files?.[0];if(file)void chat.attach(file);event.currentTarget.value=""}}/></label><span className={styles.inputHint}>PNG, JPEG, WebP · ≤2 MiB</span><button type="submit" className={styles.send} aria-label="Send message" aria-disabled={!chat.canSend}><ArrowUp size={19} aria-hidden="true"/></button></div>
      </form>
      <p id="mentor-input-help" className={styles.inputHelp}>Enter to send · Shift + Enter for a new line{chat.checkingConfig&&<><MotionMark preset="query-inline" state="loading"/>Checking Mentor availability…</>}</p>
      <p className={styles.contextNote}>Only the last 20 messages and the screenshot shown above are sent to OpenAI as context. Your full history is saved in this browser.</p>
      <p className={styles.disclaimer}>A screenshot is a snapshot, not a live market feed. The Mentor can be wrong: chart interpretations are uncertain scenarios, not current-price verification, trade orders, or guaranteed buy/sell advice.</p>
      <div ref={bottom} aria-hidden="true"/>
     </div>
    </>}
   </div>
  </div>
 </section>;
}
