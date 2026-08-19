/**
 * @jest-environment jsdom
 *
 * Boot smoke test — a tripwire, not UI coverage. The calculation suite
 * (calculations.test.js, node env) never loads ui.js/app.js/storage.js,
 * so an unqualified cross-module identifier or a renderer that throws on
 * real data reaches the deployed site silently (ui.js:443 did exactly
 * that for two releases). This boots the real page headlessly and fails
 * on any error, missing element or empty table.
 *
 * Offline by construction: the Tailwind CDN script, the Google Fonts
 * @import and the gtag block are stripped before the HTML is parsed, and
 * no other resource is fetched.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// index.html load order (lines 1130-1134) — must match exactly.
const SCRIPTS = ['constants', 'calculations', 'storage', 'ui', 'app'];

const stripExternal = (html) => html
    .replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/, '')
    .replace(/@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);/, '')
    .replace(/<script async src="https:\/\/www\.googletagmanager\.com[^"]*"><\/script>/, '')
    .replace(/<script>\s*window\.dataLayer[\s\S]*?gtag\('config'[^)]*\);\s*<\/script>/, '');

// A small but realistic 2026-27 dataset (the current FY, so detectDefaultYear picks it) — the exact shapes the broken path
// exercised: WFH assets (incl. a depreciable one so the schedule renders),
// a WFH property with occupancy, a service-tagged expense, an identical
// equipment pair (lights the amber card), PAYG and taxpayer details.
const SEED = {
    userSettings: { currentSection: 'wfh-section', financialYear: '2026-2027' },
    taxpayerDetails: {
        isMedicareExempt: false, medicareExemptDays: 0, hasPrivateHospitalCover: false,
        reportableFringeBenefits: 0, personalSuperContribution: 0, filingStatus: 'single',
        spouseIncome: 0, dependentChildren: 0, phiAgeBracket: 'under65',
        phiPremiumsPaid_period1: 0, phiPremiumsPaid_period2: 0, phiRebateReceived: 0,
    },
    income: {
        payg: [{ id: 'p1', sourceName: 'Employer', grossSalary: 95000, taxWithheld: 23000 }],
        other: { bankInterest: 120, dividendsUnfranked: 0, dividendsFranked: 0, frankingCredits: 0, netCapitalGains: 0 },
    },
    generalExpenses: [
        { id: 'g1', description: 'Software Pro subscription', date: '2026-08-15', cost: 34, workPercentage: 100, assetType: 'service', isDepreciable: false, category: 'other' },
        { id: 'g2', description: 'USB cable', date: '2026-09-01', cost: 180, workPercentage: 100, assetType: 'equipment', isDepreciable: false, category: 'tools' },
        { id: 'g3', description: 'USB cable', date: '2026-09-02', cost: 180, workPercentage: 100, assetType: 'equipment', isDepreciable: false, category: 'tools' },
    ],
    wfh: {
        method: 'actual_cost', hoursLog: [], totalMinutes: 0,
        actualCostDetails: {
            properties: [{
                id: 'prop1', description: 'Home office', fromDate: '2026-07-01', toDate: '2027-06-30',
                officeArea: 10, totalHomeArea: 100, electricityCost: 1500, gasCost: 300,
                occupancyCost: 12000, internetCost: 900, internetWorkPercent: 60,
                phoneCost: 240, stationeryCost: 80,
            }],
            assets: [
                { id: 'a1', description: 'Desk', date: '2026-08-01', cost: 450, workPercentage: 80, assetType: 'equipment', isDepreciable: false },
                { id: 'a2', description: 'Monitor', date: '2026-10-01', cost: 1200, workPercentage: 100, assetType: 'equipment', isDepreciable: true, effectiveLife: 4, depreciationMethod: 'prime_cost' },
                { id: 'a3', description: 'Docking station', date: '2026-12-03', cost: 260, workPercentage: 60, assetType: 'consumable', isDepreciable: false },
            ],
        },
    },
};

describe('boot smoke — real page loads clean under jsdom', () => {
    let consoleErrors;

    beforeAll(() => {
        const rawHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        // Drift guard: the SCRIPTS list and the strip patterns below are
        // hand-copied facts about index.html. Assert they still hold, so a
        // page edit cannot silently narrow the tripwire (a removed or added
        // module would otherwise boot a different app than the real page).
        const pageScripts = [...rawHtml.matchAll(/<script src="(js\/[a-z]+\.js)"><\/script>/g)]
            .map(m => m[1].replace(/^js\//, '').replace(/\.js$/, ''));
        expect(pageScripts).toEqual(SCRIPTS);
        const html = stripExternal(rawHtml);
        // Pin the clock: detectDefaultYear derives the current FY from the
        // real date, and the seed targets the year this repo configures as
        // current. Unpinned, the documented FY-addition change (a new
        // TAX_CONFIG key around each July) would flip the detected year and
        // fail this suite with a phantom rendering bug.
        jest.useFakeTimers({ doNotFake: ['nextTick', 'requestAnimationFrame'] });
        jest.setSystemTime(new Date('2026-08-15T10:00:00Z'));
        document.documentElement.innerHTML = html;

        // Canary: the externals really are gone from the parsed page.
        expect(html).not.toMatch(/cdn\.tailwindcss\.com|fonts\.googleapis\.com|googletagmanager\.com/);
        // jsdom does not implement the HTMLFormElement named-property
        // shorthand (form['field-name']) that every browser provides and
        // the app uses throughout; form.elements.namedItem has the same
        // data. Bridge it per field — a polyfill for missing browser
        // behaviour, not an app change.
        document.querySelectorAll('form').forEach(form => {
            form.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.name && !(el.name in form)) {
                    Object.defineProperty(form, el.name, {
                        get: () => form.elements.namedItem(el.name),
                        configurable: true,
                    });
                }
            });
        });

        // Seed storage BEFORE any script runs — detectDefaultYear and
        // loadData read it during App.init.
        window.localStorage.setItem('aussieTaxHelperData-2027', JSON.stringify(SEED));

        consoleErrors = [];
        jest.spyOn(console, 'error').mockImplementation((...args) => consoleErrors.push(args.join(' ')));
        window.onerror = (msg) => { consoleErrors.push(String(msg)); return false; };

        // Load the five modules in index.html order. They attach to
        // window/globals, so each require just needs to run once.
        SCRIPTS.forEach(name => require(path.join(ROOT, 'js', `${name}.js`)));

        // app.js registered DOMContentLoaded → App.init at require time,
        // and jsdom's document is already complete, so fire it manually.
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    afterAll(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
        window.onerror = null;
    });

    test('boots with no page errors and nothing on console.error', () => {
        expect(consoleErrors).toEqual([]);
    });

    test('WFH assets table renders every seeded asset (the path that broke)', () => {
        const rows = document.querySelectorAll('#wfh-assets-list-body tr');
        expect(rows.length).toBe(3);
        expect(document.getElementById('wfh-assets-list-body').textContent).not.toMatch(/No assets added yet/);
    });

    test('WFH properties table renders the seeded property', () => {
        expect(document.querySelectorAll('#wfh-properties-list-body tr').length).toBe(1);
        expect(document.getElementById('wfh-properties-list-body').textContent).toContain('Home office');
    });

    test('method display reflects the saved method, not "Not Selected"', () => {
        expect(document.getElementById('wfh-current-method-display').textContent).toBe('Actual Cost');
    });

    test('summary populated and identical-assets warning lit for the cable pair', () => {
        expect(document.getElementById('summary-net-tax').textContent).toMatch(/\$/);
        expect(document.getElementById('identical-assets-warning').classList.contains('hidden')).toBe(false);
    });

    test('a mutation round-trip through the real event path still renders clean', () => {
        // Remove one asset via the year-selector change event (a real user
        // path that re-runs loadData + the full refresh): flip to the same
        // year after editing storage, so refreshUI re-renders from changed
        // data. Then also exercise a direct renderer call with a new asset.
        const stored = JSON.parse(window.localStorage.getItem('aussieTaxHelperData-2027'));
        stored.wfh.actualCostDetails.assets = stored.wfh.actualCostDetails.assets.filter(a => a.id !== 'a1');
        window.localStorage.setItem('aussieTaxHelperData-2027', JSON.stringify(stored));

        const selector = document.getElementById('financial-year-selector');
        selector.value = '2026-2027';
        selector.dispatchEvent(new Event('change'));

        expect(document.querySelectorAll('#wfh-assets-list-body tr').length).toBe(2);
        expect(consoleErrors).toEqual([]);

        // Direct renderer round with data the app never saw — a fresh asset
        // shape must render, not throw (the original bug class).
        window.UIManager.displayWfhAssetsList([
            { id: 'z9', description: 'Laptop', date: '2026-11-05', cost: 2000, workPercentage: 0, assetType: 'equipment', isDepreciable: true, effectiveLife: 2, depreciationMethod: 'diminishing_value' },
        ]);
        expect(document.querySelectorAll('#wfh-assets-list-body tr').length).toBe(1);
        expect(document.getElementById('wfh-assets-list-body').textContent).toContain('Laptop');
        expect(consoleErrors).toEqual([]);
    });
});
