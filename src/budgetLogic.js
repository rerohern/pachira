// ── budgetLogic.js ────────────────────────────────────────────────────────────
// Pure functions extracted from App.jsx for testability.
// None of these close over React state — everything they need is passed explicitly.
// App.jsx wraps each one in a thin closure that supplies the current state.

// ── txSpend ───────────────────────────────────────────────────────────────────
// How much does a transaction contribute to spending?
// Deposits (_isDeposit) are excluded by callers, not here.
export function txSpend(t) {
  if (t.money_flow) return t.amount;           // new schema: all flows count
  if (t.txType === "payment" || t.txType === "loan_payment") return 0; // old schema
  return t.amount;
}

// ── getPay ────────────────────────────────────────────────────────────────────
// Period income — explicit pPay override, or half of monthly income.
export function getPay(period, { pPay, curMonth, defPay }) {
  return pPay[`${curMonth}_${period}`] ?? defPay;
}

// ── getMonthlyAmt ─────────────────────────────────────────────────────────────
// Source-of-truth monthly budget for one line item.
// Goals come from yearPlan (or pace engine). Everything else from actBudg.
export function getMonthlyAmt(itemKey, { goals, yearPlan, actBudg, getPace }) {
  if (goals[itemKey]) {
    return yearPlan[itemKey]?.[curMonth] ?? getPace(itemKey).pace ?? 0;
  }
  return actBudg[itemKey] ?? 0;
}

// ── getMonthlyAmtForMonth ─────────────────────────────────────────────────────
// Same as getMonthlyAmt but takes curMonth explicitly (no closure).
export function getMonthlyAmtForMonth(itemKey, curMonth, { goals, yearPlan, actBudg, getPace }) {
  if (goals[itemKey]) {
    return yearPlan[itemKey]?.[curMonth] ?? getPace(itemKey)?.pace ?? 0;
  }
  return actBudg[itemKey] ?? 0;
}

// ── getStaleSplitRule ─────────────────────────────────────────────────────────
// Returns the split rule for an item if it exists but is now stale
// (i.e. the monthly total changed since the rule was saved).
// Returns null if rule is valid or doesn't exist.
export function getStaleSplitRule(itemKey, { splitRules, getMonthlyAmt }) {
  const rule = splitRules[itemKey];
  if (!rule || !rule.sticky) return null;
  const monthly = getMonthlyAmt(itemKey);
  if (Math.abs((rule.firstAmt + rule.secondAmt) - monthly) < 0.01) return null;
  return { ...rule, currentMonthly: monthly };
}

// ── getPB ─────────────────────────────────────────────────────────────────────
// Period budget map — the single source of truth for what's budgeted per item
// in a given half-month period.
//
// Priority order (highest wins):
//   1. Explicit pBudgets override for this month+period
//   2. Valid (non-stale) sticky split rule
//   3. Default: monthly amount ÷ 2
export function getPB(period, {
  actBudg, pBudgets, curMonth, goals, yearPlan, splitRules, getPace,
}) {
  const result = {};

  function monthlyFor(key) {
    if (goals[key]) return yearPlan[key]?.[curMonth] ?? getPace(key)?.pace ?? 0;
    return actBudg[key] ?? 0;
  }

  function splitRuleFor(key) {
    const rule = splitRules[key];
    if (!rule?.sticky) return null;
    const monthly = monthlyFor(key);
    const valid = Math.abs((rule.firstAmt + rule.secondAmt) - monthly) < 0.01;
    return valid ? rule : null; // stale rules fall back to default
  }

  // Non-goal items
  for (const [k, v] of Object.entries(actBudg)) {
    const monthly = v;
    const override = pBudgets[`${curMonth}_${period}`]?.[k];
    const rule = splitRuleFor(k);
    if (override != null) {
      result[k] = override;
    } else if (rule) {
      result[k] = period === "first" ? rule.firstAmt : rule.secondAmt;
    } else {
      result[k] = Math.round(monthly / 2);
    }
  }

  // Goal items
  for (const gk of Object.keys(goals)) {
    const monthly = yearPlan[gk]?.[curMonth] ?? getPace(gk)?.pace ?? 0;
    const override = pBudgets[`${curMonth}_${period}`]?.[gk];
    const rule = splitRuleFor(gk);
    if (override != null) {
      result[gk] = override;
    } else if (rule) {
      result[gk] = period === "first" ? rule.firstAmt : rule.secondAmt;
    } else {
      result[gk] = Math.round(monthly / 2);
    }
  }

  return result;
}

// ── computeCrossPeriodSync ────────────────────────────────────────────────────
// When a period budget is saved, compute what the other period's items should
// become so they always sum to the monthly total.
//
// Returns { otherOverrides, adjItems } where:
//   otherOverrides — the new pBudgets map for the other period
//   adjItems       — [{key, oldAmt, newAmt}] list of items that changed
export function computeCrossPeriodSync(
  thisPeriodParsed,   // {itemKey: newAmount} — what the user just saved
  otherPeriod,        // "first" | "second"
  { actBudg, pBudgets, curMonth, goals, yearPlan, getPace },
) {
  const adjItems = [];
  const otherOverrides = { ...(pBudgets[`${curMonth}_${otherPeriod}`] || {}) };

  for (const [k, v] of Object.entries(thisPeriodParsed)) {
    // Monthly source of truth
    // yearPlan stores monthly amounts already, so no *2 needed
    // actBudg also stores monthly amounts
    const monthly = goals[k]
      ? (yearPlan[k]?.[curMonth] ?? (getPace(k)?.pace ?? 0))
      : (actBudg[k] ?? 0);

    const newOther = Math.max(0, monthly - v);
    const oldOther = otherOverrides[k] ?? Math.round(monthly / 2);

    if (Math.abs(newOther - oldOther) > 0.01) {
      adjItems.push({ key: k, oldAmt: oldOther, newAmt: newOther });
    }
    otherOverrides[k] = newOther;
  }

  return { otherOverrides, adjItems };
}

// ── suggestedPace ─────────────────────────────────────────────────────────────
// Pace engine — given a goal and a txns snapshot, compute how much needs to be
// saved per month and whether the user is on track.
//
// `now` is passed explicitly so tests can freeze time.
export function suggestedPace(goal, txnsSnapshot, { now, txSpend: _txSpend }) {
  const saved     = goal.saved || 0;
  const target    = goal.target || 1;
  const remaining = Math.max(0, target - saved);
  if (remaining === 0) return { pace: 0, monthsLeft: 0, status: "done" };

  let monthsLeft = goal.horizonMonths || 12;
  if (goal.deadline && goal.deadline !== "ongoing") {
    const clean  = goal.deadline.replace(/^(late|early|mid)\s+/i, "");
    const parsed = new Date(clean);
    if (!isNaN(parsed)) {
      const diff =
        (parsed.getFullYear() - now.getFullYear()) * 12 +
        (parsed.getMonth() - now.getMonth()) + 1; // +1 to include the deadline month
      monthsLeft = Math.max(1, diff);
    }
  }

  const pace = Math.ceil(remaining / monthsLeft);

  // Average contribution over last 3 months
  const recentMonths = 3;
  let totalContrib = 0;
  for (let i = 1; i <= recentMonths; i++) {
    const mi   = ((now.getMonth() - i) + 12) % 12;
    const mk   = String(mi);
    const mTxs = [
      ...(txnsSnapshot[`${mk}_first`]  || []),
      ...(txnsSnapshot[`${mk}_second`] || []),
    ];
    const linked = goal.linkedCategories || [];
    totalContrib += mTxs
      .filter(t => linked.includes(t.category))
      .reduce((s, t) => s + _txSpend(t), 0);
  }
  const avgContrib = totalContrib / recentMonths;

  let status = "on_track";
  if      (avgContrib === 0 && pace > 0)  status = goal.priority === "high" ? "urgent" : "behind";
  else if (avgContrib < pace * 0.50)      status = goal.priority === "high" ? "urgent" : "behind";
  else if (avgContrib < pace * 0.85)      status = "lagging";

  return { pace, monthsLeft, status, avgContrib };
}

// ── getRollovers ──────────────────────────────────────────────────────────────
// Per credit card, how much rolled over from last month minus what's been paid
// this month. Returns only cards with a remaining balance > 0.
export function getRollovers({ accounts, txns, curMonth }) {
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const pm  = String(prevMonth);
  const mk  = String(curMonth);
  const prevTxs = [...(txns[`${pm}_first`] || []), ...(txns[`${pm}_second`] || [])];
  const currTxs = [...(txns[`${mk}_first`] || []), ...(txns[`${mk}_second`] || [])];

  return accounts
    .filter(a => a.type === "credit")
    .map(acct => {
      const rolloverAmt = prevTxs
        .filter(t => {
          const fromId = t.from_account_id || t.account;
          const flow   = t.money_flow || (t.txType === "payment" ? "debt_payment" : "expense");
          return fromId === acct.id && flow === "expense";
        })
        .reduce((s, t) => s + t.amount, 0);

      if (rolloverAmt === 0) return null;

      const paidAmt = currTxs
        .filter(t => {
          const flow = t.money_flow || (t.txType === "payment" ? "debt_payment" : "expense");
          return t.to_account_id === acct.id && flow === "debt_payment";
        })
        .reduce((s, t) => s + t.amount, 0);

      const remaining = Math.max(0, rolloverAmt - paidAmt);
      return remaining > 0 ? { account: acct, rolloverAmt, paidAmt, remaining } : null;
    })
    .filter(Boolean);
}