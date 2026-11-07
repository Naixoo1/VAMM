"use client";

import {useMutation,useMutationState,useQuery,useQueryClient,type QueryFunctionContext} from "@tanstack/react-query";

export interface AccountUser {name:string;email:string|null}
export interface AccountSummary {configured:boolean;user:AccountUser|null}
export type AccountState="checking"|"pending"|"error"|"guest"|"unconfigured"|"signed-in";
type AccountAction="sign-in"|"sign-out";
interface AccountIssue {message:string}
interface ActionSnapshot {status:string;action:AccountAction|undefined;error:AccountIssue|null;redirecting:boolean}
const ACCOUNT_KEY=["vamm-account"] as const;
const ACTION_KEY=["vamm-account-action"] as const;
const statusIssue:AccountIssue={message:"Your account status could not be checked. Your device history has not changed."};
const signInIssue:AccountIssue={message:"Google sign-in could not start. Please try again. Your device history has not changed."};
const signOutIssue:AccountIssue={message:"Sign-out could not be confirmed. Please try again. Your device history has not changed."};

/** Pick only the public projection; no session or provider token is kept in client state. */
function accountSummary(value:unknown):AccountSummary {
 if(!value||typeof value!=="object")throw statusIssue;
 const dto=value as Record<string,unknown>;
 if(typeof dto.configured!=="boolean")throw statusIssue;
 if(dto.user===null)return{configured:dto.configured,user:null};
 if(!dto.configured||!dto.user||typeof dto.user!=="object")throw statusIssue;
 const user=dto.user as Record<string,unknown>;
 if(typeof user.name!=="string"||!user.name.trim()||user.name.length>200||!(user.email===null||typeof user.email==="string")||(typeof user.email==="string"&&user.email.length>320))throw statusIssue;
 return{configured:true,user:{name:user.name.trim(),email:user.email as string|null}};
}

async function readAccount({signal}:QueryFunctionContext<typeof ACCOUNT_KEY>):Promise<AccountSummary>{
 try{
  const response=await fetch("/api/account",{method:"GET",credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"},signal});
  if(!response.ok)throw statusIssue;
  return accountSummary(await response.json());
 }catch{throw statusIssue}
}

/** Navigation is allowed only to Google's HTTPS authorization host. */
export function googleAuthorizationUrl(value:unknown):string|null{
 if(typeof value!=="string"||value.length>8192||value!==value.trim())return null;
 try{const url=new URL(value);return url.origin==="https://accounts.google.com"&&url.pathname==="/o/oauth2/v2/auth"&&!url.username&&!url.password&&!url.hash?url.href:null}catch{return null}
}
function navigateToGoogle(url:string){window.location.assign(url)}

export function useAccount({navigate=navigateToGoogle}:{navigate?:(url:string)=>void}={}){
 const client=useQueryClient();
 const query=useQuery({queryKey:ACCOUNT_KEY,queryFn:readAccount,retry:false,staleTime:0,refetchOnWindowFocus:true});
 // Mutation-cache state is shared by toolbar/profile consumers, without another provider.
 const actions=useMutationState<ActionSnapshot>({filters:{mutationKey:ACTION_KEY,exact:true},select:mutation=>({status:mutation.state.status,action:mutation.state.variables as AccountAction|undefined,error:mutation.state.error as AccountIssue|null,redirecting:!!(mutation.state.data as {redirecting?:boolean}|undefined)?.redirecting})});
 const active=[...actions].reverse().find(action=>action.status==="pending");
 const latest=actions.at(-1);
 const busy=!!active||!!(latest?.status==="success"&&latest.redirecting);
 const mutation=useMutation<{redirecting:boolean},AccountIssue,AccountAction>({mutationKey:ACTION_KEY,retry:false,mutationFn:async action=>{
  const fallback=action==="sign-in"?signInIssue:signOutIssue;
  try{
   await client.cancelQueries({queryKey:ACCOUNT_KEY,exact:true});
   const response=await fetch(action==="sign-in"?"/api/auth/sign-in/social":"/api/auth/sign-out",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(action==="sign-in"?{provider:"google",callbackURL:"/profile",errorCallbackURL:"/profile?authError=oauth"}:{})});
   if(!response.ok)throw fallback;
   const dto:unknown=await response.json();
   if(!dto||typeof dto!=="object")throw fallback;
   if(action==="sign-in"){
    const result=dto as Record<string,unknown>;const url=googleAuthorizationUrl(result.url);
    if(result.redirect!==true||!url)throw signInIssue;
    navigate(url);return{redirecting:true};
   }
   if((dto as Record<string,unknown>).success!==true)throw signOutIssue;
   // Confirmed sign-out changes only this projection. Device records are never touched.
   client.setQueryData<AccountSummary>(ACCOUNT_KEY,{configured:true,user:null});
   try{await client.fetchQuery({queryKey:ACCOUNT_KEY,queryFn:readAccount,staleTime:0,retry:false})}catch{throw statusIssue}
   return{redirecting:false};
  }catch(error){throw error===statusIssue?statusIssue:fallback}
 }});
 function act(action:AccountAction){
  // Synchronous cache check also guards two controls clicked before React re-renders.
  if(client.getMutationCache().findAll({mutationKey:ACTION_KEY,exact:true,status:"pending"}).length||busy||query.isFetching||query.error||!query.data?.configured)return;
  if(action==="sign-in"&&query.data.user)return;
  if(action==="sign-out"&&!query.data.user)return;
  mutation.mutate(action);
 }
 async function checkAgain(){
  if(client.getMutationCache().findAll({mutationKey:ACTION_KEY,exact:true,status:"pending"}).length||busy||query.isFetching)return;
  for(const item of client.getMutationCache().findAll({mutationKey:ACTION_KEY,exact:true}))client.getMutationCache().remove(item);
  await query.refetch();
 }
 const error=latest?.status==="error"?latest.error:query.error;
 const state:AccountState=busy?"pending":query.isPending?"checking":error?"error":query.data?.user?"signed-in":query.data?.configured?"guest":"unconfigured";
 return{state,user:query.data?.user??null,configured:query.data?.configured??false,error:error?.message??null,readFailed:!!query.error,busy,checking:query.isFetching,action:active?.action??(latest?.redirecting?"sign-in":null),signIn:()=>act("sign-in"),signOut:()=>act("sign-out"),checkAgain};
}

export type AccountController=ReturnType<typeof useAccount>;
