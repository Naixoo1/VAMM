"use client";
import {useState,type FormEvent} from "react";
import {ArrowRight} from "lucide-react";
import {ASSET_IDS,type MoneyByAsset} from "@/contracts";
import {assetNames,money,styles} from "./workspace";
export function FundingForm({balances,costRupiah,onSettle,disabled}:{balances:MoneyByAsset;costRupiah:number;onSettle:(funding:MoneyByAsset,ack:boolean)=>void;disabled:boolean}){
 const[amounts,setAmounts]=useState({cash:"0",bonds:"0",equity:"0"});const[acknowledged,setAcknowledged]=useState(false);
 const parsed=Object.fromEntries(ASSET_IDS.map(asset=>[asset,/^(0|[1-9]\d*)$/.test(amounts[asset])?Number(amounts[asset]):NaN])) as MoneyByAsset;
 const fieldsValid=ASSET_IDS.every(asset=>Number.isSafeInteger(parsed[asset])&&parsed[asset]>=0&&parsed[asset]<=balances[asset]);
 const total=parsed.cash+parsed.bonds+parsed.equity;
 const totalValid=Number.isSafeInteger(total)&&total>=0&&total<=costRupiah;
 const needsAcknowledgment=total<costRupiah&&!acknowledged;
 const valid=fieldsValid&&totalValid&&!needsAcknowledgment;
 function submit(event:FormEvent){event.preventDefault();if(!disabled&&valid)onSettle(parsed,acknowledged)}
 return <form onSubmit={submit}><fieldset disabled={disabled} style={{border:0,padding:0,margin:0}} aria-describedby="funding-validation"><div className={styles.formGrid}>{ASSET_IDS.map(asset=><div className={styles.field} key={asset}><label htmlFor={"funding-"+asset}>{assetNames[asset]} · Rp</label><input id={"funding-"+asset} className={styles.input} type="number" inputMode="numeric" min={0} max={balances[asset]} step={1} value={amounts[asset]} onChange={event=>setAmounts(current=>({...current,[asset]:event.target.value}))} aria-describedby={"available-"+asset} aria-invalid={!Number.isSafeInteger(parsed[asset])||parsed[asset]<0||parsed[asset]>balances[asset]} required/><p id={"available-"+asset} className={styles.fieldHelp}>Available {money(balances[asset])}</p></div>)}</div><label className={styles.checkboxRow} style={{margin:"20px 0"}}><input type="checkbox" checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/>I acknowledge any unpaid cost if my funding does not cover the bill. Unpaid cost is recorded without debt or a penalty.</label><p id="funding-validation" className={styles.fieldHelp} aria-live="polite" style={{marginBottom:14}}>{!fieldsValid?"Enter whole rupiah amounts within your available holdings.":!totalValid?"Total funding cannot exceed the bill of "+money(costRupiah)+".":needsAcknowledgment?"Acknowledge the unpaid cost before confirming partial funding.":"Your funding decision is ready to confirm."}</p><button className={styles.button} type="submit" disabled={disabled||!valid}>Confirm funding decision <ArrowRight size={14} aria-hidden="true"/></button><p className={styles.fieldHelp} style={{marginTop:12}}>Choose each amount yourself. No holdings are sold automatically.</p></fieldset></form>
}
