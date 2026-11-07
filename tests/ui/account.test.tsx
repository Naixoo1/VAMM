// @vitest-environment jsdom
import {type ReactNode} from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,render,renderHook,screen,waitFor,within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import {AccountControls,AccountPanel} from "@/components/auth/account-controls";
import {googleAuthorizationUrl,useAccount} from "@/hooks/use-account";

const fetchMock=vi.fn<typeof fetch>();
const clients:QueryClient[]=[];
const guest={configured:true,user:null};
const signedIn={configured:true,user:{name:"Ari Student",email:"ari@example.test"}};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json"}});
function setup(){const client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false},mutations:{retry:false}}});clients.push(client);return{client,wrapper:({children}:{children:ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>}}
function requests(method:string){return fetchMock.mock.calls.filter(([,options])=>(options?.method??"GET")===method)}
beforeEach(()=>{fetchMock.mockReset();fetchMock.mockResolvedValue(json(guest));vi.stubGlobal("fetch",fetchMock);window.history.replaceState({},"","/profile")});
afterEach(()=>{cleanup();clients.splice(0).forEach(client=>client.clear());vi.unstubAllGlobals();window.history.replaceState({},"","/")});

describe("Optional account controls",()=>{
 it("shows an honest unconfigured guest state and sends no auth mutation",async()=>{
  fetchMock.mockImplementation(async()=>json({configured:false,user:null}));const{wrapper}=setup();render(<AccountPanel/>,{wrapper});
  expect(await screen.findByText(/Google sign-in is not configured/)).toBeTruthy();
  const button=screen.getByRole("button",{name:"Continue with Google"});expect(button.getAttribute("aria-disabled")).toBe("true");await userEvent.click(button);expect(requests("POST")).toHaveLength(0);
  expect(screen.getByText(/does not sync, transfer, erase/)).toBeTruthy();expect(screen.getByText(/Every learning page remains available/)).toBeTruthy();
 });
 it("shows checking before the account projection arrives, without starting Google",async()=>{
  let finish!:(response:Response)=>void;fetchMock.mockImplementation(()=>new Promise(resolve=>{finish=resolve}));const{wrapper}=setup();render(<AccountControls/>,{wrapper});
  expect(screen.getByRole("status").textContent).toBe("Checking account…");expect(requests("POST")).toHaveLength(0);
  await act(async()=>finish(json(guest)));expect(await screen.findByRole("button",{name:"Continue with Google"})).toBeTruthy();
  expect(fetchMock.mock.calls[0][1]).toMatchObject({credentials:"same-origin",cache:"no-store"});
 });
 it("retains the focused account-check control through network error recovery",async()=>{
  let finish!:(response:Response)=>void;fetchMock.mockRejectedValueOnce(new Error("private provider diagnostic")).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));const{wrapper}=setup();render(<><AccountPanel/><input aria-label="Unrelated draft" defaultValue="keep this"/></>,{wrapper});
  const retry=await screen.findByRole("button",{name:"Check account again"});retry.focus();await userEvent.click(retry);
  await waitFor(()=>expect(retry.getAttribute("aria-disabled")).toBe("true"));expect(document.activeElement).toBe(retry);expect(document.body.contains(retry)).toBe(true);await act(async()=>finish(json(guest)));
  await waitFor(()=>expect(screen.queryByText(/Your account status could not be checked/)).toBeNull());
  expect(screen.getByRole("button",{name:"Check account again"})).toBe(retry);expect(document.activeElement).toBe(retry);expect((screen.getByRole("textbox",{name:"Unrelated draft"}) as HTMLInputElement).value).toBe("keep this");
  expect(document.body.textContent).not.toContain("private provider diagnostic");
 });
 it("projects only display identity fields, and rejects a contradictory unconfigured identity",async()=>{
  fetchMock.mockImplementation(async()=>json({configured:true,user:{...signedIn.user,token:"not-a-display-field"},session:{token:"not-a-display-field"}}));const{wrapper}=setup();const{result}=renderHook(()=>useAccount(),{wrapper});
  await waitFor(()=>expect(result.current.state).toBe("signed-in"));expect(result.current.user).toEqual(signedIn.user);
  fetchMock.mockImplementation(async()=>json({configured:false,user:signedIn.user}));await act(async()=>result.current.checkAgain());await waitFor(()=>expect(result.current.state).toBe("error"));expect(result.current.error).not.toContain("token");
 });
 it("serializes sign-in across shared consumers and sends only fixed callback fields",async()=>{
  let finish!:(response:Response)=>void;fetchMock.mockImplementation(async(url,options)=>options?.method==="POST"?new Promise(resolve=>{finish=resolve}):json(guest));const{wrapper}=setup();const navigate=vi.fn();
  const{result}=renderHook(()=>({toolbar:useAccount({navigate}),panel:useAccount({navigate})}),{wrapper});await waitFor(()=>expect(result.current.toolbar.state).toBe("guest"));
  act(()=>{result.current.toolbar.signIn();result.current.panel.signIn()});await waitFor(()=>expect(result.current.panel.state).toBe("pending"));expect(requests("POST")).toHaveLength(1);
  const request=requests("POST")[0];expect(request[0]).toBe("/api/auth/sign-in/social");expect(JSON.parse(String(request[1]?.body))).toEqual({provider:"google",callbackURL:"/profile",errorCallbackURL:"/profile?authError=oauth"});expect(request[1]).toMatchObject({credentials:"same-origin",cache:"no-store"});
  await act(async()=>finish(json({url:"https://accounts.google.com/o/oauth2/v2/auth?client_id=fixture",redirect:true})));await waitFor(()=>expect(navigate).toHaveBeenCalledExactlyOnceWith("https://accounts.google.com/o/oauth2/v2/auth?client_id=fixture"));
  act(()=>result.current.panel.signIn());expect(requests("POST")).toHaveLength(1);
 });
 it("rejects an unsafe redirect without echoing server details or attempting navigation",async()=>{
  fetchMock.mockImplementation(async(_url,options)=>json(options?.method==="POST"?{url:"https://accounts.google.com.evil.test/o/oauth2/v2/auth",redirect:true,error:"untrusted diagnostic"}:guest));const{wrapper}=setup();const navigate=vi.fn();const{result}=renderHook(()=>useAccount({navigate}),{wrapper});await waitFor(()=>expect(result.current.state).toBe("guest"));act(()=>result.current.signIn());await waitFor(()=>expect(result.current.state).toBe("error"));expect(navigate).not.toHaveBeenCalled();expect(result.current.error).toBe("Google sign-in could not start. Please try again. Your device history has not changed.");
 });
 it("keeps the sign-in action focused and explicitly retryable after a denied POST",async()=>{
  fetchMock.mockImplementation(async(_url,options)=>options?.method==="POST"?json({error:{message:"private detail"}},403):json(guest));const{wrapper}=setup();render(<AccountPanel/>,{wrapper});const button=await screen.findByRole("button",{name:"Continue with Google"});await userEvent.click(button);
  await screen.findByText(/Google sign-in could not start/);expect(document.activeElement).toBe(button);expect(button.getAttribute("aria-disabled")).toBe("false");expect(document.body.textContent).not.toContain("private detail");await userEvent.click(button);await waitFor(()=>expect(requests("POST")).toHaveLength(2));
 });
 it("confirms sign-out, rechecks only account data and retains focused action and unrelated state",async()=>{
  let signed=true;fetchMock.mockImplementation(async(_url,options)=>{if(options?.method==="POST"){signed=false;return json({success:true})}return json(signed?signedIn:guest)});
  const{wrapper,client}=setup();const preserved={records:["unchanged"]};client.setQueryData(["vamm-learning-progress"],preserved);client.setQueryData(["vamm-preserved-sessions"],preserved);
  render(<><AccountPanel/><input aria-label="Unsubmitted choice" defaultValue="keep"/></>,{wrapper});const button=await screen.findByRole("button",{name:"Sign out"});await userEvent.click(button);
  await waitFor(()=>expect(screen.getByRole("button",{name:"Continue with Google"})).toBe(button));expect(document.activeElement).toBe(button);expect(requests("POST")).toHaveLength(1);expect(requests("POST")[0][0]).toBe("/api/auth/sign-out");expect(JSON.parse(String(requests("POST")[0][1]?.body))).toEqual({});
  expect(client.getQueryData(["vamm-learning-progress"])).toBe(preserved);expect(client.getQueryData(["vamm-preserved-sessions"])).toBe(preserved);expect((screen.getByRole("textbox",{name:"Unsubmitted choice"}) as HTMLInputElement).value).toBe("keep");expect(fetchMock.mock.calls.every(([url])=>["/api/account","/api/auth/sign-out"].includes(String(url)))).toBe(true);
 });
 it("shares sign-out pending state across toolbar/panel and guards duplicate clicks",async()=>{
  let finish!:(response:Response)=>void;let signed=true;fetchMock.mockImplementation(async(_url,options)=>options?.method==="POST"?new Promise(resolve=>{finish=resolve}):json(signed?signedIn:guest));const{wrapper}=setup();render(<><AccountControls/><AccountPanel/></>,{wrapper});
  const toolbar=screen.getByRole("group",{name:"Account toolbar"});const panel=screen.getByRole("region",{name:"Google account"});const first=await within(toolbar).findByRole("button",{name:"Sign out"});await userEvent.click(first);
  const second=await within(panel).findByRole("button",{name:"Signing out…"});expect(second.getAttribute("aria-disabled")).toBe("true");await userEvent.click(second);expect(requests("POST")).toHaveLength(1);
  await act(async()=>{signed=false;finish(json({success:true}))});await waitFor(()=>expect(within(panel).getByRole("button",{name:"Continue with Google"})).toBeTruthy());expect(document.activeElement).toBe(second);
 });
 it("retains a signed-in session view and focused sign-out control after a failed sign-out",async()=>{
  fetchMock.mockImplementation(async(_url,options)=>options?.method==="POST"?json({error:{message:"untrusted"}},500):json(signedIn));const{wrapper}=setup();render(<AccountPanel/>,{wrapper});const button=await screen.findByRole("button",{name:"Sign out"});await userEvent.click(button);await screen.findByText(/Sign-out could not be confirmed/);expect(screen.getByText("Ari Student")).toBeTruthy();expect(document.activeElement).toBe(button);expect(document.body.textContent).not.toContain("untrusted");
 });
 it("marks sign-out unavailable when a cached identity cannot be rechecked",async()=>{
  fetchMock.mockResolvedValueOnce(json(signedIn)).mockRejectedValue(new Error("network"));const{wrapper}=setup();const{result}=renderHook(()=>useAccount(),{wrapper});await waitFor(()=>expect(result.current.state).toBe("signed-in"));await act(async()=>result.current.checkAgain());await waitFor(()=>expect(result.current.readFailed).toBe(true));
  render(<AccountPanel/>,{wrapper});const button=await screen.findByRole("button",{name:"Sign out"});await waitFor(()=>expect(button.getAttribute("aria-disabled")).toBe("true"));await userEvent.click(button);expect(requests("POST")).toHaveLength(0);
 });
 it("labels a fixed OAuth callback failure without reflecting arbitrary URL content",async()=>{
  window.history.replaceState({},"","/profile?authError=oauth&message=unsafe-markup");const{wrapper}=setup();render(<AccountPanel/>,{wrapper});expect(await screen.findByText(/Google sign-in was cancelled or could not finish/)).toBeTruthy();expect(document.body.textContent).not.toContain("unsafe-markup");expect(requests("POST")).toHaveLength(0);
 });
});

describe("Google authorization navigation boundary",()=>{
 it("accepts only Google's HTTPS authorization endpoint",()=>{expect(googleAuthorizationUrl("https://accounts.google.com/o/oauth2/v2/auth?state=fixture")).toBe("https://accounts.google.com/o/oauth2/v2/auth?state=fixture")});
 it.each(["http://accounts.google.com/o/oauth2/v2/auth","https://accounts.google.com.evil.test/o/oauth2/v2/auth","https://accounts.google.com:8443/o/oauth2/v2/auth","https://user:password@accounts.google.com/o/oauth2/v2/auth","https://accounts.google.com/other-path","https://accounts.google.com/o/oauth2/v2/auth#fragment","javascript:alert(1)","//accounts.google.com/o/oauth2/v2/auth"," https://accounts.google.com/o/oauth2/v2/auth"])("rejects unsafe navigation %s",url=>{expect(googleAuthorizationUrl(url)).toBeNull()});
});
