// Checks the scrolling/clipped-mandates regression against the running site.
let chromium;
try { ({chromium}=require('playwright')); }
catch { ({chromium}=require('C:/Users/sondr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const results=JSON.parse(fs.readFileSync('dist/data/elections-2023.json','utf8'));
 const largest=Object.entries(results).sort((a,b)=>b[1].results.filter(r=>r.percent>0||r.seats>0).length-a[1].results.filter(r=>r.percent>0||r.seats>0).length)[0][0];
 const reports=[];
 fs.mkdirSync('research/result-layout',{recursive:true});
 for(const [width,height] of [[1440,900],[1920,1080],[390,844],[360,800],[768,1024]]){
  for(const mode of ['municipal','county','most-parties']){
   const county=mode==='county';
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto((process.env.DASHBOARD_URL||'http://127.0.0.1:4173/')+(county?'fylkesting.html':mode==='most-parties'?'?kommune='+largest:''));
   await page.waitForSelector('.area-summary h2');
   if(county)await page.selectOption('#county-select','18');
   if(width<640)await page.locator('.mobile-tabs [data-tab=election]').click();
   else await page.locator('.status-tabs [data-tab=election]').click();
   const check=await page.evaluate(()=>{
    const card=document.querySelector('.detail,.county-result'),body=document.querySelector('#detail-content,.county-data-grid');
    const panel=document.getElementById(document.querySelector('.status-tabs [aria-selected=true]').getAttribute('aria-controls'));
    const seats=[...panel.querySelectorAll('.bar-seats,.county-result-row em')];
    const rect=card.getBoundingClientRect();
    return {name:document.querySelector('.area-summary h2').textContent,rows:seats.length,internalScroll:body.scrollHeight>body.clientHeight+1&&['auto','scroll'].includes(getComputedStyle(body).overflowY),fits:panel.getBoundingClientRect().bottom<=rect.bottom-8,seatsFit:seats.every(s=>s.getBoundingClientRect().right<=rect.right-8&&s.getBoundingClientRect().bottom<=rect.bottom-8&&s.scrollWidth<=s.clientWidth),pageOverflow:document.documentElement.scrollWidth>innerWidth};
   });
   await page.screenshot({path:`research/result-layout/${mode}-${width}.png`,fullPage:true});
   reports.push({width,height,mode,...check,errors});await page.close();
  }
 }
 await browser.close();fs.writeFileSync('research/result-layout/report.json',JSON.stringify(reports,null,2));
 console.log(JSON.stringify(reports,null,2));
 if(reports.some(r=>r.errors.length||r.internalScroll||!r.fits||!r.seatsFit||r.pageOverflow))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
