"use client";

import Link from "next/link";
import {useState,useSyncExternalStore} from "react";
import {LogIn,LogOut,RefreshCw,ShieldCheck,UserRound} from "lucide-react";
import {useAccount,type AccountController} from "@/hooks/use-account";
import styles from "./account-controls.module.css";

function AccountActions({account,compact=false}:{account:AccountController;compact?:boolean}){
 const[checked,setChecked]=useState(false);
 const pending=account.busy||account.checking;
 return <div className={styles.actions}>
  {account.user?<button type="button" className={styles.button} onClick={account.signOut} aria-disabled={pending||account.readFailed}><LogOut size={15} aria-hidden="true"/>{account.busy&&account.action==="sign-out"?"Signing out…":"Sign out"}</button>:
   <button type="button" className={[styles.button,styles.primary].join(" ")} onClick={account.signIn} aria-disabled={pending||!account.configured||account.readFailed}><LogIn size={15} aria-hidden="true"/>{account.busy&&account.action==="sign-in"?"Opening Google…":"Continue with Google"}</button>}
  {(account.error||checked)&&<button type="button" className={styles.button} onClick={()=>{if(pending)return;setChecked(true);void account.checkAgain()}} aria-disabled={pending}><RefreshCw size={14} aria-hidden="true"/>{account.checking?"Checking account…":compact?"Check account":"Check account again"}</button>}
 </div>;
}

export function AccountControls(){
 const account=useAccount();
 return <div className={styles.compact} role="group" aria-label="Account toolbar" data-account-state={account.state} aria-busy={account.busy||account.checking}>
  {account.state==="checking"&&<p role="status" className={styles.compactStatus}>Checking account…</p>}
  {account.user&&<Link href="/profile" className={styles.accountLink} title={account.user.name}><UserRound size={16} aria-hidden="true"/><span>{account.user.name}</span></Link>}
  <AccountActions account={account} compact/>
  {account.state==="unconfigured"&&<span className={styles.compactStatus}>Sign-in unavailable</span>}
  {account.error&&<span className={styles.compactStatus} role="alert">Account unavailable</span>}
 </div>;
}

function subscribeUrl(notify:()=>void){window.addEventListener("popstate",notify);return()=>window.removeEventListener("popstate",notify)}
function oauthFailed(){return new URLSearchParams(window.location.search).get("authError")==="oauth"}
export function AccountPanel(){
 const account=useAccount();
 const oauthError=useSyncExternalStore(subscribeUrl,oauthFailed,()=>false);
 return <section className={styles.panel} aria-label="Google account" data-account-state={account.state} aria-busy={account.busy||account.checking} data-motion-surface="panel">
  <header className={styles.heading}><span className={styles.icon}><UserRound size={21} aria-hidden="true"/></span><div><p className={styles.eyebrow}>Optional account</p><h2>Google account</h2></div></header>
  {account.state==="checking"?<p className={styles.copy} role="status">Checking account…</p>:<>
   {account.user?<div className={styles.identity}><strong>{account.user.name}</strong>{account.user.email&&<p>{account.user.email}</p>}<p className={styles.copy}>Signed in with Google.</p></div>:<p className={styles.copy}>You’re browsing as a guest. Every learning page remains available without signing in.</p>}
   {account.state==="unconfigured"&&<p className={styles.notice} role="status">Google sign-in is not configured for this site yet. You can continue using VAMM as a guest.</p>}
   {oauthError&&<p className={styles.error} role="alert">Google sign-in was cancelled or could not finish. You can try again or continue as a guest.</p>}
   {account.error&&<p className={styles.error} role="alert">{account.error}</p>}
   {account.busy&&<p className={styles.copy} role="status">{account.action==="sign-in"?"Opening Google’s secure sign-in page…":"Signing out of your Google account session…"}</p>}
  </>}
  <AccountActions account={account}/>
  <div className={styles.disclosure}><ShieldCheck size={18} aria-hidden="true"/><p>Simulation history, lessons, quiz progress, and saved mentor answers stay in this browser. Signing in or out does not sync, transfer, erase, or make those device records private to your account. Anyone using this browser profile can access them.</p></div>
 </section>;
}
