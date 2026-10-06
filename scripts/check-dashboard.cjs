const fs = require('fs');
let chromium;
try { ({chromium} = require('playwright')); }
catch { ({chromium} = require('C:/Users/sondr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }

async function check() {
  const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({headless:true, ...(fs.existsSync(chrome)?{executablePath:chrome}:{})});
  fs.mkdirSync('research/dashboard-qa', {recursive:true});
  const reports = [];
  try {
    for (const [width,height] of [[1440,900],[1920,1080],[390,844],[360,800],[768,1024]]) {
      for (const county of [false,true]) {
        const page = await browser.newPage({viewport:{width,height}});
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto((process.env.DASHBOARD_URL || 'http://127.0.0.1:4173/') + (county?'fylkesting.html':''));
        await page.waitForFunction(() => document.querySelector('.area-summary h2'));
        await page.waitForFunction(() => [...document.querySelectorAll('.leaflet-tile')].some(t => t.complete && t.naturalWidth>0));
        const metrics = await page.evaluate(() => ({
          overflow:document.documentElement.scrollWidth>innerWidth,
          name:document.querySelector('.area-summary h2').textContent,
          map:document.querySelector('#map,#county-map').getBoundingClientRect().toJSON(),
          candidateBottom:document.querySelector('#bergen-candidates,#county-candidates').getBoundingClientRect().bottom,
          pageHeight:document.documentElement.scrollHeight,
          logo:document.querySelector('.brand-mark img').complete && document.querySelector('.brand-mark img').naturalWidth>0,
        }));
        const prefix = `research/dashboard-qa/${county?'county':'municipal'}-${width}`;
        await page.screenshot({path:`${prefix}.png`, fullPage:true});
        if (width<640) {
          for (const tab of ['poll','election','candidates','map']) {
            await page.locator(`.mobile-tabs [data-tab=${tab}]`).click();
            const visible = await page.evaluate(() => [...document.querySelectorAll('.map-shell,.detail,.candidate-section,.county-map-card,.county-result,.county-candidates')].filter(n => !n.hidden).length);
            if (visible!==1) errors.push(`Mobile ${tab}: ${visible} sections`);
            if (await page.evaluate(() => document.documentElement.scrollWidth>innerWidth)) errors.push(`Overflow on ${tab}`);
          }
          for (const tab of ['poll','candidates']) {
            await page.locator(`.mobile-tabs [data-tab=${tab}]`).click();
            await page.screenshot({path:`${prefix}-${tab}.png`, fullPage:true});
          }
          await page.locator('.mobile-tabs [data-tab=poll]').click();
        }
        for (const tab of ['election','change','poll']) {
          await page.locator(`.status-tabs [data-tab=${tab}]`).click();
          if (await page.locator('.status-tabs [aria-selected=true]').getAttribute('data-tab')!==tab) errors.push(`Status tab ${tab} failed`);
        }
        await page.locator('.status-tabs button').first().focus();
        await page.keyboard.press('ArrowRight');
        if (await page.locator('.status-tabs [aria-selected=true]').getAttribute('data-tab')!=='election') errors.push('Keyboard tabs failed');
        if (!county) {
          if (width<640) await page.locator('.mobile-tabs [data-tab=map]').click();
          await page.locator('[data-party-filter=H]').click();
          if (await page.locator('[data-party-filter=H]').getAttribute('aria-pressed')!=='false') errors.push('Party filter failed');
          await page.locator('.filter-all').click();
          await page.selectOption('#county','18');
          await page.selectOption('#municipality','1826');
          await page.waitForFunction(() => document.querySelector('.area-summary h2').textContent==='Hattfjelldal');
          if (await page.locator('.candidate-card').count()) errors.push('Stale candidates');
          if (!await page.locator('.candidate-empty').count()) errors.push('Missing candidates state absent');
          const matching = await page.evaluate(() => Dashboard.electionBaseline({results:[{party:'Arbeiderpartiet',percent:18.5},{party:'Høyre',percent:26.5}]},parties));
          if (matching.Ap!==18.5 || matching.H!==26.5) errors.push('Party-name matching failed');
          await page.selectOption('#county','46');
          await page.selectOption('#municipality','4601');
          if (await page.locator('.candidate-card').count()!==11) errors.push('Bergen candidates failed to restore');
        } else {
          await page.selectOption('#county-select','18');
          await page.selectOption('#county-select','46');
          if (await page.locator('.county-candidate-photo').count()!==4) errors.push('Vestland candidates failed to restore');
        }
        reports.push({county,width,height,...metrics,errors});
        await page.close();
      }
    }
  } finally { await browser.close(); }
  fs.writeFileSync('research/dashboard-qa/report.json', JSON.stringify(reports,null,2));
  console.log(JSON.stringify(reports,null,2));
  if (reports.some(r => r.errors.length || r.overflow || !r.logo)) process.exitCode=1;
}
check().catch(e => { console.error(e); process.exitCode=1; });
