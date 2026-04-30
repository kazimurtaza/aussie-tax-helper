# Australian Tax Research — 2025-2026 Financial Year
**Date:** 2026-04-30
**Purpose:** Verify and update tax constants in the Aussie Tax Helper app

---

## 1. Income Tax Brackets and Rates (Residents)

**Status: No change from 2024-25.** Stage 3 tax cuts remain in place.

| Taxable Income | Tax on this Income |
|---|---|
| $0 - $18,200 | Nil |
| $18,201 - $45,000 | 16c for each $1 over $18,200 |
| $45,001 - $135,000 | $4,288 + 30c for each $1 over $45,000 |
| $135,001 - $190,000 | $31,288 + 37c for each $1 over $135,000 |
| $190,001 and over | $51,638 + 45c for each $1 over $190,000 |

**Future legislated changes:**
- 1 July 2026: 16% rate drops to **15%**
- 1 July 2027: 15% rate drops to **14%**

**App status:** Correct. No update needed.
**Verified against:** ATO rates page, CPA Australia Budget Report 2025-26.

---

## 2. Low Income Tax Offset (LITO)

**Status: No change from 2024-25.**

| Taxable Income | Offset Amount |
|---|---|
| $37,500 or less | $700 |
| $37,501 - $45,000 | $700 minus 5c for each $1 over $37,500 |
| $45,001 - $66,667 | $325 minus 1.5c for each $1 over $45,000 |
| $66,668 or more | Nil |

- LITO effectively raises the tax-free threshold from $18,200 to ~$22,575
- LMITO (Low and Middle Income Tax Offset) remains expired (ended after 2021-22)

**App status:** Correct. No update needed.
**Verified against:** ATO LITO page (published 16 June 2025), CPA Australia Budget Report 2025-26.

---

## 3. Medicare Levy

**Status: Rate unchanged at 2%. Thresholds unchanged for 2025-26.**

| Category | Low-income threshold (no levy) | Shade-in ends (full 2%) |
|---|---|---|
| Singles | $27,222 | $34,027 |
| Families (not SAPTO) | $45,907 (+ $4,216 per child) | $57,383 (+ $5,270 per child) |
| Single Seniors & Pensioners (SAPTO) | $43,020 | $53,775 |
| Families (Senior & Pensioner) | $59,886 (+ $4,216 per child) | $74,857 (+ $5,270 per child) |

The levy phases in at 10c per $1 above the lower threshold.

**Future change:** 2025-26 Budget announced increased Medicare levy low-income thresholds from 1 July 2026 (not 2025).

**App status:** Correct. No update needed.
**Verified against:** ATO M1 Medicare levy reduction 2025 instructions, William Buck Tax Rates 2025-26, ITP Tax Rates 2026.
**Note:** The ATO has not published a dedicated 2025-26 Medicare levy page yet (their myTax 2025 instructions are for the 2024-25 income year). However, the 2025-26 Budget only announced Medicare levy threshold increases from 1 July 2026 — not 2025. Multiple authoritative sources (William Buck, ITP, SuperGuide) confirm the thresholds remain at $27,222/$34,027 for 2025-26.

---

## 4. Medicare Levy Surcharge (MLS) Thresholds

**Status: Updated for 2025-26.**

| Tier | Singles | Families | Surcharge Rate |
|---|---|---|---|
| Base (no surcharge) | $0 - $101,000 | $0 - $202,000 | 0% |
| Tier 1 | $101,001 - $118,000 | $202,001 - $236,000 | 1.0% |
| Tier 2 | $118,001 - $158,000 | $236,001 - $316,000 | 1.25% |
| Tier 3 | $158,001+ | $316,001+ | 1.5% |

Family thresholds increase by **$1,500** per dependent child after the first.

**Comparison with 2024-25:** Singles base was $97,000 (now $101,000). Families base was $194,000 (now $202,000).

**App status: NEEDS UPDATE.** Current code has Tier 1 ending at $117,000 and Tier 2 ending at $155,000 for singles. Correct values are $118,000 and $158,000. Family tiers similarly need updating ($234,000 -> $236,000, $310,000 -> $316,000).
**Verified against:** ATO MLS income thresholds and rates page (has dedicated 2025-26 section), ATO PHI rebate thresholds page, privatehealth.gov.au, William Buck Tax Rates 2025-26.

---

## 5. Private Health Insurance (PHI) Rebate Rates

**Status: Updated for 2025-26.**

### Period 1: 1 July 2025 — 31 March 2026

| Income Tier | Under 65 | Age 65-69 | Age 70+ |
|---|---|---|---|
| Base (singles <=$101k / families <=$202k) | 24.288% | 28.337% | 32.385% |
| Tier 1 (singles $101,001-$118k / families $202,001-$236k) | 16.192% | 20.240% | 24.288% |
| Tier 2 (singles $118,001-$158k / families $236,001-$316k) | 8.095% | 12.143% | 16.192% |
| Tier 3 (singles $158,001+ / families $316,001+) | 0% | 0% | 0% |

### Period 2: 1 April 2026 — 30 June 2026

| Income Tier | Under 65 | Age 65-69 | Age 70+ |
|---|---|---|---|
| Base | 24.118% | 28.139% | 32.158% |
| Tier 1 | 16.079% | 20.098% | 24.118% |
| Tier 2 | 8.038% | 12.058% | 16.079% |
| Tier 3 | 0% | 0% | 0% |

**Rebate Adjustment Factor:** 0.987 (applied from 1 April each year).

**Notable future proposal:** Government has proposed removing higher age-based rebate tiers (65-69 and 70+). Not yet legislated.

**App status: NEEDS UPDATE.** Current code uses 2024-25 PHI rates as placeholders. All rates differ.
**Verified against:** ATO PHI rebate thresholds and rates page (has dedicated 2025-26 section with both periods), privatehealth.gov.au, Department of Health PHI Circular 21/25.

---

## 6. Work From Home (WFH) Fixed Rate

**Status: Unchanged at $0.70/hour** (effective from 1 July 2022 onwards).

Requirements:
- Must keep a record of **actual hours worked from home for the entire financial year** (no 4-week diary shortcut)
- Must retain at least one bill for each expense type covered
- Covers: electricity, gas, phone, internet, stationery, computer consumables
- Depreciation on work-related assets can still be claimed separately

**App status:** Correct. No update needed.
**Verified against:** ATO WFH fixed rate method page.

---

## 7. Superannuation Guarantee (SG)

| Item | 2024-25 | 2025-26 |
|---|---|---|
| SG Rate | 11.5% | **12%** (final legislated increase) |
| Max contribution base (per quarter) | $65,070 | $62,500 |
| Concessional contributions cap | $30,000 | $30,000 |
| Non-concessional contributions cap | $120,000 | $120,000 |
| Transfer Balance Cap | $1,900,000 | $2,000,000 |

**App status:** Not currently modelled in the app. SG rate change may affect users' PAYG statements.

---

## 8. HELP/Student Debt Changes

- All outstanding HELP debts reduced by **20%** (before 1 June 2025 indexation)
- Minimum repayment threshold increased from $54,435 to **$67,000** (from 1 July 2025)
- Moved to a **marginal repayment system**

**App status:** Not currently modelled in the app.

---

## 9. Instant Asset Write-Off (Small Business)

- Threshold: **$20,000** per asset (unchanged)
- Car depreciation limit: **$69,674** (2024-25; 2025-26 figure yet to be confirmed)
- Cents per kilometre rate: **88 cents** (2024-25; 2025-26 yet to be confirmed)

**App status:** Not currently modelled (app targets salaried employees).

---

## 10. Other Rates (Unchanged)

| Item | Value | Notes |
|---|---|---|
| Company tax (base rate entities) | 25% | Unchanged |
| Company tax (other) | 30% | Unchanged |
| Division 293 tax threshold | $250,000 | Unchanged |
| Tax on super > $3M (Div 296) | Not enacted | Legislation stalled in Senate |

---

## Action Items for the App

| Priority | Item | Current Value | Correct Value |
|---|---|---|---|
| **HIGH** | PHI rebate rates 2025-26 Period 1 | 2024-25 rates | See Section 5 above |
| **HIGH** | PHI rebate rates 2025-26 Period 2 | 2024-25 rates | See Section 5 above |
| **MEDIUM** | MLS Tier 1 singles cap | $117,000 | $118,000 |
| **MEDIUM** | MLS Tier 2 singles cap | $155,000 | $158,000 |
| **MEDIUM** | MLS Tier 1 families cap | $234,000 | $236,000 |
| **MEDIUM** | MLS Tier 2 families cap | $310,000 | $316,000 |
| **LOW** | Remove placeholder comments | "NOT YET RELEASED" | Update to "Confirmed" where applicable |

---

## Sources

- ATO — Individual income tax rates: https://www.ato.gov.au/rates/individual-income-tax-rates/
- ATO — Low Income Tax Offset: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset
- ATO — Medicare Levy Surcharge thresholds: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy-surcharge/medicare-levy-surcharge-income-thresholds-and-rates
- ATO — Medicare levy reduction: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-for-low-income-earners
- ATO — Working from home expenses: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/working-from-home-expenses
- ATO — Fixed rate method: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/working-from-home-expenses/fixed-rate-method
- Department of Health — PHI Circular 21/25: https://www.health.gov.au/news/phi-circulars/phi-2125-private-health-insurance-rebate-adjustment-factor-effective-1-april-2025
- Private Health Insurance Rebate: https://www.privatehealth.gov.au/health_insurance/surcharges_incentives/insurance_rebate.htm
- William Buck — Tax Rates 2025-26: https://williambuck.com/tools/tools-downloads/tax-rates-and-thresholds-2025-26/
- CPA Australia — Budget Report 2025-26: https://www.cpaaustralia.com.au/-/media/project/cpa/corporate/documents/policy-and-advocacy/budget-commentary/cpa-australia-budget-report-2025-26.pdf
- PwC Tax Summaries — Australia Individual: https://taxsummaries.pwc.com/australia/individual/taxes-on-personal-income
- SuperGuide — Income tax brackets: https://www.superguide.com.au/super-booster/income-tax-rates-brackets
- SuperGuide — Super rates and thresholds: https://www.superguide.com.au/super-booster/super-rates-and-thresholds
- H&R Block — Medicare Levy Surcharge: https://www.hrblock.com.au/tax-academy/what-is-medicare-levy-surcharge
- Challenger — Thresholds from 1 July 2025: https://www.challenger.com.au/adviser/knowledge-hub/Articles/Whats-that-threshold-from-1-July-2025
- KPMG — Federal Budget 2025-26: https://kpmg.com/xx/en/our-insights/gms-flash-alert/flash-alert-2025-060.html
- ATO — SAPTO: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/seniors-and-pensioners-tax-offset
- ATO — myTax 2025 Medicare levy reduction: https://www.ato.gov.au/individuals-and-families/your-tax-return/instructions-to-complete-your-tax-return/mytax-instructions/2025/medicare-and-private-health-insurance/medicare-levy-reduction-or-exemption
- MLS Calculator: https://www.mlscalculator.com.au/guides/medicare-levy-surcharge-thresholds
- Health Partners — PHI Rebate Tiers: https://www.healthpartners.com.au/health-insurance/government-rebates

---

## Verification Summary

| Rate/Threshold | Source | Confidence |
|---|---|---|
| Income tax brackets | ATO rates page, CPA Budget Report | **Confirmed** |
| LITO | ATO LITO page, CPA Budget Report | **Confirmed** |
| Medicare levy rate & thresholds | ATO myTax 2025 instructions, William Buck, ITP | **Confirmed** (no change from 2024-25) |
| MLS thresholds (2025-26) | ATO MLS page (dedicated 2025-26 section), privatehealth.gov.au | **Confirmed** |
| PHI rebate rates Period 1 (Jul 25 - Mar 26) | ATO PHI rebate page, privatehealth.gov.au, Health Partners | **Confirmed** |
| PHI rebate rates Period 2 (Apr 26 - Jun 26) | ATO PHI rebate page, privatehealth.gov.au, Health Partners | **Confirmed** |
| WFH fixed rate | ATO fixed rate method page | **Confirmed** (no change) |
| SAPTO | ATO SAPTO page | **Confirmed** (no change from 2024-25) |

---

## Gaps & Caveats

1. **ATO has not published a standalone 2025-26 Medicare levy thresholds page.** The ATO's Medicare levy reduction page (last updated 29 July 2025) does not specify the income year. The myTax 2025 instructions are for the 2024-25 income year. However, the 2025-26 Federal Budget only announced Medicare levy threshold increases from **1 July 2026**, and multiple authoritative accounting firms (William Buck, ITP, CPA Australia) confirm the thresholds remain at $27,222/$34,027 for 2025-26. **Risk: Low.**

2. **2024-25 PHI rebate rates in the app are also potentially stale.** The current app code for 2024-25 uses:
   - Period 1 (Jul-Mar): under65 base = 0.24608 (24.608%)
   - Period 2 (Apr-Jun): under65 base = 0.24288 (24.288%)
   
   The ATO confirms these are correct for 2024-25. **No issue.**

3. **Future 2026-27 rates already visible.** The government has already announced:
   - Tax rate cut: 16% -> 15% from 1 July 2026
   - Medicare levy threshold increases from 1 July 2026
   - MLS/PHI income threshold increases from 1 July 2026 ($105k singles, $210k families)
   
   These should be added to `TAX_CONFIG` when the 2026-27 year is implemented.

4. **SAPTO is not modelled in the app.** The app has a "Medicare Exempt" toggle but does not model SAPTO eligibility or the associated Medicare levy reductions for seniors. This is a feature gap, not a data gap.

---

## Gap Research — Medicare Levy Family Thresholds (CRITICAL BUG)

**Discovery:** The app's Medicare levy family thresholds are incorrect in **both** year configs. They use 2023-24 values instead of the current 2024-25+ values.

### Current (WRONG) values in code

```javascript
// Both 2024-2025 and 2025-2026 configs have:
MEDICARE_LEVY_THRESHOLD_FAMILY: 40939,        // 2023-24 value
MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY: 51174,  // 2023-24 value
MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT: 3760   // 2023-24 value
```

### Correct values (2024-25 and 2025-26)

| Constant | Current (Wrong) | Correct | Source |
|---|---|---|---|
| `MEDICARE_LEVY_THRESHOLD_FAMILY` | 40,939 | **45,907** | ATO myTax 2025, William Buck, CPA Australia |
| `MEDICARE_LEVY_PHASE_IN_UPPER_FAMILY` | 51,174 | **57,383** | ATO myTax 2025, William Buck, CPA Australia |
| `MEDICARE_LEVY_FAMILY_CHILD_ADJUSTMENT` | 3,760 | **4,216** | ATO myTax 2025, William Buck, CPA Australia |

**Legislative basis:** The Treasury Laws Amendment (More Cost of Living Relief) Act 2025 (Royal Assent 27 March 2025) set these thresholds for "2024-25 and later income years." The single thresholds ($27,222 / $34,027) are already correct in the code — only the family values are wrong.

**Impact:** Families with taxable income between $40,939-$45,907 are incorrectly assessed as owing the full 2% Medicare levy when they should receive a reduction. Families with dependent children get a per-child adjustment of $3,760 instead of the correct $4,216, compounding the error.

**Sources:**
- ATO M1 Medicare levy reduction 2025: https://www.ato.gov.au/forms-and-instructions/individual-tax-return-2025-instructions/medicare-levy-questions-m1-m2-individual-tax-return-2025/m1-medicare-levy-reduction-or-exemption-2025
- William Buck Tax Rates 2025-26: https://williambuck.com/tools/tools-downloads/tax-rates-and-thresholds-2025-26/
- CPA Australia Budget Report 2025-26: https://www.cpaaustralia.com.au/-/media/project/cpa/corporate/documents/policy-and-advocacy/budget-commentary/cpa-australia-budget-report-2025-26.pdf
- Parliament of Australia Bill Summary: https://www.aph.gov.au/Parliamentary_Business/Bills_Legislation/Bills_Search_Results/Result?bId=r7331

---

## Gap Research — SAPTO Full Reference

### SAPTO Amounts and Thresholds (2025-26)

Unchanged from 2024-25. Source: ATO SAPTO page (last updated 14 November 2025).

| Status | Maximum Offset | Shading-Out Threshold | Cut-Out Threshold |
|---|---|---|---|
| Single | $2,230 | $34,919 | $52,759 |
| Each partner (living together) | $1,602 | $30,994 | $43,810 |
| Each partner (illness separated) | $2,040 | $33,732 | $50,052 |

- Reduction rate: **12.5c ($0.125) per dollar** of rebate income above shading-out threshold, rounded up
- Couple combined cut-out: $87,620 (2 x $43,810)

### SAPTO + LITO Effective Tax-Free Thresholds

| Situation | Effective Tax-Free Threshold |
|---|---|
| Not eligible for SAPTO or LITO | $18,200 |
| LITO only | $22,575 |
| SAPTO + LITO (single) | $35,813 |
| SAPTO + LITO (partnered, not separated) | $31,888 |
| SAPTO + LITO (illness separated) | $34,625 |

### SAPTO-Specific Medicare Levy Thresholds

| Category | No Levy Below | Full 2% Levy Above |
|---|---|---|
| Regular singles | $27,222 | $34,027 |
| SAPTO-eligible singles | $43,020 | $53,775 |
| Regular families | $45,907 | $57,383 |
| SAPTO-eligible families | $59,886 | $74,857 |
| Per dependent child | $4,216 (lower) | $5,270 (upper) |

Note: The SAPTO Medicare levy thresholds were **indexed up** from 2024-25 (e.g., SAPTO singles went from $41,089 to $43,020). The SAPTO offset amounts and rebate income thresholds themselves did not change.

### Eligibility Criteria

- Must receive (or qualify for) an eligible government payment: Age Pension, Carer Payment, DSP (if age-pension age), DVA pension, etc.
- Self-funded retirees who have reached Age Pension age and would qualify (but are excluded by income/assets test) are also eligible
- Centrelink Age Pension: must be 67+ on 30 June of the income year
- DVA pensions: must be 60+ and meet veteran pension age test
- Must be Australian resident for tax purposes
- Unused SAPTO can transfer between spouses

### App Gap

The app currently has a "Medicare Exempt" toggle but does not:
- Model SAPTO eligibility or the offset calculation
- Apply SAPTO-specific Medicare levy thresholds
- Calculate effective tax-free thresholds for seniors

This is a feature gap that would benefit senior users significantly (effective tax-free threshold nearly doubles from $22,575 to $35,813).

**Sources:**
- ATO SAPTO: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/seniors-and-pensioners-tax-offset
- ATO T1 2025: https://www.ato.gov.au/forms-and-instructions/individual-tax-return-2025-instructions/tax-offset-questions-t1-t2-individual-tax-return-2025/t1-seniors-and-pensioners-tax-offset-2025
- Challenger: https://www.challenger.com.au/adviser/knowledge-hub/Articles/Whats-that-threshold-from-1-July-2025
- TaxWindow: https://taxwindow.com.au/how-thousands-of-seniors-are-paying-zero-tax-using-sapto-and-you-can-too/
- SuperGuide: https://www.superguide.com.au/super-booster/senior-australians-pensioners-tax-offset-sapto

---

## Gap Research — 2026-27 Forward-Looking Rates

The following changes are already legislated or published for the 2026-27 financial year. Include these in `TAX_CONFIG` when adding 2026-27 support.

### Income Tax Brackets (LEGISLATED)

| Taxable Income | 2025-26 | 2026-27 |
|---|---|---|
| $0 - $18,200 | Nil | Nil |
| $18,201 - $45,000 | 16c per $1 ($4,288) | **15c per $1 ($4,050)** |
| $45,001 - $135,000 | 30c per $1 (+$4,288) | 30c per $1 (+$4,050) |
| $135,001 - $190,000 | 37c per $1 (+$31,288) | 37c per $1 (+$31,288) |
| $190,001+ | 45c per $1 (+$51,638) | 45c per $1 (+$51,638) |

Maximum saving: **$268/year** for anyone earning $45,000+.
Further cut to 14% from 1 July 2027 (additional $268 = $536 total).

**Legislation:** Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024 + (More Cost of Living Relief) Act 2025

### MLS Thresholds (PUBLISHED on privatehealth.gov.au)

| Tier | Singles | Families | Rate |
|---|---|---|---|
| Base | $0 - $105,000 | $0 - $210,000 | 0% |
| Tier 1 | $105,001 - $123,000 | $210,001 - $246,000 | 1.0% |
| Tier 2 | $123,001 - $164,000 | $246,001 - $328,000 | 1.25% |
| Tier 3 | $164,001+ | $328,001+ | 1.5% |

Child adjustment: $1,500 per dependent child after the first (unchanged).

### PHI Rebate Rates (PUBLISHED)

Period 1 (1 Jul 2026 - 31 Mar 2027) — Rebate Adjustment Factor: 0.993:

| Age | Base | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|---|
| Under 65 | 24.118% | 16.079% | 8.038% | 0% |
| 65-69 | 28.139% | 20.098% | 12.058% | 0% |
| 70+ | 32.158% | 24.118% | 16.079% | 0% |

Period 2 (1 Apr 2027 - 30 Jun 2027): Exact RAF not yet published.

**IMPORTANT — Age-based rebate removal (announced, not yet law):**
On 22 April 2026, the Health Minister announced removal of the higher age-based rebate tiers (65-69 and 70+). If enacted, all ages would receive the under-65 rates. This would cost affected seniors ~$226-$640/year more in premiums. **Not yet passed parliament.**

### Other Confirmed 2026-27 Items

| Item | Value | Status |
|---|---|---|
| LITO | Unchanged ($700 max) | Confirmed |
| Medicare levy rate | 2% (unchanged) | Confirmed |
| Medicare levy thresholds | ~$28,000 singles (exact CPI-indexed figure TBD) | Will be published closer to 1 July |
| WFH fixed rate | $0.70/hr (no change announced) | Same as 2024-25 |
| $1,000 standard deduction | New from 1 Jul 2026 — claim $1,000 work expenses without receipts | Draft legislation, not yet law |
| Tax rate further cut to 14% | From 1 July 2027 | Legislated |

**Sources:**
- ATO New Tax Cuts: https://www.ato.gov.au/about-ato/new-legislation/in-detail/individuals/personal-income-tax-new-tax-cuts-for-every-australian-taxpayer
- privatehealth.gov.au: https://www.privatehealth.gov.au/health_insurance/surcharges_incentives/insurance_rebate.htm
- PHI Circular 12/26: https://www.health.gov.au/news/phi-circulars/phi-1226-private-health-insurance-rebate-adjustment-factor-effective-1-april-2026
- ABC News (age rebate removal): https://www.abc.net.au/news/2026-04-22/private-health-for-over-65s-to-cost-hundreds-more/106594174
- H&R Block Tax Cuts: https://www.hrblock.com.au/tax-academy/income-tax-cuts-2027-and-2028
- SuperGuide: https://www.superguide.com.au/super-booster/income-tax-rates-brackets

---

## Updated Action Items for the App

| Priority | Item | Current Value | Correct Value | Year(s) Affected |
|---|---|---|---|---|
| **CRITICAL** | Medicare levy family threshold | 40,939 | **45,907** | Both 2024-25 and 2025-26 |
| **CRITICAL** | Medicare levy family upper threshold | 51,174 | **57,383** | Both 2024-25 and 2025-26 |
| **CRITICAL** | Medicare levy family child adjustment | 3,760 | **4,216** | Both 2024-25 and 2025-26 |
| **HIGH** | PHI rebate rates 2025-26 Period 1 | 2024-25 rates | See Section 5 | 2025-26 only |
| **HIGH** | PHI rebate rates 2025-26 Period 2 | 2024-25 rates | See Section 5 | 2025-26 only |
| **MEDIUM** | MLS Tier 1 singles cap | $117,000 | **$118,000** | 2025-26 only |
| **MEDIUM** | MLS Tier 2 singles cap | $155,000 | **$158,000** | 2025-26 only |
| **MEDIUM** | MLS Tier 1 families cap | $234,000 | **$236,000** | 2025-26 only |
| **MEDIUM** | MLS Tier 2 families cap | $310,000 | **$316,000** | 2025-26 only |
| **LOW** | Remove "NOT YET RELEASED" comments | Various | Update to "Confirmed" | 2025-26 |
| **FUTURE** | Add 2026-27 TAX_CONFIG entry | N/A | See "2026-27 Forward-Looking" section above | New year |
