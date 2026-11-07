"use client";
import { Info, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import {MotionMark} from "@/components/motion";
import styles from "./workspace.module.css";
export { styles };
export const money=(value:number)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);
export const ratio=(value:number)=>new Intl.NumberFormat("en",{style:"percent",maximumFractionDigits:2}).format(value);
export const assetNames={cash:"Cash",bonds:"Bond basket",equity:"Equity basket"} as const;
export const assetColors={cash:"#9a8b58",bonds:"#3f8071",equity:"#c17d5d"} as const;
export function Badge({children,tone=""}:{children:ReactNode;tone?:"muted"|"coral"|"amber"|""}){return <span className={[styles.badge,tone==="muted"?styles.mutedBadge:tone==="coral"?styles.coralBadge:tone==="amber"?styles.amberBadge:""].join(" ")}>{children}</span>}
export function PageHeading({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children?:ReactNode}){return <header className={styles.heading} data-motion-surface="heading"><div><p className={styles.eyebrow}>{eyebrow}</p><h1 className={styles.title}>{title}</h1><p className={styles.subtitle}>{description}</p></div>{children&&<div className={styles.actions}>{children}</div>}</header>}
export function Panel({title,description,action,children,body=true}:{title?:string;description?:string;action?:ReactNode;children:ReactNode;body?:boolean}){return <section className={styles.panel} data-motion-surface="panel">{title&&<div className={styles.panelHeader}><div><h2 className={styles.panelTitle}>{title}</h2>{description&&<p className={styles.panelDesc}>{description}</p>}</div>{action}</div>}{body?<div className={styles.panelBody}>{children}</div>:children}</section>}
export function LoadingPanel({message="Loading your workspace…",preset="query-inline"}:{message?:string;preset?:string}){return <div className={styles.loading} role="status"><MotionMark preset={preset} state="loading"/>{message}</div>}
export function ErrorNotice({message,onRetry,children,preset="stale-context"}:{message:string;onRetry?:()=>void;children?:ReactNode;preset?:string}){return <div className={styles.error} role="alert"><p><MotionMark preset={preset} state="error"/> {message}</p>{children}{onRetry&&<button type="button" className={[styles.button,styles.secondary,styles.smallButton].join(" ")} onClick={onRetry}><RotateCw size={13} aria-hidden="true"/>Try again</button>}</div>}
export function SourceLine({version,date="6 Nov 2026"}:{version?:string;date?:string}){return <p className={styles.source}><Info size={11} aria-hidden="true"/>Synthetic teaching data · IDR · {date}{version&&<span>· {version}</span>}<span>· VAMM synthetic teaching methodology</span></p>}
