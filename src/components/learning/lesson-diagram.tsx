"use client";
import {useId} from "react";
import type {LessonId} from "@/lib/learning/types";
import styles from "./learning.module.css";

const diagrams:Record<LessonId,{title:string;description:string;steps:readonly string[]}>= {
 stocks:{title:"A small piece of ownership",description:"Hypothetical illustration: a company has 100 equal shares. One highlighted square represents one share, or 1% ownership. It says nothing about a future return.",steps:[]},
 prices:{title:"A quote is a starting point",description:"Illustrative process: a displayed quote informs an order request. Execution follows market conditions and the order's terms; the displayed quote does not guarantee a fill price.",steps:["Displayed|quote","Order|request","Possible|execution"]},
 returns:{title:"Look beyond a price change",description:"Hypothetical mechanism: a holding's price can change and it may pay a distribution. Fees and taxes affect what remains. No company or return is represented here.",steps:["Price|change","Possible|distribution","Costs|matter"]},
 risk:{title:"Risk has several sources",description:"Illustrative categories: company events, market movements and rising prices can affect an investment. These sources can overlap; the boxes are not risk scores.",steps:["Company|events","Market|movements","Rising|prices"]},
 diversification:{title:"Spread exposure, keep perspective",description:"Hypothetical illustration: several different holdings spread exposure beyond a single company. Some risks remain shared, so diversification cannot guarantee that losses will be avoided.",steps:["Different|holdings","Less single-|company exposure","Losses still|possible"]},
 fundamentals:{title:"Read what a business reports",description:"Illustrative relationship: revenue is earned before expenses. Expenses affect earnings. These are concepts for reading reports, not actual company figures.",steps:["Revenue","Expenses","Earnings"]},
 technical:{title:"Past observations, an unknown next step",description:"Entirely hypothetical chart: the solid line describes invented past movements. The blank future area is unknown. A historical pattern does not establish what a price will do next.",steps:[]},
 compounding:{title:"Growth can change the starting base",description:"Hypothetical mechanism: retained gains can become part of a later starting balance. Future changes can be positive or negative. This illustration assumes no rate and makes no forecast.",steps:["Starting|balance","Retained|change","Changed|future base"]},
 inflation:{title:"The same cash can buy less",description:"Hypothetical illustration: with the same cash, higher prices can mean fewer items. The boxes show the idea of purchasing power, not observed product prices.",steps:["Same cash","Higher|prices","Fewer|items"]},
 costs:{title:"Costs affect what remains",description:"Hypothetical mechanism: fees and expenses reduce the amount retained from an investment. Actual products have different costs; no fee or return is assumed here.",steps:["Before|costs","Fees and|expenses","What|remains"]},
};
export function LessonDiagram({lessonId}:{lessonId:LessonId}){
 const id=useId();const diagram=diagrams[lessonId];
 return <figure className={styles.diagram} data-learning-diagram={lessonId}>
  <h3>{diagram.title}</h3>
  <svg viewBox="0 0 400 220" role="img" aria-labelledby={id+"-title "+id+"-description"}>
   <title id={id+"-title"}>{diagram.title}</title><desc id={id+"-description"}>{diagram.description}</desc>
   {lessonId==="stocks"?<><rect x="114" y="8" width="172" height="174" rx="12" fill="#fff" stroke="#d4dfec"/>{Array.from({length:100},(_,index)=><rect key={index} x={131+index%10*14} y={25+Math.floor(index/10)*14} width="10" height="10" rx="2" fill={index===0?"#c74424":"#d7e7f9"} stroke={index===0?"#aa351a":"#b8cfea"}/>)}<text x="200" y="207" textAnchor="middle" fill="#52657b" fontSize="13">100 equal shares · 1 highlighted</text></>:lessonId==="technical"?<><rect x="299" y="25" width="77" height="150" rx="10" fill="#f1f5fa"/><path d="M24 175h352M24 125h260M24 75h260" fill="none" stroke="#d4dfec"/><path d="M28 147 57 133 85 149 114 104 143 120 172 89 201 109 230 74 259 94 283 70" fill="none" stroke="#225bd5" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/><path d="M295 22v160" stroke="#aebed1" strokeDasharray="4 5"/><text x="145" y="207" textAnchor="middle" fill="#52657b" fontSize="13">Invented past observations</text><text x="337" y="103" textAnchor="middle" fill="#52657b" fontSize="13">Unknown</text></>:<>{diagram.steps.map((step,index)=><g key={step}><rect x={14+index*131} y="55" width="110" height="90" rx="13" fill={index===1?"#fff3eb":"#fff"} stroke={index===1?"#e7bcab":"#bed2e8"}/>{step.split("|").map((line,lineIndex)=><text key={lineIndex} x={69+index*131} y={step.includes("|")?92+lineIndex*20:104} textAnchor="middle" fill="#2e4866" fontSize="13" fontWeight="600">{line}</text>)}{index<2&&<path d={"M"+(129+index*131)+" 100h10m-4-4 4 4-4 4"} fill="none" stroke="#225bd5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>}</g>)}<text x="200" y="188" textAnchor="middle" fill="#52657b" fontSize="12">Illustrative concept · no live financial values</text></>}
  </svg>
  <figcaption>{diagram.description}</figcaption>
 </figure>;
}
