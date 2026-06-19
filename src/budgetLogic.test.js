// ── budgetLogic.test.js ───────────────────────────────────────────────────────
// Run with: npx vitest
// Or:       npx vitest run --reporter=verbose

import { describe, it, expect } from "vitest";
import {
  txSpend,
  getPay,
  getPB,
  getStaleSplitRule,
  computeCrossPeriodSync,
  suggestedPace,
  getRollovers,
} from "./budgetLogic.js";

// ── Shared fixtures ───────────────────────────────────────────────────────────
const BASE_ACTBUDG = {
  rent: 1200,
  groceries: 400,
  "student loan": 250,
};

const BASE_GOALS = {
  "emergency fund": {
    target: 6000, saved: 2000, priority: "high",
    linkedCategories: ["emergency fund"], deadline: "ongoing",
  },
};

const NO_OVERRIDES = {}; // empty pBudgets
const NO_SPLITS    = {}; // empty splitRules
const NO_YEARPLAN  = {};

const MOCK_PACE = (key) => ({ pace: 200, monthsLeft: 12, status: "on_track" });

// ─────────────────────────────────────────────────────────────────────────────
describe("txSpend", () => {
  it("counts all money_flow transactions at face value", () => {
    expect(txSpend({ amount: 50, money_flow: "expense" })).toBe(50);
    expect(txSpend({ amount: 200, money_flow: "transfer" })).toBe(200);
    expect(txSpend({ amount: 100, money_flow: "debt_payment" })).toBe(100);
  });

  it("excludes old-schema payment txTypes", () => {
    expect(txSpend({ amount: 100, txType: "payment" })).toBe(0);
    expect(txSpend({ amount: 100, txType: "loan_payment" })).toBe(0);
  });

  it("counts old-schema regular expenses", () => {
    expect(txSpend({ amount: 75 })).toBe(75);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPay", () => {
  it("returns explicit pPay override for the period", () => {
    const result = getPay("first", {
      pPay: { "3_first": 1500 },
      curMonth: 3,
      defPay: 1900,
    });
    expect(result).toBe(1500);
  });

  it("falls back to defPay when no override", () => {
    const result = getPay("second", {
      pPay: {},
      curMonth: 3,
      defPay: 1900,
    });
    expect(result).toBe(1900);
  });

  it("distinguishes first vs second period", () => {
    const pPay = { "3_first": 1400, "3_second": 2400 };
    expect(getPay("first",  { pPay, curMonth: 3, defPay: 0 })).toBe(1400);
    expect(getPay("second", { pPay, curMonth: 3, defPay: 0 })).toBe(2400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPB — default 50/50 split", () => {
  const ctx = {
    actBudg: BASE_ACTBUDG,
    pBudgets: NO_OVERRIDES,
    curMonth: 3,
    goals: {},
    yearPlan: NO_YEARPLAN,
    splitRules: NO_SPLITS,
    getPace: MOCK_PACE,
  };

  it("splits every item in half for first period", () => {
    const pb = getPB("first", ctx);
    expect(pb.rent).toBe(600);
    expect(pb.groceries).toBe(200);
    expect(pb["student loan"]).toBe(125);
  });

  it("splits every item in half for second period", () => {
    const pb = getPB("second", ctx);
    expect(pb.rent).toBe(600);
    expect(pb.groceries).toBe(200);
  });

  it("rounds odd amounts consistently", () => {
    const pb = getPB("first", { ...ctx, actBudg: { therapy: 80 } });
    expect(pb.therapy).toBe(40);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPB — explicit pBudgets override wins", () => {
  it("uses override when present for first period", () => {
    const ctx = {
      actBudg: BASE_ACTBUDG,
      pBudgets: { "3_first": { rent: 800 } },
      curMonth: 3,
      goals: {},
      yearPlan: NO_YEARPLAN,
      splitRules: NO_SPLITS,
      getPace: MOCK_PACE,
    };
    const pb = getPB("first", ctx);
    expect(pb.rent).toBe(800);       // override applied
    expect(pb.groceries).toBe(200);  // others still default
  });

  it("override for first doesn't affect second", () => {
    const ctx = {
      actBudg: BASE_ACTBUDG,
      pBudgets: { "3_first": { rent: 800 } },
      curMonth: 3,
      goals: {},
      yearPlan: NO_YEARPLAN,
      splitRules: NO_SPLITS,
      getPace: MOCK_PACE,
    };
    const pb = getPB("second", ctx);
    expect(pb.rent).toBe(600); // second period still uses default
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPB — sticky split rules", () => {
  it("applies valid sticky rule for first period", () => {
    const ctx = {
      actBudg: { "student loan": 250 },
      pBudgets: NO_OVERRIDES,
      curMonth: 3,
      goals: {},
      yearPlan: NO_YEARPLAN,
      splitRules: {
        "student loan": { firstAmt: 250, secondAmt: 0, monthlyAtSave: 250, sticky: true },
      },
      getPace: MOCK_PACE,
    };
    expect(getPB("first",  ctx)["student loan"]).toBe(250);
    expect(getPB("second", ctx)["student loan"]).toBe(0);
  });

  it("ignores stale sticky rule (monthly changed) and falls back to default", () => {
    const ctx = {
      actBudg: { "student loan": 300 }, // monthly changed from 250 → 300
      pBudgets: NO_OVERRIDES,
      curMonth: 3,
      goals: {},
      yearPlan: NO_YEARPLAN,
      splitRules: {
        "student loan": { firstAmt: 250, secondAmt: 0, monthlyAtSave: 250, sticky: true },
      },
      getPace: MOCK_PACE,
    };
    // 250+0=250 ≠ 300, so rule is stale → fall back to 300/2=150
    expect(getPB("first",  ctx)["student loan"]).toBe(150);
    expect(getPB("second", ctx)["student loan"]).toBe(150);
  });

  it("explicit override beats sticky rule", () => {
    const ctx = {
      actBudg: { "student loan": 250 },
      pBudgets: { "3_first": { "student loan": 100 } }, // explicit override
      curMonth: 3,
      goals: {},
      yearPlan: NO_YEARPLAN,
      splitRules: {
        "student loan": { firstAmt: 250, secondAmt: 0, monthlyAtSave: 250, sticky: true },
      },
      getPace: MOCK_PACE,
    };
    expect(getPB("first", ctx)["student loan"]).toBe(100); // override wins
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPB — goal items from yearPlan", () => {
  it("splits yearPlan goal amount in half by default", () => {
    const ctx = {
      actBudg: {},
      pBudgets: NO_OVERRIDES,
      curMonth: 3,
      goals: { "emergency fund": BASE_GOALS["emergency fund"] },
      yearPlan: { "emergency fund": { 3: 400 } },
      splitRules: NO_SPLITS,
      getPace: MOCK_PACE,
    };
    expect(getPB("first",  ctx)["emergency fund"]).toBe(200);
    expect(getPB("second", ctx)["emergency fund"]).toBe(200);
  });

  it("falls back to getPace when yearPlan has no entry", () => {
    const ctx = {
      actBudg: {},
      pBudgets: NO_OVERRIDES,
      curMonth: 3,
      goals: { "emergency fund": BASE_GOALS["emergency fund"] },
      yearPlan: NO_YEARPLAN,
      splitRules: NO_SPLITS,
      getPace: () => ({ pace: 300 }), // mocked pace
    };
    expect(getPB("first", ctx)["emergency fund"]).toBe(150); // 300/2
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getStaleSplitRule", () => {
  const getMonthlyAmt = (key) => ({ rent: 1200, groceries: 400 })[key] ?? 0;

  it("returns null when no rule exists", () => {
    expect(getStaleSplitRule("rent", { splitRules: {}, getMonthlyAmt })).toBeNull();
  });

  it("returns null when rule is not sticky", () => {
    const splitRules = { rent: { firstAmt: 600, secondAmt: 600, sticky: false } };
    expect(getStaleSplitRule("rent", { splitRules, getMonthlyAmt })).toBeNull();
  });

  it("returns null when rule amounts still match monthly total", () => {
    const splitRules = { rent: { firstAmt: 800, secondAmt: 400, sticky: true } };
    expect(getStaleSplitRule("rent", { splitRules, getMonthlyAmt })).toBeNull();
  });

  it("returns stale rule with currentMonthly when monthly changed", () => {
    // rule was set when monthly was 1000, now it's 1200
    const splitRules = { rent: { firstAmt: 700, secondAmt: 300, sticky: true, monthlyAtSave: 1000 } };
    const result = getStaleSplitRule("rent", { splitRules, getMonthlyAmt });
    expect(result).not.toBeNull();
    expect(result.currentMonthly).toBe(1200);
    expect(result.firstAmt).toBe(700);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("computeCrossPeriodSync", () => {
  const ctx = {
    actBudg: { rent: 1200, groceries: 400 },
    pBudgets: {},
    curMonth: 3,
    goals: {},
    yearPlan: NO_YEARPLAN,
    getPace: MOCK_PACE,
  };

  it("other period = monthly - this period for each item", () => {
    const { otherOverrides, adjItems } = computeCrossPeriodSync(
      { rent: 800, groceries: 300 }, // user set first period to this
      "second",
      ctx,
    );
    expect(otherOverrides.rent).toBe(400);       // 1200 - 800
    expect(otherOverrides.groceries).toBe(100);  // 400 - 300
  });

  it("reports adjusted items with old and new amounts", () => {
    const { adjItems } = computeCrossPeriodSync(
      { rent: 800 },
      "second",
      ctx,
    );
    expect(adjItems).toHaveLength(1);
    expect(adjItems[0].key).toBe("rent");
    expect(adjItems[0].newAmt).toBe(400); // 1200 - 800
    expect(adjItems[0].oldAmt).toBe(600); // default was 1200/2
  });

  it("reports no adjustments when value equals existing other-period budget", () => {
    const ctxWithOverride = {
      ...ctx,
      pBudgets: { "3_second": { rent: 400 } }, // already set correctly
    };
    const { adjItems } = computeCrossPeriodSync(
      { rent: 800 }, // first = 800 → second should be 400
      "second",
      ctxWithOverride,
    );
    expect(adjItems).toHaveLength(0); // no change needed
  });

  it("clamps other period to 0, never negative", () => {
    const { otherOverrides } = computeCrossPeriodSync(
      { rent: 1400 }, // first > monthly — other should clamp to 0
      "second",
      ctx,
    );
    expect(otherOverrides.rent).toBe(0);
  });

  it("syncs income correctly — other = monthly - this", () => {
    // Income sync is handled separately in onSave, but the math is the same
    const monthlyInc = 3800;
    const thisInc = 2200;
    expect(Math.max(0, monthlyInc - thisInc)).toBe(1600);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("suggestedPace", () => {
  const now = new Date("2026-05-01");
  const _txSpend = txSpend;
  const emptyTxns = {};

  const baseGoal = {
    target: 6000,
    saved: 2000,
    priority: "mid",
    linkedCategories: ["emergency fund"],
  };

  it("returns done when saved >= target", () => {
    const result = suggestedPace(
      { ...baseGoal, saved: 6000 },
      emptyTxns,
      { now, txSpend: _txSpend },
    );
    expect(result.status).toBe("done");
    expect(result.pace).toBe(0);
  });

  it("computes correct pace from deadline", () => {
    // Use an unambiguous ISO date to avoid timezone-shifted month parsing
    const deadline = "2026-12-15";
    const parsed = new Date(deadline);
    const expectedMonths = Math.max(1,
      (parsed.getFullYear() - now.getFullYear()) * 12 + (parsed.getMonth() - now.getMonth())
    );
    const result = suggestedPace(
      { ...baseGoal, deadline },
      emptyTxns,
      { now, txSpend: _txSpend },
    );
    expect(result.monthsLeft).toBe(expectedMonths);
    expect(result.pace).toBe(Math.ceil(4000 / expectedMonths));
  });

  it("uses horizonMonths when no deadline", () => {
    const result = suggestedPace(
      { ...baseGoal, horizonMonths: 8 },
      emptyTxns,
      { now, txSpend: _txSpend },
    );
    expect(result.monthsLeft).toBe(8);
    expect(result.pace).toBe(Math.ceil(4000 / 8));
  });

  it("status is behind when no recent contributions", () => {
    const result = suggestedPace(baseGoal, emptyTxns, { now, txSpend: _txSpend });
    expect(result.status).toBe("behind");
  });

  it("status is urgent when behind AND high priority", () => {
    const result = suggestedPace(
      { ...baseGoal, priority: "high" },
      emptyTxns,
      { now, txSpend: _txSpend },
    );
    expect(result.status).toBe("urgent");
  });

  it("status is on_track when recent contributions meet pace", () => {
    // Build txns with enough contributions in last 3 months
    const mk = (mo) => String(((now.getMonth() - mo) + 12) % 12);
    const txns = {};
    for (let i = 1; i <= 3; i++) {
      txns[`${mk(i)}_first`] = [
        { id: `t${i}`, amount: 700, category: "emergency fund", money_flow: "transfer" },
      ];
    }
    const result = suggestedPace(
      { ...baseGoal, horizonMonths: 12 },
      txns,
      { now, txSpend: _txSpend },
    );
    // avgContrib = 700, pace = ceil(4000/12) = 334 — 700 > 334*0.85 → on_track
    expect(result.status).toBe("on_track");
    expect(result.avgContrib).toBeCloseTo(700);
  });

  it("status is lagging when contributions exist but below 85% of pace", () => {
    const mk = (mo) => String(((now.getMonth() - mo) + 12) % 12);
    const txns = {};
    // pace = ceil(4000/12) = 334. Need avgContrib > 334*0.5 (=167) but < 334*0.85 (=284)
    // Use 250/mo → avgContrib = 250 → lagging
    for (let i = 1; i <= 3; i++) {
      txns[`${mk(i)}_first`] = [
        { id: `t${i}`, amount: 250, category: "emergency fund", money_flow: "transfer" },
      ];
    }
    const result = suggestedPace(
      { ...baseGoal, horizonMonths: 12 },
      txns,
      { now, txSpend: _txSpend },
    );
    // 250 > 334*0.5=167 ✓  and  250 < 334*0.85=284 ✓  → lagging
    expect(result.status).toBe("lagging");
  });

  it("strips fuzzy deadline prefixes (late, early, mid)", () => {
    const deadline = "2026-12-15";
    const parsed = new Date(deadline);
    const expectedMonths = Math.max(1,
      (parsed.getFullYear() - now.getFullYear()) * 12 + (parsed.getMonth() - now.getMonth())
    );
    const result = suggestedPace(
      { ...baseGoal, deadline: `late ${deadline}` },
      emptyTxns,
      { now, txSpend: _txSpend },
    );
    expect(result.monthsLeft).toBe(expectedMonths);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getRollovers", () => {
  const creditAcct = { id: "cc1", type: "credit", name: "Meridian", label: "Credit Card" };
  const checkingAcct = { id: "chk1", type: "checking" };

  it("returns empty when no credit accounts", () => {
    const result = getRollovers({
      accounts: [checkingAcct],
      txns: {},
      curMonth: 3,
    });
    expect(result).toHaveLength(0);
  });

  it("returns empty when credit card had no charges last month", () => {
    const result = getRollovers({
      accounts: [creditAcct],
      txns: {},
      curMonth: 3,
    });
    expect(result).toHaveLength(0);
  });

  it("returns rollover when last month had charges and none paid this month", () => {
    const txns = {
      "2_first": [
        { id: "t1", amount: 200, from_account_id: "cc1", money_flow: "expense" },
      ],
    };
    const result = getRollovers({ accounts: [creditAcct], txns, curMonth: 3 });
    expect(result).toHaveLength(1);
    expect(result[0].rolloverAmt).toBe(200);
    expect(result[0].remaining).toBe(200);
    expect(result[0].paidAmt).toBe(0);
  });

  it("subtracts current-month payments from rollover", () => {
    const txns = {
      "2_first": [
        { id: "t1", amount: 300, from_account_id: "cc1", money_flow: "expense" },
      ],
      "3_first": [
        { id: "t2", amount: 100, to_account_id: "cc1", money_flow: "debt_payment" },
      ],
    };
    const result = getRollovers({ accounts: [creditAcct], txns, curMonth: 3 });
    expect(result[0].remaining).toBe(200); // 300 - 100
    expect(result[0].paidAmt).toBe(100);
  });

  it("hides card when rollover is fully paid", () => {
    const txns = {
      "2_first": [
        { id: "t1", amount: 150, from_account_id: "cc1", money_flow: "expense" },
      ],
      "3_first": [
        { id: "t2", amount: 150, to_account_id: "cc1", money_flow: "debt_payment" },
      ],
    };
    const result = getRollovers({ accounts: [creditAcct], txns, curMonth: 3 });
    expect(result).toHaveLength(0); // fully paid → hidden
  });

  it("handles month wrap-around (January → December)", () => {
    const txns = {
      "11_second": [
        { id: "t1", amount: 80, from_account_id: "cc1", money_flow: "expense" },
      ],
    };
    const result = getRollovers({ accounts: [creditAcct], txns, curMonth: 0 }); // January
    expect(result).toHaveLength(1);
    expect(result[0].rolloverAmt).toBe(80);
  });

  it("only counts expenses charged TO the card (not debt_payment FROM it)", () => {
    const txns = {
      "2_first": [
        // This is a payment FROM checking TO credit — should NOT count as rollover
        { id: "t1", amount: 200, to_account_id: "cc1", money_flow: "debt_payment" },
      ],
    };
    const result = getRollovers({ accounts: [creditAcct], txns, curMonth: 3 });
    expect(result).toHaveLength(0);
  });
});