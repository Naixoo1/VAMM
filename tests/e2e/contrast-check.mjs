import { installLiveFeatureWidgetStubs } from "./live-features-widget-stub.ts";
import { installLiveNewsStub } from "./live-news-stub.ts";
import { installTradingViewStub } from "./tradingview-stub.ts";
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
function scanContrast() {
  const rgb = color => { const values = color.match(/[\d.]+/g)?.map(Number) ?? [0,0,0]; return [values[0],values[1],values[2],values[3] ?? 1]; };
  const over = (front, back) => front.slice(0,3).map((v,i) => v*front[3]+back[i]*(1-front[3]));
  const luminance = color => color.map(v => {v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
  const result = [];
  const dialog = document.querySelector("dialog[open]");
  const elements = dialog ? dialog.querySelectorAll("*") : document.querySelectorAll('main *,aside *,header *,footer *,[aria-label="Animation preferences"] *');
  for (const element of elements) {
    if (!element.getClientRects().length || element.closest("[aria-hidden=true],:disabled")) continue;
    const style = getComputedStyle(element);
    if (style.visibility !== "visible" || style.display === "none") continue;
    const direct = [...element.childNodes].filter(node => node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join("").trim();
    const text = direct || (element instanceof HTMLInputElement ? element.value : "");
    if (!text) continue;
    let background = [255,255,255];
    const ancestors = [];
    for(let item=element;item;item=item.parentElement) ancestors.unshift(item);
    for(const item of ancestors) background=over(rgb(getComputedStyle(item).backgroundColor),background);
    const foreground=rgb(element instanceof SVGElement ? style.fill : style.color);
    const foregroundOnBackground=over(foreground,background);
    const light=luminance(foregroundOnBackground), dark=luminance(background);
    const ratio=(Math.max(light,dark)+0.05)/(Math.min(light,dark)+0.05);
    const large=parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.667&&parseInt(style.fontWeight)>=700);
    if(ratio < (large?3:4.5)) result.push({text:text.slice(0,100),ratio:Number(ratio.toFixed(2)),color:style.color,fill:style.fill,font:style.fontSize,className:element.getAttribute("class")});
  }
  return result;
}
const browser = await chromium.launch();
const reports = [];
for (const [viewport, width, height] of [["1440x900",1440,900],["390x844",390,844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await installLiveFeatureWidgetStubs(page);
  await installTradingViewStub(page);
  await installLiveNewsStub(page);
  const inspect = async route => reports.push({viewport,route,failures:await page.evaluate(scanContrast)});
  for (const route of ["dashboard","market","compare","research","simulation","news","academy","missions","profile"]) {
    await page.goto("http://127.0.0.1:3000/" + route);
    await page.getByRole("heading",{level:1}).waitFor();
    await page.waitForFunction(() => !Array.from(document.querySelectorAll('main [role="status"]')).some(element => element.getClientRects().length > 0 && /Restoring|Loading instrument choices/.test(element.textContent || "")));
    if(route==="dashboard") await page.locator("[data-live-market-kind=summary][data-live-market-state=ready]").waitFor();
    if(route==="research") await page.getByLabel("Company context",{exact:true}).waitFor();
    if(route==="news") await page.getByRole("heading",{name:"Live market news",exact:true}).waitFor();
    await inspect(route);
    if(route==="academy") {
      for(const lesson of ["stocks","prices","returns","risk","diversification","fundamentals","technical","compounding","inflation","costs"]) {
        await page.goto("http://127.0.0.1:3000/academy?lesson="+lesson);
        await page.locator('[data-learning-diagram="'+lesson+'"]').waitFor();
        await page.getByText("Reveal a way to reason",{exact:true}).click();
        await inspect("academy-"+lesson);
        await page.getByRole("button",{name:"Mark lesson complete",exact:true}).click();
        await page.getByRole("button",{name:"Lesson complete",exact:true}).waitFor();
      }
    }
    if(route==="missions") {
      await page.goto("http://127.0.0.1:3000/missions?quiz=stocks-101");
      await page.getByRole("button",{name:"Start quiz",exact:true}).waitFor();
      await inspect("missions-setup");
      await page.getByRole("button",{name:"Start quiz",exact:true}).click();
      await page.getByRole("radio").first().check();
      await inspect("missions-question");
      await page.getByRole("button",{name:"Exit quiz",exact:true}).click();
      await page.getByRole("dialog",{name:"Exit quiz?",exact:true}).waitFor();
      await inspect("missions-exit");
      await page.getByRole("button",{name:"Stay in quiz",exact:true}).click();
      for(let i=0;i<5;i++) {
        await page.getByRole("radio").first().check();
        await page.getByRole("button",{name:i===4?"Submit answers":"Next question",exact:true}).click();
        if(i<4)await page.getByText("Question "+(i+2)+" of 5",{exact:true}).waitFor();
      }
      await page.getByTestId("quiz-score").waitFor();
      await inspect("missions-result");
    }
    const learningSummary={research:"Synthetic basket mentor"}[route];
    if(learningSummary){
      await page.locator("summary").filter({hasText:learningSummary}).click();
      if(route==="research")await page.getByRole("checkbox",{name:"Simulated bond basket"}).waitFor();
      await inspect(route+"-learning");
    }
    if(route==="research") {
      await page.getByLabel("Your question").fill("Explain why synthetic results are not a forecast.");
      await page.getByRole("button",{name:"Ask your mentor"}).click();
      await page.getByText("Prewritten fallback",{exact:true}).waitFor();
      await inspect("research-answer");
    }
    if(route==="simulation") {
      await page.getByRole("button",{name:"Start your simulation"}).click();
      await page.getByRole("button",{name:"Advance one year"}).click();
      await page.getByRole("button",{name:"Confirm funding decision"}).waitFor();
      await page.waitForFunction(() => !Array.from(document.querySelectorAll('main [role="status"]')).some(element => element.getClientRects().length > 0 && /Restoring|Loading instrument choices/.test(element.textContent || "")));
      await inspect("simulation-pending");
      await page.getByRole("button",{name:"New session",exact:true}).click();
      await inspect("reset-dialog");
    }
  }
  await page.close();
}
await browser.close();
await writeFile("tests/e2e/evidence/contrast.json",JSON.stringify(reports,null,2));
for(const report of reports) console.log(JSON.stringify({viewport:report.viewport,route:report.route,count:report.failures.length,examples:report.failures.slice(0,8)}));
if(reports.some(report=>report.failures.length)) process.exitCode=1;
