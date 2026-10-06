// Browser regression checks for the official-result corrections (requires running site).
const assert = require('node:assert/strict');
const fs = require('node:fs');
let chromium;
try { ({chromium} = require('playwright')); }
catch { ({chromium} = require('C:/Users/sondr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const base = process.env.DASHBOARD_URL || 'http://127.0.0.1:4173/';
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  fs.mkdirSync('research/election-results-qa', {recursive:true});
  try {
    for (const width of [1440, 360]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '?kommune=4601');
      await page.waitForSelector('.area-summary h2');
      if (width < 640) await page.locator('.mobile-tabs [data-tab=election]').click();
      else await page.locator('.status-tabs [data-tab=election]').click();
      const red = page.locator('.election-2023 .bar-row').filter({has:page.locator('.bar-label', {hasText:/^Rødt$/})});
      assert.match(await red.innerText(), /4,0/);
      assert.equal((await red.locator('.bar-seats').innerText()).trim(), '3');
      await page.locator('.status-tabs [data-tab=change]').click();
      const change = page.locator('.change-panel .bar-row').filter({has:page.locator('.bar-label', {hasText:/^Rødt$/})});
      assert.equal((await change.locator('.bar-previous').innerText()).trim(), '4,0');
      assert.equal((await change.locator('.bar-change').innerText()).trim(), '↑ +0,4');
      await page.screenshot({path:`research/election-results-qa/bergen-${width}.png`,fullPage:true});

      await page.goto(base + 'fylkesting.html');
      await page.waitForSelector('.area-summary h2');
      if (width < 640) await page.locator('.mobile-tabs [data-tab=election]').click();
      else await page.locator('.status-tabs [data-tab=election]').click();
      const countyData = JSON.parse(fs.readFileSync('dist/data/county-elections-2023.json','utf8'));
      for (const [code, data] of Object.entries(countyData)) {
        await page.selectOption('#county-select', code);
        const seats = await page.locator('#county-result-column .county-result-row em').allTextContents();
        assert.equal(seats.reduce((sum,s) => sum + Number(s),0), data.totalSeats, `County ${code} rendered seat total`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      await page.selectOption('#county-select', '32');
      const liberal = page.locator('#county-result-column .county-result-row').filter({has:page.locator('span', {hasText:/^Venstre$/})});
      assert.match(await liberal.innerText(), /6,3/);
      assert.equal(await liberal.locator('em').innerText(), '3');
      await page.screenshot({path:`research/election-results-qa/akershus-${width}.png`,fullPage:true});
      await page.selectOption('#county-select', '03');
      for (const tab of ['poll','election','change']) {
        await page.locator(`.status-tabs [data-tab=${tab}]`).click();
        assert.equal(await page.locator('[role=tabpanel]:visible .county-result-row').count(),0);
        assert.match(await page.locator('[role=tabpanel]:visible').innerText(), /Oslo har ikke fylkestingsvalg/);
      }
      assert.doesNotMatch(await page.locator('.area-summary').innerText(), /fylkestingsplasser|Fylkesordfører|Fylkesvaraordfører/);
      await page.locator('[role=tabpanel]:visible a').click();
      await page.waitForFunction(() => document.querySelector('.area-summary h2')?.textContent === 'Oslo');
      assert.equal(await page.locator('#municipality').inputValue(), '0301');
      assert.deepEqual(errors, []);
      console.log(`Verified Bergen, all 14 county totals, Akershus and Oslo navigation at ${width}px (${base})`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
