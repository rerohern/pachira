import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import * as BL from "./budgetLogic.js";

// ── Pachira CSS (module-level so it can be injected before React mounts) ──────
const PACHIRA_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    .tracker-grid > *{min-width:0;overflow:hidden;}
    html,body,#root{width:100%;max-width:100%;margin:0;padding:0;text-align:left;border:none;}
    html,body{background:#ede4d8;overflow-x:hidden;max-width:100vw;}
    body::before{display:none;}
    body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:1;
      opacity:0.05;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' seed='8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:300px 300px;mix-blend-mode:multiply;}
    #root{display:flex;flex-direction:column;min-height:100vh;}
    input,select,textarea{font-size:16px !important;}
    ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#c8a882;border-radius:3px;}

    /* ── Desktop layout ── */
    .app-shell{display:flex;min-height:100vh;width:100%;overflow-x:hidden;}
    .sidebar{width:220px;min-width:220px;background:rgba(36,27,16,0.94);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;border-right:0.5px solid rgba(255,235,180,0.07);}
    .sidebar-logo{padding:22px 18px 14px;border-bottom:1px solid #3d2f22;}
    .sidebar-logo h1{font-family:'DM Serif Display',serif;font-size:1.3rem;color:#faf6f0;letter-spacing:-0.02em;}
    .sidebar-logo h1 span{color:#c8a882;font-style:italic;}
    .sidebar-nav{flex:1;padding:10px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto;}
    .sn{font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:500;padding:9px 12px;border-radius:8px;border:none;cursor:pointer;color:#c8b89a;background:transparent;text-align:left;width:100%;transition:all 0.15s;letter-spacing:0.01em;}
    .sn:hover{background:#3d2f22;color:#faf6f0;}
    .sn.on{background:#6b7c3f;color:#faf6f0;}
    .sidebar-actions{padding:12px 10px;border-top:1px solid #3d2f22;display:flex;flex-direction:column;gap:6px;}
    .sidebar-reset{font-family:'DM Sans',sans-serif;font-size:0.62rem;color:#6a5040;background:none;border:none;cursor:pointer;opacity:0.6;padding:4px 12px;text-align:left;}
    .content-wrap{margin-left:220px;width:calc(100% - 220px);display:flex;flex-direction:column;min-height:100vh;background:transparent;}
    /* Top action bar — page title left, CTAs right */
    .mbar{background:rgba(237,228,216,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:10px 28px;display:flex;align-items:center;gap:8px;border-bottom:0.5px solid rgba(200,175,140,0.35);position:sticky;top:0;z-index:90;}
    .ptab{font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:500;padding:7px 16px;border:none;cursor:pointer;background:transparent;color:#7a6048;border-radius:8px;transition:all 0.15s;}
    .ptab.on{background:#6b7c3f;color:#faf6f0;}
    .main{padding:28px 28px;flex:1;width:100%;box-sizing:border-box;overflow-x:hidden;}
    .desktop-shell{display:flex;flex:1;min-height:0;}
    .main-content{flex:1;min-width:0;overflow-x:hidden;padding:28px 28px;box-sizing:border-box;background:transparent;}
    .right-panel{width:240px;min-width:240px;flex-shrink:0;border-left:0.5px solid rgba(200,175,140,0.3);background:rgba(245,238,226,0.88);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;}
    .rp-section{padding:14px 16px;border-bottom:1px solid #e8ddd0;}
    .rp-label{font-family:'DM Sans',sans-serif;font-size:0.58rem;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#c8a882;margin-bottom:8px;}
    .g3{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;}
    .tracker-grid{display:grid;grid-template-columns:45fr 55fr;gap:28px;align-items:start;min-width:0;}
    .mood-card-inner{display:flex;align-items:center;padding:18px 22px;gap:8px;flex-wrap:wrap;}
    .mood-breakdown{flex:1;padding-left:16px;display:flex;flex-direction:column;gap:10px;}
    .cv{font-family:'DM Serif Display',serif;font-size:2rem;letter-spacing:-0.02em;line-height:1;}
    .cv.g{color:#3d6b4f;} .cv.r{color:#b85050;}
    .cs{font-family:'DM Sans',sans-serif;font-size:0.72rem;color:#a8906e;margin-top:3px;}
    .brow{display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid #f5ede4;overflow:hidden;max-width:100%;}
    .brow:last-child{border-bottom:none;}
    .bn{font-family:'DM Sans',sans-serif;font-size:0.81rem;color:#4a3828;flex:1;text-transform:capitalize;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
    .bbar{width:48px;min-width:32px;height:5px;background:#f0e8dc;border-radius:3px;overflow:hidden;flex-shrink:1;}
    .bamt{font-family:'DM Sans',sans-serif;font-size:0.68rem;color:#7a6048;text-align:right;min-width:0;flex-shrink:0;white-space:nowrap;}
    .bamt.ov{color:#b85050;font-weight:500;}
    .qadd{width:100%;padding:10px 18px;border-radius:10px;border:1.5px solid #e0d0be;background:rgba(252,247,238,0.9);color:#4a3020;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:500;transition:all 0.15s;}
    .qadd:hover{background:#f5ede4;border-color:#c8a882;}
    .acard{background:rgba(252,247,238,0.96);border-radius:16px;border:1px solid rgba(210,190,160,0.5);overflow:hidden;transition:box-shadow 0.2s;margin-bottom:12px;box-shadow:0 2px 16px rgba(60,35,10,0.08), 0 1px 0 rgba(255,255,248,0.9) inset;}
    .acard:hover{box-shadow:0 3px 14px rgba(44,33,22,0.09);}
    .acardh{padding:16px 18px;display:flex;align-items:center;gap:13px;cursor:pointer;user-select:none;}
    .chev{font-size:0.75rem;color:#c8a882;transition:transform 0.2s;}
    .chev.op{transform:rotate(180deg);}
    .acardb{padding:0 18px 18px;border-top:0.5px solid rgba(200,175,140,0.3);}
    .asec{margin-top:14px;}
    .asl{font-family:'DM Sans',sans-serif;font-size:0.67rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#a8906e;margin-bottom:8px;}
    .ar{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:0.5px solid rgba(200,175,140,0.25);}
    .ar:last-child{border-bottom:none;}
    .an{font-family:'DM Sans',sans-serif;font-size:0.8rem;color:#4a3828;flex:1;text-transform:capitalize;}
    .aa{font-family:'DM Sans',sans-serif;font-size:0.8rem;color:#7a6048;}
    .gcard{background:rgba(252,247,238,0.96);border-radius:14px;padding:16px 18px;margin-bottom:12px;border:1px solid rgba(210,190,160,0.5);transition:box-shadow 0.15s;box-shadow:0 2px 16px rgba(60,35,10,0.08), 0 1px 0 rgba(255,255,248,0.9) inset;}
    .gcard:hover{box-shadow:0 2px 10px rgba(44,33,22,0.08);}
    .note{font-family:'DM Sans',sans-serif;font-size:0.74rem;color:#c8a882;font-style:italic;text-align:center;padding:10px;}
    .div{height:1px;background:#e8ddd0;margin:16px 0;}
    .li-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5ede4;}
    .li-row:last-of-type{border-bottom:none;}
    .hdr{display:none;}
    .nav-top{display:none;}
    .nav-bottom{display:none;}

    @media(max-width:768px){
      .sidebar{display:none;}
      .content-wrap{margin-left:0 !important;width:100% !important;background:transparent;}
      .right-panel{display:none;}
      .main-content{padding:14px 14px;padding-bottom:calc(90px + env(safe-area-inset-bottom,0px));}
      .main{padding:14px 14px;padding-bottom:calc(90px + env(safe-area-inset-bottom,0px));overflow-x:hidden;}
      .mbar{padding:8px 14px;top:41px;box-shadow:none;background:rgba(237,228,216,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}
      .hdr{display:flex;background:rgba(36,27,16,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#faf6f0;padding:8px 18px;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:0.5px solid rgba(255,235,180,0.06);}
      .hdr h1{font-family:'DM Serif Display',serif;font-size:1.1rem;letter-spacing:-0.02em;font-weight:400;}
      .hdr h1 span{color:#c8a882;font-style:italic;}
      /* Option C — floating island nav */
      .nav-bottom{display:block;position:fixed;bottom:0;left:0;right:0;z-index:100;padding:0 16px calc(14px + env(safe-area-inset-bottom,0px));background:transparent;pointer-events:none;}
      .nav-island{display:flex;align-items:center;background:rgba(30,22,12,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:22px;padding:6px 6px;pointer-events:auto;box-shadow:0 8px 40px rgba(20,14,6,0.45),0 1px 0 rgba(255,245,220,0.05) inset;border:0.5px solid rgba(255,235,200,0.06);}
      .nb{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;border:none;cursor:pointer;background:transparent;padding:7px 4px;border-radius:14px;transition:background 0.15s;font-family:'DM Sans',sans-serif;}
      .nb.on{background:#3d2f22;}
      .nb .ni{font-size:0.65rem;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:#6a5040;transition:color 0.15s;}
      .nb.on .ni{color:#8faa8b;}
      .fab-wrap{position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0;width:52px;}
      .fab{width:42px;height:42px;border-radius:50%;background:#8faa8b;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.2s,background 0.2s;position:relative;z-index:2;}
      .fab:active{transform:scale(0.92);}
      .fab-open{background:#6b7c3f;}
      .fab-menu{position:absolute;bottom:52px;left:50%;transform:translateX(-50%) translateY(8px) scale(0.9);display:flex;flex-direction:column;gap:8px;align-items:center;transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;opacity:0;}
      .fab-menu.vis{pointer-events:auto;opacity:1;transform:translateX(-50%) translateY(0) scale(1);}
      .fab-pill{white-space:nowrap;padding:10px 22px;border-radius:22px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:500;box-shadow:0 4px 16px rgba(44,33,22,0.22);width:160px;text-align:center;}
      .fab-backdrop{position:fixed;inset:0;z-index:99;background:rgba(44,33,22,0.25);}
      .g3{grid-template-columns:1fr 1fr;}
      .tracker-grid{grid-template-columns:1fr;min-width:0;width:100%;}
      .mood-breakdown{padding-left:8px;}
      .landing-banner{padding:20px 18px !important;border-radius:14px !important;}
      .landing-banner .banner-hero{font-size:2rem !important;}
    .landing-banner{box-shadow:0 8px 40px rgba(44,33,22,0.2),0 1px 0 rgba(255,240,200,0.04) inset !important;}
    .card-grain,.acard,.gcard,.hero-grain{position:relative;}
    .card-grain::after,.acard::after,.gcard::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
      opacity:0.025;mix-blend-mode:overlay;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.85' numOctaves='4' seed='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:200px 200px;}
    .hero-grain::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
      opacity:0.18;mix-blend-mode:soft-light;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' seed='9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:200px 200px;}
      .landing-banner .banner-stats{gap:16px !important;}
    }
`;


// ── Storage ──────────────────────────────────────────────────────────────────
const SK = "pachira_v1";
async function loadData() {
  try {
    if (window.storage) {
      const r = await window.storage.get("mlm_v2");
      return r ? JSON.parse(r.value) : null;
    } else {
      const raw = localStorage.getItem("mlm_v2");
      return raw ? JSON.parse(raw) : null;
    }
  } catch { return null; }
}

async function saveData(data) {
  try {
    if (window.storage) {
      await window.storage.set("mlm_v2", JSON.stringify(data));
    } else {
      localStorage.setItem("mlm_v2", JSON.stringify(data));
    }
  } catch {}
}

// ── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const FEELINGS = [
  { v:"happy",     label:"✨ happy",           color:"#8faa8b" },
  { v:"necessary", label:"🫡 necessary",       color:"#8a5c2a" },
  { v:"guilty",    label:"🫣 guilty pleasure", color:"#c8906e" },
  { v:"regretted", label:"😬 regretted",       color:"#b85050" },
];
const PRIORITY_COLOR = { high:"#c88b8b", mid:"#c8a882", low:"#8faa8b" };
const HABIT_PRESETS = [
  { name:"No Spend Day",        emoji:"🪨", desc:"A full day with zero purchases" },
  { name:"No Credit Card Use",  emoji:"✂️", desc:"Pay cash or debit only" },
  { name:"Cook at Home",        emoji:"🍳", desc:"Didn't eat out or order delivery" },
  { name:"No Impulse Buy",      emoji:"🧘", desc:"Stuck to the list" },
  { name:"Reviewed Budget",     emoji:"📋", desc:"Checked in on spending" },
  { name:"Savings Transfer",    emoji:"🌱", desc:"Moved money to savings" },
];
const fmt  = n => { const abs = Math.abs(n); return `$${abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)}`; };
const pct  = (a,b) => b > 0 ? Math.min((a/b)*100, 100) : 0;
const uid  = () => Math.random().toString(36).slice(2,9);

// ── Defaults ─────────────────────────────────────────────────────────────────
// ── Demo seed ─────────────────────────────────────────────────────────────────
// fictional person: Alex Chen · $3,800/mo take-home · clearly labeled demo data
const DEF_CATS = {
  essentials: { label:"Essentials", color:"#8a5c2a", items:["rent","utilities","groceries","transit","therapy"] },
  savings:    { label:"Savings",    color:"#8faa8b", items:["credit card (meridian)","emergency fund","summer trip","new laptop"] },
  loans:      { label:"Loans",      color:"#a89bc8", items:["student loan"] },
  misc:       { label:"Misc",       color:"#c8907a", items:["dining out","subscriptions","clothing","fitness","misc"] },
};
const DEF_BUDGETS = {
  rent:1200, utilities:80, groceries:200, transit:60, therapy:80,
  "credit card (meridian)":150, "emergency fund":100, "summer trip":200, "new laptop":100,
  "student loan":250,
  "dining out":120, subscriptions:30, clothing:0, fitness:40, misc:50,
};
const DEF_ACCOUNTS = [
  { id:"meridian_chk", name:"Meridian",      label:"Checking",    type:"checking", color:"#8a5c2a", balance:1420, bills:["rent","utilities","therapy","transit"],  savingsGoals:[], notes:"Primary account", paycheckSplit:2800 },
  { id:"oak_sav",      name:"Oak Savings",   label:"Savings",     type:"savings",  color:"#8faa8b", balance:2340, bills:[],                                         savingsGoals:["emergency fund","summer trip","new laptop"], notes:"Goals + emergency fund" },
  { id:"meridian_cc",  name:"Meridian",      label:"Credit Card", type:"credit",   color:"#c8907a", balance:840,  bills:["groceries","dining out","subscriptions","fitness","misc","clothing"], savingsGoals:[], notes:"Paying down — target $0 by Dec 2026", creditLimit:3000, payoffTarget:3000 },
];
const DEF_GOALS = {
  "emergency fund":  { target:6000, saved:2340, priority:"high", deadline:"ongoing",       emoji:"🛡️", linkedCategories:["emergency fund"], linkedAccount:"oak_sav", horizonMonths:18, starred:true },
  "summer trip":     { target:1800, saved:480,  priority:"mid",  deadline:"June 2026",     emoji:"✈️", linkedCategories:["summer trip"],    linkedAccount:"oak_sav", starred:true },
  "new laptop":      { target:1200, saved:200,  priority:"low",  deadline:"October 2026",  emoji:"💻", linkedCategories:["new laptop"],     linkedAccount:"oak_sav" },
};
const DEF_LOANS = {
  "student loan": { target:18000, paid:6200, priority:"mid", deadline:"ongoing", emoji:"🎓", notes:"Federal — income-based repayment", monthlyPayment:250, horizonMonths:36 },
};
const DEF_INCOME = 3800;

// Seed transactions for current month so app feels alive on first load
const _now = new Date();
const _mo  = _now.getMonth();
const _yr  = _now.getFullYear();
const _d   = (day) => `${_yr}-${String(_mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
const DEF_TXNS = {
  [`${_mo}_first`]: [
    { id:"seed1", date:_d(2),  notes:"rent",           amount:1200, category:"rent",        from_account_id:"meridian_chk", to_account_id:"", money_flow:"expense",      feeling:"necessary", createdAt:1 },
    { id:"seed2", date:_d(3),  notes:"whole foods run", amount:67,  category:"groceries",   from_account_id:"meridian_cc",  to_account_id:"", money_flow:"expense",      feeling:"necessary", createdAt:2 },
    { id:"seed3", date:_d(5),  notes:"therapy session", amount:80,  category:"therapy",     from_account_id:"meridian_chk", to_account_id:"", money_flow:"expense",      feeling:"happy",     createdAt:3 },
    { id:"seed4", date:_d(7),  notes:"spotify + icloud",amount:28,  category:"subscriptions",from_account_id:"meridian_cc", to_account_id:"", money_flow:"expense",      feeling:"necessary", createdAt:4 },
    { id:"seed5", date:_d(9),  notes:"brunch with friends",amount:42,category:"dining out", from_account_id:"meridian_cc",  to_account_id:"", money_flow:"expense",      feeling:"happy",     createdAt:5 },
    { id:"seed6", date:_d(10), notes:"emergency fund",  amount:100, category:"emergency fund",from_account_id:"meridian_chk",to_account_id:"oak_sav", money_flow:"transfer", feeling:"necessary", createdAt:6 },
    { id:"seed7", date:_d(12), notes:"impulse buy 😬",  amount:55,  category:"clothing",    from_account_id:"meridian_cc",  to_account_id:"", money_flow:"expense",      feeling:"regretted", createdAt:7 },
    { id:"seed8", date:_d(13), notes:"summer trip fund", amount:200, category:"summer trip", from_account_id:"meridian_chk",to_account_id:"oak_sav", money_flow:"transfer", feeling:"happy",     createdAt:8 },
  ],
  [`${_mo}_second`]: [
    { id:"seed9",  date:_d(17), notes:"student loan payment",amount:250,category:"student loan",from_account_id:"meridian_chk",to_account_id:"", money_flow:"debt_payment",feeling:"necessary",createdAt:9 },
    { id:"seed10", date:_d(18), notes:"electricity bill",   amount:80, category:"utilities",   from_account_id:"meridian_chk",to_account_id:"", money_flow:"expense",      feeling:"necessary",createdAt:10 },
    { id:"seed11", date:_d(19), notes:"farmers market",     amount:38, category:"groceries",   from_account_id:"meridian_cc", to_account_id:"", money_flow:"expense",      feeling:"happy",    createdAt:11 },
    { id:"seed12", date:_d(21), notes:"gym membership",     amount:40, category:"fitness",     from_account_id:"meridian_cc", to_account_id:"", money_flow:"expense",      feeling:"happy",    createdAt:12 },
  ],
};

// ── Styles ────────────────────────────────────────────────────────────────────
const GREEN = "#6b7c3f";   // warm olive green — logo accent
const CREAM = "#faf5ed";   // warm parchment card tint
const S = {
  card:       { background:"rgba(252,247,238,0.96)", borderRadius:14, padding:"15px 17px", border:"1px solid rgba(210,190,160,0.5)", boxShadow:"0 2px 16px rgba(60,35,10,0.08), 0 1px 0 rgba(255,255,248,0.9) inset", overflow:"hidden", minWidth:0, maxWidth:"100%" },
  sans:       { fontFamily:"'DM Sans',sans-serif", color:"#2a1f14" },
  serif:      { fontFamily:"'DM Serif Display',serif", color:"#2a1f14" },
  label:      { fontFamily:"'DM Sans',sans-serif", fontSize:"0.67rem", fontWeight:500, letterSpacing:"0.08em", textTransform:"uppercase", color:"#7a5c3a", marginBottom:3 },
  input:      { fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", padding:"7px 10px", border:"1.5px solid #e0d0be", borderRadius:8, background:"#fff", color:"#1e140a", outline:"none", width:"100%", boxSizing:"border-box" },
  select:     { fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", padding:"7px 10px", border:"1.5px solid #e0d0be", borderRadius:8, background:"#fff", color:"#1e140a", outline:"none", width:"100%", boxSizing:"border-box" },
  btnPrimary: { fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", fontWeight:500, padding:"8px 16px", borderRadius:8, border:"none", background:GREEN, color:"#faf6f0", cursor:"pointer" },
  btnGhost:   { fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", padding:"8px 13px", borderRadius:8, border:`1.5px solid ${GREEN}55`, background:"transparent", color:GREEN, cursor:"pointer" },
  btnSm:      { fontFamily:"'DM Sans',sans-serif", fontSize:"0.72rem", padding:"4px 10px", borderRadius:6, border:"1.5px solid #e0d0be", background:"transparent", color:"#4a3020", cursor:"pointer" },
};

// ── Micro components ──────────────────────────────────────────────────────────
const Card = ({ children, style }) => <div className="card-grain" style={{...S.card,...style}}>{children}</div>;
const Label = ({ children }) => <div style={S.label}>{children}</div>;
const BtnSm = ({ onClick, children, style }) => <button style={{...S.btnSm,...style}} onClick={onClick}>{children}</button>;

function SectionTitle({ children, action }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:8,flexWrap:"wrap"}}>
      <div style={{...S.serif,fontSize:"1.05rem",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        {children}
        <span style={{height:1,background:"#e8ddd0",display:"inline-block",width:40}}/>
      </div>
      {action&&<div style={{display:"flex",gap:6,flexShrink:0}}>{action}</div>}
    </div>
  );
}

function FormRow({ children }) { return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{children}</div>; }
function FormGroup({ label, children }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"#7a5c3a"}}>{label}</div>
      {children}
    </div>
  );
}

function ProgressBar({ value, color="#c8a882", height=10, noShadow=false }) {
  return (
    <div style={{height,background:"#ede5d8",borderRadius:height/2,overflow:"visible",position:"relative"}}>
      <div style={{
        height:"100%",width:`${Math.min(value,100)}%`,background:color,
        borderRadius:height/2,transition:"width 0.4s",
        boxShadow:noShadow?undefined:`0 1px 6px ${typeof color==="string"&&!color.includes("gradient")?color+"66":"rgba(61,107,79,0.35)"}`,
        position:"relative",
      }}/>
    </div>
  );
}

function PriorityBadge({ priority }) {
  return <span style={{...S.sans,fontSize:"0.63rem",fontWeight:500,padding:"2px 7px",borderRadius:10,textTransform:"uppercase",letterSpacing:"0.04em",background:PRIORITY_COLOR[priority]+"22",color:PRIORITY_COLOR[priority]}}>{priority}</span>;
}

function Modal({ title, subtitle, onClose, footer, children, stickyBar }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(44,33,22,0.45)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{background:"#faf6f0",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 -8px 40px rgba(44,33,22,0.18)"}}>
        <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #e8ddd0",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{...S.serif,fontSize:"1.15rem",flex:1}}>{title}</div>
          {subtitle && <div style={{...S.sans,fontSize:"0.72rem",color:"#7a5c3a"}}>{subtitle}</div>}
          <button style={{background:"none",border:"none",cursor:"pointer",fontSize:"1.2rem",color:"#7a5c3a"}} onClick={onClose}>✕</button>
        </div>
        {/* Pinned bar — lives outside scroll area so keyboard can't push it away */}
        {stickyBar && <div style={{flexShrink:0,borderBottom:"1px solid #f0e8dc",background:"#faf6f0"}}>{stickyBar}</div>}
        <div style={{overflowY:"auto",padding:"0 20px",flex:1}}>{children}</div>
        {footer && <div style={{padding:"14px 20px",borderTop:"1px solid #e8ddd0",flexShrink:0,background:"#faf6f0"}}>{footer}</div>}
      </div>
    </div>
  );
}

// ── Sticky money-left bar ─────────────────────────────────────────────────────
function StickyMoneyLeft({ spent, budget, label }) {
  const left = budget - spent;
  const over = left < 0;
  return (
    <div style={{position:"sticky",top:0,zIndex:50,background:"#faf6f0",borderBottom:"1px solid #e8ddd0",padding:"10px 16px 8px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
        <span style={{...S.sans,fontSize:"0.68rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a"}}>{label}</span>
        <span style={{...S.serif,fontSize:"1.1rem",color:over?"#b85050":left===0?"#4a7c59":"#2c2116"}}>
          {over ? `-${fmt(Math.abs(left))} over` : `${fmt(left)} left`}
        </span>
      </div>
      <div style={{height:7,background:"#f0e8dc",borderRadius:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(pct(spent,budget),100)}%`,borderRadius:4,
          background:over?"linear-gradient(90deg,#c8a882,#c88b8b)":pct(spent,budget)>80?"#c8a882":"linear-gradient(90deg,#8faa8b,#a89bc8)",
          transition:"width 0.3s"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.66rem",color:"#8a6848",marginTop:3}}>
        <span>{fmt(spent)} spent</span><span>{fmt(budget)} budget</span>
      </div>
    </div>
  );
}

// ── Add Transaction Form ──────────────────────────────────────────────────────
function AddTxForm({ onAdd, onCancel, categories, accounts, showPeriodPicker=false, defaultPeriod="first" }) {
  const today = new Date().toISOString().split("T")[0];
  const allItems = Object.values(categories).flatMap(c=>c.items);

  const [tx, setTx] = useState({
    date: today, notes: "", amount: "",
    category: allItems[0]||"",
    from_account_id: (accounts.find(a=>a.type==="checking"||a.type==="savings")||accounts[0])?.id||"",
    to_account_id: "",
    money_flow: "expense",   // expense | transfer | debt_payment
    feeling: "necessary",
    _period: defaultPeriod,
  });

  const fromAcct = accounts.find(a=>a.id===tx.from_account_id);
  const toAcct   = accounts.find(a=>a.id===tx.to_account_id);

  // Auto-infer money_flow from account context
  function inferFlow(fromId, toId) {
    const to = accounts.find(a=>a.id===toId);
    if (!toId) return "expense";
    if (to?.type==="credit") return "debt_payment";
    return "transfer";
  }

  function handleFromChange(id) {
    const flow = inferFlow(id, tx.to_account_id);
    setTx(v=>({...v, from_account_id:id, money_flow:flow}));
  }
  function handleToChange(id) {
    const flow = inferFlow(tx.from_account_id, id);
    setTx(v=>({...v, to_account_id:id, money_flow:flow}));
  }

  const flowLabel = {
    expense:      { label:"Spent",             color:"#c88b8b", hint:"money leaves the system" },
    transfer:     { label:"Allocated",         color:"#8faa8b", hint:"moves between your accounts" },
    debt_payment: { label:"Paid toward debt",  color:"#a89bc8", hint:"reduces a liability" },
  };

  function submit() {
    if (!tx.amount||isNaN(parseFloat(tx.amount))) return;
    onAdd({...tx, amount:parseFloat(tx.amount)});
  }

  return (
    <div style={{background:"#fdfaf6",border:"1.5px solid #c8a882",borderRadius:14,padding:16,display:"flex",flexDirection:"column",gap:11}}>
      {showPeriodPicker && (
        <FormGroup label="which paycheck?">
          <div style={{display:"flex",gap:6}}>
            {[{id:"first",label:"1st – 15th"},{id:"second",label:"16th – end"}].map(p=>(
              <button key={p.id} onClick={()=>setTx(v=>({...v,_period:p.id}))}
                style={{flex:1,padding:"7px 0",...S.sans,fontSize:"0.78rem",borderRadius:8,cursor:"pointer",
                  border:`1.5px solid ${tx._period===p.id?"#c8a882":"#e0d0be"}`,
                  background:tx._period===p.id?"#c8a88222":"transparent",
                  color:tx._period===p.id?"#2c2116":"#7a6048"}}>{p.label}</button>
            ))}
          </div>
        </FormGroup>
      )}

      <FormRow>
        <FormGroup label="Date">
          <input style={S.input} type="date" value={tx.date} onChange={e=>setTx(v=>({...v,date:e.target.value}))}/>
        </FormGroup>
        <FormGroup label="Amount ($)">
          <input style={{...S.input,fontSize:"1.1rem"}} type="number" inputMode="decimal" placeholder="0.00"
            value={tx.amount} onChange={e=>setTx(v=>({...v,amount:e.target.value}))}
            onKeyDown={e=>{if(e.key==="Enter")submit();}} autoFocus/>
        </FormGroup>
      </FormRow>

      <FormGroup label="Notes">
        <input style={S.input} type="text" placeholder="what was it for?" value={tx.notes}
          onChange={e=>setTx(v=>({...v,notes:e.target.value}))}/>
      </FormGroup>

      <FormGroup label="Category (intent)">
        <select style={S.select} value={tx.category} onChange={e=>setTx(v=>({...v,category:e.target.value}))}>
          {allItems.map(i=><option key={i} value={i}>{i}</option>)}
        </select>
      </FormGroup>

      {/* From / To accounts */}
      <FormRow>
        <FormGroup label="Paid from">
          <select style={S.select} value={tx.from_account_id} onChange={e=>handleFromChange(e.target.value)}>
            {accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.label}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Paid to (optional)">
          <select style={S.select} value={tx.to_account_id} onChange={e=>handleToChange(e.target.value)}>
            <option value="">— none (expense) —</option>
            {accounts.filter(a=>a.id!==tx.from_account_id).map(a=>(
              <option key={a.id} value={a.id}>{a.name} · {a.label}</option>
            ))}
          </select>
        </FormGroup>
      </FormRow>

      {/* Money flow badge — auto-inferred, shown for clarity */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a"}}>flow type</div>
        <div style={{display:"flex",gap:6}}>
          {Object.entries(flowLabel).map(([k,v])=>(
            <button key={k} onClick={()=>setTx(p=>({...p,money_flow:k}))}
              style={{...S.sans,fontSize:"0.72rem",padding:"4px 10px",borderRadius:16,cursor:"pointer",
                border:`1.5px solid ${tx.money_flow===k?v.color:"#e0d0be"}`,
                background:tx.money_flow===k?v.color+"18":"transparent",
                color:tx.money_flow===k?v.color:"#4a3020",fontWeight:tx.money_flow===k?500:400}}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{...S.sans,fontSize:"0.68rem",color:"#7a5c3a",fontStyle:"italic",marginTop:-4}}>
        {flowLabel[tx.money_flow]?.hint}
        {tx.to_account_id&&toAcct&&` → ${toAcct.name}`}
      </div>

      <FormGroup label="How do you feel about it?">
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {FEELINGS.map(f=>(
            <button key={f.v} onClick={()=>setTx(v=>({...v,feeling:f.v}))}
              style={{...S.sans,fontSize:"0.74rem",padding:"5px 11px",borderRadius:20,cursor:"pointer",
                border:`1.5px solid ${tx.feeling===f.v?f.color:"#e0d0be"}`,
                background:tx.feeling===f.v?f.color+"18":"transparent",
                color:tx.feeling===f.v?f.color:"#4a3020",fontWeight:tx.feeling===f.v?500:400}}>{f.label}</button>
          ))}
        </div>
      </FormGroup>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button style={S.btnGhost} onClick={onCancel}>cancel</button>
        <button style={S.btnPrimary} onClick={submit}>add transaction</button>
      </div>
    </div>
  );
}

// ── TxList ────────────────────────────────────────────────────────────────────
function TxList({ txs, accounts, categories, onDelete, onEdit, emptyMsg="no transactions yet ✨" }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const allItems = Object.values(categories).flatMap(c=>c.items);

  const sorted = [...txs].sort((a,b)=>{
    if (!a.date && !b.date) return (b.createdAt||0)-(a.createdAt||0);
    if (!a.date) return 1;
    if (!b.date) return -1;
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return (b.createdAt||0)-(a.createdAt||0); // same date → newest creation first
  });

  // Resolve account name from either old or new schema
  function acctName(tx) {
    const fromId = tx.from_account_id || tx.account;
    const toId   = tx.to_account_id;
    const from   = accounts.find(a=>a.id===fromId);
    const to     = accounts.find(a=>a.id===toId);
    if (from && to) return `${from.name} → ${to.name}`;
    if (from) return from.name;
    return fromId||"";
  }

  // Flow color for left border
  // Flow label chip — flow type only, no mood
  function flowChip(tx) {
    if (tx._isDeposit) return {label:"deposit", color:GREEN};
    if (tx.money_flow==="debt_payment" || tx.txType==="payment") return {label:"paid toward debt", color:"#a89bc8"};
    if (tx.money_flow==="transfer") return {label:"allocated", color:"#8faa8b"};
    return null;
  }

  // Mood dot color — separate from flow
  function moodColor(tx) {
    if (tx._isDeposit) return null; // deposits don't have a mood dot
    const feel = FEELINGS.find(f=>f.v===tx.feeling);
    return feel?.color || "#d4bfa0";
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
      {sorted.length===0 && <div style={{...S.sans,textAlign:"center",padding:"26px 14px",color:"#7a5c3a",fontStyle:"italic",fontSize:"0.84rem"}}>{emptyMsg}</div>}
      {sorted.map(tx=>{
        const chip  = flowChip(tx);
        const dotColor = moodColor(tx);
        if (editingId===tx.id) return (
          <div key={tx.id} style={{background:"#fdfaf6",border:"1.5px solid #c8a882",borderRadius:10,padding:"10px 13px",display:"flex",flexDirection:"column",gap:8}}>
            <FormRow>
              <FormGroup label="Date"><input style={S.input} type="date" value={draft.date||""} onChange={e=>setDraft(p=>({...p,date:e.target.value}))}/></FormGroup>
              <FormGroup label="Amount"><input style={S.input} type="number" inputMode="decimal" value={draft.amount||""} onChange={e=>setDraft(p=>({...p,amount:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormGroup label="Notes"><input style={S.input} value={draft.notes||""} onChange={e=>setDraft(p=>({...p,notes:e.target.value}))}/></FormGroup>
            <FormRow>
              <FormGroup label="Category">
                <select style={S.select} value={draft.category||""} onChange={e=>setDraft(p=>({...p,category:e.target.value}))}>
                  {allItems.map(i=><option key={i} value={i}>{i}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Paid from">
                <select style={S.select} value={draft.from_account_id||draft.account||""} onChange={e=>setDraft(p=>({...p,from_account_id:e.target.value}))}>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.label}</option>)}
                </select>
              </FormGroup>
            </FormRow>
            <FormGroup label="How do you feel about it?">
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {FEELINGS.map(f=>(
                  <button key={f.v} onClick={()=>setDraft(p=>({...p,feeling:f.v}))}
                    style={{...S.sans,fontSize:"0.74rem",padding:"5px 11px",borderRadius:20,cursor:"pointer",
                      border:`1.5px solid ${draft.feeling===f.v?f.color:"#e0d0be"}`,
                      background:draft.feeling===f.v?f.color+"18":"transparent",
                      color:draft.feeling===f.v?f.color:"#4a3020",fontWeight:draft.feeling===f.v?500:400}}>
                    {f.label}
                  </button>
                ))}
              </div>
            </FormGroup>
            <div style={{display:"flex",gap:7,justifyContent:"flex-end"}}>
              <button style={S.btnGhost} onClick={()=>setEditingId(null)}>cancel</button>
              <button style={S.btnPrimary} onClick={()=>{ onEdit(tx.id, {...draft,amount:parseFloat(draft.amount)||0}); setEditingId(null); }}>save</button>
            </div>
          </div>
        );
        return (
          <div key={tx.id} style={{background:"rgba(248,242,228,0.9)",border:"0.5px solid rgba(210,195,165,0.5)",borderRadius:10,padding:"9px 13px",display:"flex",alignItems:"center",gap:9,overflow:"hidden",minWidth:0}}>
            {/* Mood dot */}
            {dotColor && <div style={{width:7,height:7,borderRadius:"50%",background:dotColor,flexShrink:0}}/>}
            <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <div style={{...S.sans,fontSize:"0.82rem",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.notes||tx.category}</div>
                {chip&&<span style={{...S.sans,fontSize:"0.6rem",padding:"1px 6px",borderRadius:8,background:chip.color+"22",color:chip.color,fontWeight:500,whiteSpace:"nowrap",flexShrink:0}}>{chip.label}</span>}
              </div>
              <div style={{...S.sans,fontSize:"0.69rem",color:"#7a5c3a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.date&&`${tx.date} · `}{tx.category} · {acctName(tx)}</div>
            </div>
            <div style={{...S.serif,fontSize:"0.93rem",whiteSpace:"nowrap",flexShrink:0,
              color:tx._isDeposit ? GREEN : tx.money_flow==="debt_payment"?"#a89bc8":tx.money_flow==="transfer"?"#7a9ec8":"#b85050"}}>
              {tx._isDeposit?"+":tx.money_flow==="expense"?"-":""}{fmt(tx.amount)}
            </div>
            <button style={{background:"none",border:"none",cursor:"pointer",color:"#6b4c2a",fontSize:"0.8rem",padding:"2px 3px"}}
              onClick={()=>{ setEditingId(tx.id); setDraft({...tx}); }}>✏️</button>
            <button style={{background:"none",border:"none",cursor:"pointer",color:"#d4bfa0",fontSize:"1rem",padding:"2px 4px"}}
              onClick={()=>onDelete(tx.id)}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ── Budget Editor Modal (with sticky money-left + rollover awareness) ─────────
function BudgetEditorModal({ title, income, budgets, categories, catOrder, onSave, onReset, onClose, rolloverMap, goalKeys, getGoalPace, splitRules, monthlyBudgets, isFirstHalfLocked }) {
  const [draftIncome,   setDraftIncome]  = useState(String(income));
  const [draftBudgets,  setDraftBudgets] = useState({...budgets});
  const [draftCatOrder, setDraftCatOrder]= useState(catOrder ? [...catOrder] : Object.keys(categories));
  const [dragItem,  setDragItem]  = useState(null);
  const [dragOver,  setDragOver]  = useState(null);
  const [overrides, setOverrides] = useState({});
  const [goalEditing, setGoalEditing] = useState({});
  const [goalPending, setGoalPending] = useState({});
  const [stickyUpdates, setStickyUpdates] = useState({}); // {itemKey: rule|null}
  const [staleDismissed, setStaleDismissed] = useState({}); // {itemKey: true}

  // Only sum items actually shown in the editor — not stale keys from old saves
  const visibleItems = categories ? Object.values(categories).flatMap(c=>c.items||[]) : [];
  const total = visibleItems.reduce((a,item)=>a+(parseFloat(draftBudgets[item])||0),0);
  const inc   = parseFloat(draftIncome)||0;
  const left  = inc - total;
  const ro    = rolloverMap || {}; // {accountId: {amount, account}}

  // For each credit card with rollover, find the matching budget category item.
  // Match: look for a category item whose name contains the account name (or vice versa),
  // case-insensitive. e.g. account "Bank of America" → item "credit card (bofa)" won't match
  // by name alone, so we also check account label ("Credit Card") + account id fragments.
  const allItems = Object.values(categories).flatMap(c=>c.items);

  function findPayoffItem(acct) {
    const acctName  = (acct.name||"").toLowerCase();
    const acctLabel = (acct.label||"").toLowerCase();
    const acctId    = (acct.id||"").toLowerCase().replace(/_/g," ");
    // Try each item — match if item contains any meaningful word from account name/id
    const nameWords = acctId.split(/\s+/).filter(w=>w.length>2);
    return allItems.find(item=>{
      const it = item.toLowerCase();
      if (it.includes(acctName) || acctName.includes(it)) return true;
      if (nameWords.some(w=>it.includes(w))) return true;
      if (it.includes("bilt") && acct.id==="bilt") return true;
      return false;
    }) || null;
  }

  // Build item→rollover lookup and account→unmatched lookup
  const itemRollover = {}; // {itemName: {amount, acct}}
  const unmatchedRollovers = []; // [{amount, account}] — no budget item found
  Object.values(ro).forEach(({amount, account})=>{
    const match = findPayoffItem(account);
    if (match) {
      itemRollover[match] = { amount, acct: account };
    } else {
      unmatchedRollovers.push({amount, account});
    }
  });

  return (
    <Modal title={title} onClose={onClose}
      stickyBar={
        <div style={{padding:"10px 20px 8px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
            <span style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a"}}>income allocated</span>
            <span style={{...S.serif,fontSize:"1.05rem",color:left<0?"#b85050":left===0?"#4a7c59":"#2c2116"}}>
              {left<0?`-${fmt(Math.abs(left))} over`:left===0?"✓ fully allocated":`${fmt(left)} left`}
            </span>
          </div>
          <div style={{height:8,background:"#f0e8dc",borderRadius:4,overflow:"hidden",margin:"4px 0"}}>
            <div style={{height:"100%",width:`${Math.min(pct(total,inc),100)}%`,borderRadius:4,
              background:left<0?"linear-gradient(90deg,#c8a882,#c88b8b)":"linear-gradient(90deg,#a89bc8,#c8a882)",transition:"width 0.2s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.68rem",color:"#7a5c3a"}}>
            <span>{fmt(total)} budgeted</span><span>{fmt(inc)} income</span>
          </div>
        </div>
      }
      footer={
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          {onReset && <button style={S.btnGhost} onClick={onReset}>reset</button>}
          <button style={S.btnGhost} onClick={onClose}>cancel</button>
          <button style={{...S.btnPrimary,background:left<0?"#b85050":GREEN}} onClick={()=>onSave(draftBudgets,parseFloat(draftIncome)||inc,draftCatOrder,stickyUpdates)}>
            {left<0?"save anyway":"save budget"}
          </button>
        </div>
      }>
      {/* Locked period banner */}
      {isFirstHalfLocked && (
        <div style={{...S.sans,fontSize:"0.72rem",background:"#f0e8dc",border:"1px solid #e0d0be",borderRadius:8,padding:"8px 12px",margin:"8px 0 4px",color:"#4a3020",display:"flex",alignItems:"center",gap:8}}>
          <span>🔒</span>
          <span>First half is past — amounts are read-only. Edit 16th–end to adjust the month.</span>
        </div>
      )}
      {/* Unmatched rollovers — no category found */}
      {unmatchedRollovers.map(({amount, account})=>(
        <div key={account.id} style={{...S.sans,fontSize:"0.75rem",background:"#c8a88218",border:"1.5px solid #c8a88266",borderRadius:10,padding:"11px 14px",margin:"10px 0 6px",display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span>💳</span>
            <div style={{flex:1,color:"#7a5c2e"}}>
              <strong>{account.name} {account.label}</strong> has <strong>{fmt(amount)}</strong> rolling over but no payoff category found.
            </div>
          </div>
          <div style={{color:"#7a5c3a",fontSize:"0.7rem"}}>
            Create a budget line item for this card (e.g. <em>"credit card ({account.name.toLowerCase()})"</em>) in Categories, then re-open this editor to see the rollover.
          </div>
          <button style={{...S.sans,fontSize:"0.72rem",padding:"5px 12px",borderRadius:7,border:"1.5px solid #c8a882",background:"transparent",color:"#7a5c2e",cursor:"pointer",alignSelf:"flex-start"}}
            onClick={()=>onClose()}>
            go set up category first →
          </button>
        </div>
      ))}

      <div style={{padding:"12px 0 2px",borderBottom:"2px solid #e8ddd0",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <span style={{...S.sans,fontSize:"0.82rem",fontWeight:500}}>💰 monthly take-home</span>
        <input style={{...S.input,width:110,textAlign:"right",fontSize:"1rem"}} type="number" inputMode="decimal" value={draftIncome} onChange={e=>setDraftIncome(e.target.value)}/>
      </div>

      {draftCatOrder.map((key,catIdx)=>{
        const cat = categories[key]; if(!cat) return null;
        return (
          <div key={key} style={{marginTop:14}}
            draggable onDragStart={()=>setDragItem(key)} onDragOver={e=>{e.preventDefault();setDragOver(key);}}
            onDrop={e=>{e.preventDefault();if(dragItem&&dragItem!==key){const n=[...draftCatOrder];n.splice(n.indexOf(key),0,n.splice(n.indexOf(dragItem),1)[0]);setDraftCatOrder(n);}setDragItem(null);setDragOver(null);}}
            onDragEnd={()=>{setDragItem(null);setDragOver(null);}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",padding:"3px 8px",borderRadius:6,display:"inline-flex",alignItems:"center",gap:6,background:"#f0e8dc",color:"#4a3020",cursor:"grab",border:`1px solid ${dragOver===key?"#c8a882":"transparent"}`,flex:1}}>
                ⠿ {cat.label}
              </div>
              {/* Tap-to-reorder arrows for mobile */}
              <button onClick={()=>{ if(catIdx>0){const n=[...draftCatOrder];[n[catIdx-1],n[catIdx]]=[n[catIdx],n[catIdx-1]];setDraftCatOrder(n);}}} style={{background:"none",border:"1px solid #e0d0be",borderRadius:5,cursor:"pointer",color:"#7a5c3a",fontSize:"0.7rem",padding:"2px 7px",lineHeight:1}} title="move up">▲</button>
              <button onClick={()=>{ if(catIdx<draftCatOrder.length-1){const n=[...draftCatOrder];[n[catIdx],n[catIdx+1]]=[n[catIdx+1],n[catIdx]];setDraftCatOrder(n);}}} style={{background:"none",border:"1px solid #e0d0be",borderRadius:5,cursor:"pointer",color:"#7a5c3a",fontSize:"0.7rem",padding:"2px 7px",lineHeight:1}} title="move down">▼</button>
            </div>
            {cat.items.map(item=>{
              const val = draftBudgets[item]??0;
              const roInfo = itemRollover[item];
              const rollover = roInfo?.amount || 0;
              const isBelowMin = rollover > 0 && (parseFloat(val)||0) < rollover;
              const isOverriding = overrides[item];
              const isGoal = goalKeys?.includes(item);
              const pace = isGoal ? getGoalPace?.(item) : null;
              const suggestedVal = pace?.pace || 0;
              const isGoalOverriding = goalEditing[item];
              const pendingVal = goalPending[item];

              // Goal row — always shows amount (included in allocated bar), with suggested pace label
              if (isGoal) {
                const currentVal = parseFloat(draftBudgets[item]) || 0;
                const isEditing = goalEditing[item];
                const isAtSuggested = suggestedVal > 0 && Math.abs(currentVal - Math.round(suggestedVal/2)) <= 1;
                return (
                  <div key={item}>
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:isEditing?"none":"1px solid #f5ede4"}}>
                      <div style={{...S.sans,fontSize:"0.81rem",color:"#2a1f14",flex:1,textTransform:"capitalize"}}>{item}</div>
                      {/* Suggested pace label */}
                      <div style={{...S.sans,fontSize:"0.62rem",color:"#a89bc8",fontStyle:"italic",whiteSpace:"nowrap"}}>
                        💡 {suggestedVal > 0 ? `${fmt(Math.round(suggestedVal/2))}/period` : "—"}
                      </div>
                      {isEditing ? (
                        <input autoFocus style={{...S.input,width:90,textAlign:"right",borderColor:"#a89bc8"}}
                          type="number" inputMode="decimal" value={pendingVal??""} min={0}
                          onChange={e=>setGoalPending(p=>({...p,[item]:e.target.value}))}/>
                      ) : (
                        <div style={{...S.sans,fontSize:"0.82rem",fontWeight:500,color:currentVal>0?"#4a3828":"#c8b89a",minWidth:60,textAlign:"right"}}>
                          {currentVal>0?fmt(currentVal):"$0"}
                        </div>
                      )}
                      <button style={{...S.sans,fontSize:"0.65rem",padding:"3px 9px",borderRadius:6,border:"1px solid #e0d0be",background:isEditing?"#a89bc8":"transparent",color:isEditing?"#fff":"#7a6048",cursor:"pointer"}}
                        onClick={()=>{
                          if (isEditing) {
                            const v = parseFloat(pendingVal)||0;
                            setDraftBudgets(p=>({...p,[item]:v}));
                            setGoalEditing(p=>({...p,[item]:false}));
                          } else {
                            setGoalEditing(p=>({...p,[item]:true}));
                            setGoalPending(p=>({...p,[item]:String(currentVal||Math.round(suggestedVal/2)||"")}));
                          }
                        }}>
                        {isEditing?"✓ save":"edit"}
                      </button>
                      {isEditing&&(
                        <button style={{...S.sans,fontSize:"0.65rem",padding:"3px 7px",borderRadius:6,border:"1px solid #e0d0be",background:"transparent",color:"#7a5c3a",cursor:"pointer"}}
                          onClick={()=>{ setGoalEditing(p=>({...p,[item]:false})); }}>✕</button>
                      )}
                    </div>
                    {isEditing&&(
                      <div style={{...S.sans,fontSize:"0.67rem",background:"#a89bc812",border:"1px solid #a89bc833",borderRadius:"0 0 8px 8px",padding:"6px 10px",marginBottom:6,color:"#6a5e8a"}}>
                        ⚡ changing this updates your year plan · suggested: <strong>{fmt(Math.round(suggestedVal/2))}/period</strong>
                      </div>
                    )}
                  </div>
                );
              }

              // Normal (non-goal) item
              const rule = splitRules?.[item];
              const monthly = monthlyBudgets?.[item] ?? val * 2;
              const isDefaultHalf = Math.abs(val - Math.round(monthly/2)) < 1;
              const isStale = rule?.sticky && Math.abs((rule.firstAmt + rule.secondAmt) - monthly) > 0.01 && !staleDismissed[item];
              const stickyDraft = stickyUpdates[item]; // pending sticky change
              const currentlySticky = stickyDraft !== undefined
                ? stickyDraft !== null
                : rule?.sticky ?? false;
              return (
                <div key={item}>
                  {/* Stale split warning */}
                  {isStale && (
                    <div style={{...S.sans,fontSize:"0.7rem",background:"#c8a88218",border:"1px solid #c8a88244",borderRadius:8,padding:"8px 10px",margin:"4px 0 2px",display:"flex",flexDirection:"column",gap:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,color:"#7a5c2e",fontWeight:500}}>
                        <span>⚠️</span>
                        <span>Split rule for <em>{item}</em> was {fmt(rule.firstAmt)}/{fmt(rule.secondAmt)} but monthly changed to {fmt(monthly)}</span>
                      </div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {[
                          {id:"A", label:`Keep ${fmt(rule.firstAmt)} fixed (other = ${fmt(Math.max(0,monthly-rule.firstAmt))})`, firstAmt:rule.firstAmt, secondAmt:Math.max(0,monthly-rule.firstAmt)},
                          {id:"B", label:`Keep proportional split (${Math.round(monthly*(rule.firstAmt/(rule.firstAmt+rule.secondAmt)))}/${Math.round(monthly*(rule.secondAmt/(rule.firstAmt+rule.secondAmt)))})`, firstAmt:Math.round(monthly*(rule.firstAmt/(rule.firstAmt+rule.secondAmt))), secondAmt:Math.round(monthly*(rule.secondAmt/(rule.firstAmt+rule.secondAmt)))},
                          {id:"C", label:"Set new split", firstAmt:Math.round(monthly/2), secondAmt:Math.round(monthly/2)},
                        ].map(opt=>(
                          <button key={opt.id} onClick={()=>{
                            const newRule={...rule, firstAmt:opt.firstAmt, secondAmt:opt.secondAmt, monthlyAtSave:monthly};
                            setStickyUpdates(p=>({...p,[item]:newRule}));
                            setDraftBudgets(p=>({...p,[item]:opt.firstAmt}));
                            setStaleDismissed(p=>({...p,[item]:true}));
                          }} style={{...S.sans,fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:"1px solid #c8a88266",background:"transparent",color:"#7a5c2e",cursor:"pointer"}}>
                            {opt.label}
                          </button>
                        ))}
                        <button onClick={()=>setStaleDismissed(p=>({...p,[item]:true}))} style={{...S.sans,fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:"1px solid #e0d0be",background:"transparent",color:"#7a5c3a",cursor:"pointer"}}>ignore</button>
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid #f5ede4",opacity:isFirstHalfLocked?0.6:1}}>
                    <div style={{...S.sans,fontSize:"0.81rem",color:"#2a1f14",flex:1,textTransform:"capitalize"}}>
                      {item}
                      {rule?.sticky&&!isStale&&<span style={{marginLeft:5,fontSize:"0.6rem",color:GREEN,opacity:0.8}}>🔁</span>}
                    </div>
                    {rollover > 0 && (
                      <div style={{...S.sans,fontSize:"0.62rem",color:"#7a9ec8",background:"#7a9ec812",borderRadius:5,padding:"1px 6px",whiteSpace:"nowrap"}}>
                        💳 +{fmt(rollover)} rollover
                      </div>
                    )}
                    {isFirstHalfLocked ? (
                      <div style={{...S.sans,fontSize:"0.75rem",color:"#7a5c3a",minWidth:90,textAlign:"right"}}>{fmt(val)}</div>
                    ) : (
                      <input style={{...S.input,width:90,textAlign:"right",borderColor:isBelowMin&&!isOverriding?"#c88b8b":"#e0d0be"}}
                        type="number" inputMode="decimal" value={val} min={0}
                        onChange={e=>{
                          const newVal = e.target.value;
                          setDraftBudgets(p=>({...p,[item]:newVal}));
                          if (parseFloat(newVal)||0 >= rollover) setOverrides(p=>({...p,[item]:false}));
                          // Auto-update sticky rule draft if sticky
                          if (currentlySticky) {
                            const nv = parseFloat(newVal)||0;
                            setStickyUpdates(p=>({...p,[item]:{...(rule||{}), firstAmt:nv, secondAmt:Math.max(0,monthly-nv), monthlyAtSave:monthly, sticky:true}}));
                          }
                        }}/>
                    )}
                  </div>
                  {/* Sticky toggle — only show if not locked and value differs from default 50/50 */}
                  {!isFirstHalfLocked && !isDefaultHalf && (
                    <div style={{display:"flex",alignItems:"center",gap:7,padding:"3px 0 6px",paddingLeft:4}}>
                      <button onClick={()=>{
                        const nv = parseFloat(val)||0;
                        if (currentlySticky) {
                          setStickyUpdates(p=>({...p,[item]:null}));
                        } else {
                          setStickyUpdates(p=>({...p,[item]:{firstAmt:nv,secondAmt:Math.max(0,monthly-nv),monthlyAtSave:monthly,sticky:true}}));
                        }
                      }} style={{...S.sans,fontSize:"0.62rem",padding:"2px 8px",borderRadius:5,cursor:"pointer",
                        border:`1px solid ${currentlySticky?GREEN+"66":"#e0d0be"}`,
                        background:currentlySticky?GREEN+"12":"transparent",
                        color:currentlySticky?GREEN:"#a8906e"}}>
                        {currentlySticky?"🔁 recurring split":"keep this split every month?"}
                      </button>
                      {currentlySticky&&<span style={{...S.sans,fontSize:"0.6rem",color:"#7a5c3a"}}>tap to remove</span>}
                    </div>
                  )}
                  {isBelowMin && !isOverriding && !isFirstHalfLocked && (
                    <div style={{...S.sans,fontSize:"0.68rem",background:"#7a9ec812",border:"1px solid #7a9ec844",borderRadius:8,padding:"7px 10px",margin:"4px 0 6px",display:"flex",alignItems:"center",gap:8}}>
                      <span>💳</span>
                      <div style={{flex:1,color:"#5a7ea8"}}>
                        <strong>{roInfo?.acct?.name} {roInfo?.acct?.label}</strong> has {fmt(rollover)} rolling over. Budget at least {fmt(rollover)} here to cover it.
                      </div>
                      <div style={{display:"flex",gap:5,flexShrink:0}}>
                        <button style={{...S.sans,fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:"none",background:"#7a9ec8",color:"#fff",cursor:"pointer"}}
                          onClick={()=>setDraftBudgets(p=>({...p,[item]:rollover}))}>set to min</button>
                        <button style={{...S.sans,fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:"1px solid #7a9ec844",background:"transparent",color:"#7a9ec8",cursor:"pointer"}}
                          onClick={()=>setOverrides(p=>({...p,[item]:true}))}>override</button>
                      </div>
                    </div>
                  )}
                  {isBelowMin && isOverriding && !isFirstHalfLocked && (
                    <div style={{...S.sans,fontSize:"0.67rem",color:"#7a5c3a",fontStyle:"italic",padding:"2px 0 6px"}}>
                      ⚠️ budgeted below {fmt(rollover)} rollover — you'll need to cover the gap
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      <div style={{height:20}}/>
    </Modal>
  );
}

// ── Reallocation modal (goal deleted) ─────────────────────────────────────────
function ReallocateModal({ goalKey, goalData, otherGoals, accounts, onDone }) {
  const amt = goalData.saved||0;
  const [choice, setChoice] = useState("goal"); // "goal"|"account"|"discard"
  const [targetGoal, setTargetGoal] = useState(Object.keys(otherGoals)[0]||"");
  const [targetAcct, setTargetAcct] = useState(accounts[0]?.id||"");

  return (
    <Modal title="reallocate funds" subtitle={`${fmt(amt)} from ${goalKey}`} onClose={()=>onDone(null)}
      footer={
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button style={S.btnGhost} onClick={()=>onDone(null)}>discard funds</button>
          <button style={S.btnPrimary} onClick={()=>onDone({choice,targetGoal,targetAcct,amt})}>confirm</button>
        </div>
      }>
      <div style={{paddingTop:16,display:"flex",flexDirection:"column",gap:12}}>
        <div style={{...S.sans,fontSize:"0.82rem",color:"#2a1f14"}}>
          You had <strong>{fmt(amt)}</strong> committed to <em>{goalKey}</em>. Where should it go?
        </div>
        {[
          {id:"goal",    label:"Move to another goal"},
          {id:"account", label:"Return to account balance"},
          {id:"discard", label:"Discard (remove from totals)"},
        ].map(opt=>(
          <button key={opt.id} onClick={()=>setChoice(opt.id)}
            style={{...S.sans,fontSize:"0.82rem",padding:"10px 14px",borderRadius:10,cursor:"pointer",textAlign:"left",
              border:`1.5px solid ${choice===opt.id?"#c8a882":"#e0d0be"}`,
              background:choice===opt.id?"#c8a88218":"transparent",color:choice===opt.id?"#2c2116":"#7a6048"}}>
            {opt.label}
          </button>
        ))}
        {choice==="goal" && Object.keys(otherGoals).length>0 && (
          <FormGroup label="destination goal">
            <select style={S.select} value={targetGoal} onChange={e=>setTargetGoal(e.target.value)}>
              {Object.entries(otherGoals).map(([k,g])=><option key={k} value={k}>{g.emoji||"🎯"} {k}</option>)}
            </select>
          </FormGroup>
        )}
        {choice==="account" && (
          <FormGroup label="return to account">
            <select style={S.select} value={targetAcct} onChange={e=>setTargetAcct(e.target.value)}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.name} {a.label}</option>)}
            </select>
          </FormGroup>
        )}
      </div>
    </Modal>
  );
}

// ── Balance editor ────────────────────────────────────────────────────────────
function BalanceEditor({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState("");
  const [mode,    setMode]    = useState("set"); // "set" | "add" | "subtract"

  if (editing) {
    const preview = (() => {
      const n = parseFloat(val)||0;
      if (mode==="add")      return value + n;
      if (mode==="subtract") return Math.max(0, value - n);
      return n;
    })();
    return (
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {/* Mode toggle */}
        <div style={{display:"flex",gap:4}}>
          {[{id:"set",label:"set to"},{id:"add",label:"+ add"},{id:"subtract",label:"− subtract"}].map(m=>(
            <button key={m.id} onClick={()=>setMode(m.id)}
              style={{...S.sans,fontSize:"0.68rem",padding:"3px 9px",borderRadius:6,cursor:"pointer",border:"1.5px solid",
                borderColor:mode===m.id?(m.id==="subtract"?"#c88b8b":m.id==="add"?"#8faa8b":"#c8a882"):"#e0d0be",
                background:mode===m.id?(m.id==="subtract"?"#c88b8b18":m.id==="add"?"#8faa8b18":"#c8a88218"):"transparent",
                color:mode===m.id?(m.id==="subtract"?"#b85050":m.id==="add"?"#4a7c59":"#7a6048"):"#a8906e"}}>
              {m.label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          <input style={{...S.input,width:110,fontSize:"0.9rem"}} type="number" inputMode="decimal"
            value={val} onChange={e=>setVal(e.target.value)} autoFocus
            placeholder={mode==="set"?"new total":"amount"}/>
          <button style={{...S.btnPrimary,padding:"4px 10px",fontSize:"0.72rem",
            background:mode==="subtract"?"#b85050":mode==="add"?"#4a7c59":"#2c2116"}}
            onClick={()=>{ onChange(preview); setEditing(false); }}>save</button>
          <button style={{...S.btnGhost,padding:"4px 10px",fontSize:"0.72rem"}} onClick={()=>setEditing(false)}>cancel</button>
        </div>
        {mode!=="set"&&val&&<div style={{...S.sans,fontSize:"0.7rem",color:"#7a5c3a"}}>
          {fmt(value)} → <strong>{fmt(preview)}</strong>
        </div>}
      </div>
    );
  }
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{...S.sans,fontSize:"1rem",fontWeight:500}}>{fmt(value)}</span>
      <BtnSm onClick={()=>{ setVal(""); setMode("set"); setEditing(true); }}>update</BtnSm>
    </div>
  );
}

function PaydownCalc({ balance }) {
  const [mo, setMo] = useState("");
  const moN = parseFloat(mo)||0;
  const months = moN>0 ? Math.ceil(balance/moN) : null;
  const proj = months ? (()=>{ const d=new Date(); d.setMonth(d.getMonth()+months); return d.toLocaleDateString("en-US",{month:"long",year:"numeric"}); })() : null;
  return (
    <div style={{marginTop:10,padding:"10px 12px",background:"#fdfaf6",borderRadius:9,border:"1px solid #f0e8dc"}}>
      <div style={{...S.sans,fontSize:"0.67rem",letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:7}}>paydown calculator</div>
      <input style={{...S.input,fontSize:"0.8rem",padding:"5px 9px"}} type="number" inputMode="decimal" placeholder="monthly payment" value={mo} onChange={e=>setMo(e.target.value)}/>
      {months && <div style={{...S.sans,fontSize:"0.75rem",color:"#2a1f14",marginTop:7}}>at {fmt(moN)}/mo → paid off in ~{months} month{months!==1?"s":""}{proj&&` (${proj})`}</div>}
    </div>
  );
}

// ── AddTxPage — full page on mobile, right sidebar on desktop ────────────────
function AddTxPage({ categories, accounts, curMonth, period, onAdd, onClose, prefill }) {
  const today = new Date().toISOString().split("T")[0];
  const allItems = Object.values(categories).flatMap(c=>c.items);
  const catSections = Object.entries(categories); // [{catKey, {label, items}}]
  const defaultAcct = accounts.find(a=>a.type==="checking"||a.type==="savings") || accounts[0];
  const isMobile = typeof window!=="undefined" && window.innerWidth <= 1024;

  // Infer period from today's date
  const todayDay = new Date().getDate();
  const autoPeriod = todayDay <= 15 ? "first" : "second";

  // Derive which pay period a date falls into, based on day-of-month
  function periodForDate(dateStr) {
    if (!dateStr) return autoPeriod;
    const day = parseInt(dateStr.split("-")[2], 10);
    return day <= 15 ? "first" : "second";
  }

  const mkBlank = (sharedDate) => ({
    id: Math.random().toString(36).slice(2,9),
    date: sharedDate || today,
    notes: prefill?.note || "",
    amount: prefill?.amount || "",
    category: prefill?.category || allItems[0]||"",
    from_account_id: defaultAcct?.id||"",
    to_account_id: "",
    money_flow: "expense",
    feeling: "necessary",
    _period: periodForDate(sharedDate || today),
  });

  const [txList, setTxList] = useState([mkBlank(today)]);
  const [sharedDate, setSharedDate] = useState(today);
  const [showMore, setShowMore] = useState(!!prefill); // expand details if prefilled

  function updateTx(idx, patch) {
    setTxList(prev=>prev.map((t,i)=>i===idx?{...t,...patch}:t));
  }
  function inferFlow(fromId, toId, accts) {
    const to = accts.find(a=>a.id===toId);
    if (!toId) return "expense";
    if (to?.type==="credit") return "debt_payment";
    return "transfer";
  }
  function addAnother() {
    setTxList(prev=>[...prev, mkBlank(sharedDate)]);
  }
  function removeTx(idx) {
    setTxList(prev=>prev.filter((_,i)=>i!==idx));
  }
  function handleSubmit() {
    const valid = txList.filter(t=>t.amount&&!isNaN(parseFloat(t.amount)));
    if (!valid.length) return;
    onAdd(valid.map(t=>({...t,amount:parseFloat(t.amount)})));
  }

  const flowLabel = {
    expense:      {label:"Spent",           color:"#c88b8b"},
    transfer:     {label:"Allocated",       color:"#8faa8b"},
    debt_payment: {label:"Paid toward debt",color:"#a89bc8"},
  };

  // ── Mobile quick-log bottom sheet ─────────────────────────────────────────
  if (isMobile) {
    const tx = txList[0]; // quick log always works on first tx
    return (
      <>
        <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(44,33,22,0.4)",zIndex:300}}/>
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:301,background:"#faf6f0",
          borderRadius:"20px 20px 0 0",boxShadow:"0 -8px 40px rgba(44,33,22,0.2)",
          display:"flex",flexDirection:"column",
          maxHeight:"92vh",
          paddingBottom:"env(safe-area-inset-bottom,0px)"}}>

          {/* Drag handle */}
          <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}>
            <div style={{width:36,height:4,borderRadius:2,background:"#e0d0be"}}/>
          </div>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px 8px",flexShrink:0}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem"}}>log transaction</div>
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:"1.2rem",color:"#7a5c3a"}}>✕</button>
          </div>

          <div className="quick-log-scroll" style={{overflowY:"auto",flex:1,WebkitOverflowScrolling:"touch"}}>
            {/* Amount — big and central */}
            <div style={{padding:"4px 20px 16px",borderBottom:"1px solid #f0e8dc"}}>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
                  fontFamily:"'DM Serif Display',serif",fontSize:"1.8rem",color:"#8a5c2a",lineHeight:1}}>$</span>
                <input
                  autoFocus
                  type="number" inputMode="decimal" placeholder="0.00"
                  value={tx.amount} onChange={e=>updateTx(0,{amount:e.target.value})}
                  style={{width:"100%",fontFamily:"'DM Serif Display',serif",fontSize:"2rem",
                    border:"none",borderBottom:"2px solid #e0d0be",borderRadius:0,
                    background:"transparent",color:"#2c2116",outline:"none",
                    padding:"8px 14px 8px 36px",boxSizing:"border-box",
                    textAlign:"right"}}/>
              </div>
            </div>

            {/* Category chips — grouped by section, scrollable horizontal per group */}
            <div style={{borderBottom:"1px solid #f0e8dc",flexShrink:0}}>
              <div style={{paddingLeft:20,paddingTop:12,marginBottom:6,...S.sans,fontSize:"0.62rem",fontWeight:500,
                letterSpacing:"0.08em",textTransform:"uppercase",color:"#7a5c3a"}}>category</div>
              {catSections.map(([catKey, cat])=>{
                if (!cat.items?.length) return null;
                return (
                  <div key={catKey} style={{marginBottom:10}}>
                    <div style={{paddingLeft:20,marginBottom:5,...S.sans,fontSize:"0.58rem",
                      fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",
                      color:"#8a5c2a"}}>
                      {cat.label}
                    </div>
                    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",
                      display:"flex",gap:6,padding:"0 20px",scrollbarWidth:"none"}}>
                      {cat.items.map(item=>{
                        const isSelected = tx.category===item;
                        return (
                          <button key={item} onClick={()=>updateTx(0,{category:item})}
                            style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:"1.5px solid",
                              fontFamily:"'DM Sans',sans-serif",fontSize:"0.78rem",cursor:"pointer",
                              whiteSpace:"nowrap",transition:"all 0.12s",
                              borderColor:isSelected?"#6b7c3f":"#e0d0be",
                              background:isSelected?"#6b7c3f":"transparent",
                              color:isSelected?"#faf6f0":"#4a3828"}}>
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div style={{height:4}}/>
            </div>

            {/* Mood row */}
            <div style={{padding:"12px 20px",borderBottom:"1px solid #f0e8dc",flexShrink:0}}>
              <div style={{...S.sans,fontSize:"0.62rem",fontWeight:500,letterSpacing:"0.08em",
                textTransform:"uppercase",color:"#7a5c3a",marginBottom:8}}>how do you feel about it?</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {FEELINGS.map(f=>(
                  <button key={f.v} onClick={()=>updateTx(0,{feeling:f.v})}
                    style={{padding:"8px 0",borderRadius:10,cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif",fontSize:"0.78rem",
                      border:`1.5px solid ${tx.feeling===f.v?f.color:"#e0d0be"}`,
                      background:tx.feeling===f.v?f.color+"22":"transparent",
                      color:tx.feeling===f.v?f.color:"#4a3020"}}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes — quick optional field */}
            <div style={{padding:"12px 20px",borderBottom:"1px solid #f0e8dc"}}>
              <input type="text" placeholder="add a note (optional)"
                value={tx.notes} onChange={e=>updateTx(0,{notes:e.target.value})}
                style={{...S.input,background:"transparent",border:"none",
                  borderBottom:"1.5px solid #e8ddd0",borderRadius:0,
                  fontStyle:tx.notes?"normal":"italic",width:"100%",padding:"4px 0"}}/>
            </div>

            {/* More details toggle */}
            <button onClick={()=>setShowMore(p=>!p)}
              style={{width:"100%",padding:"11px 20px",background:"none",border:"none",
                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",
                ...S.sans,fontSize:"0.78rem",color:"#7a5c3a",borderBottom:"1px solid #f0e8dc"}}>
              <span>more details</span>
              <span style={{fontSize:"0.7rem"}}>{showMore?"▲":"▼"}</span>
            </button>

            {showMore&&(
              <div style={{padding:"14px 20px",display:"flex",flexDirection:"column",gap:12,borderBottom:"1px solid #f0e8dc"}}>
                {/* Date */}
                <div>
                  <div style={{...S.sans,fontSize:"0.62rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:4}}>date</div>
                  <input type="date" value={sharedDate}
                    onChange={e=>{ setSharedDate(e.target.value); setTxList(prev=>prev.map(t=>({...t,date:e.target.value,_period:periodForDate(e.target.value)}))); }}
                    style={{...S.input}}/>
                </div>

                {/* Account */}
                <div>
                  <div style={{...S.sans,fontSize:"0.62rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:4}}>paid from</div>
                  <select style={S.select} value={tx.from_account_id} onChange={e=>{
                    const flow=inferFlow(e.target.value,tx.to_account_id,accounts);
                    updateTx(0,{from_account_id:e.target.value,money_flow:flow});
                  }}>
                    {accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.label}</option>)}
                  </select>
                </div>

                {/* To account */}
                <div>
                  <div style={{...S.sans,fontSize:"0.62rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:4}}>paid to (for transfers/debt)</div>
                  <select style={S.select} value={tx.to_account_id} onChange={e=>{
                    const flow=inferFlow(tx.from_account_id,e.target.value,accounts);
                    updateTx(0,{to_account_id:e.target.value,money_flow:flow});
                  }}>
                    <option value="">— none —</option>
                    {accounts.filter(a=>a.id!==tx.from_account_id).map(a=>(
                      <option key={a.id} value={a.id}>{a.name} · {a.label}</option>
                    ))}
                  </select>
                </div>

                {/* Flow type */}
                <div>
                  <div style={{...S.sans,fontSize:"0.62rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:6}}>type</div>
                  <div style={{display:"flex",gap:6}}>
                    {Object.entries(flowLabel).map(([k,v])=>(
                      <button key={k} onClick={()=>updateTx(0,{money_flow:k})}
                        style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:"0.68rem",padding:"6px 4px",borderRadius:8,cursor:"pointer",border:"1.5px solid",
                          borderColor:tx.money_flow===k?v.color:"#e0d0be",
                          background:tx.money_flow===k?v.color+"18":"transparent",
                          color:tx.money_flow===k?v.color:"#7a5c3a"}}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period */}
                <div>
                  <div style={{...S.sans,fontSize:"0.62rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:6}}>period</div>
                  <div style={{display:"flex",gap:6}}>
                    {[{id:"first",label:"1st–15th"},{id:"second",label:"16th–end"}].map(p=>(
                      <button key={p.id} onClick={()=>updateTx(0,{_period:p.id})}
                        style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:"0.75rem",padding:"6px 0",borderRadius:8,cursor:"pointer",
                          border:`1.5px solid ${tx._period===p.id?"#c8a882":"#e0d0be"}`,
                          background:tx._period===p.id?"#c8a88222":"transparent",
                          color:tx._period===p.id?"#2c2116":"#7a6048"}}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div style={{height:8}}/>
          </div>

          {/* Queued transactions — items already staged */}
          {txList.length > 1 && (
            <div style={{padding:"8px 20px",flexShrink:0,borderTop:"1px solid #f0e8dc",background:"#f8f3ee"}}>
              <div style={{...S.sans,fontSize:"0.6rem",fontWeight:600,letterSpacing:"0.09em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:6}}>
                queued ({txList.length - 1})
              </div>
              {txList.slice(1).map((t,i)=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<txList.length-2?"1px solid #f0e8dc":"none"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:FEELINGS.find(f=>f.v===t.feeling)?.color||"#c8a882",flexShrink:0}}/>
                  <span style={{...S.sans,fontSize:"0.8rem",color:"#1e140a",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {t.notes||t.category}
                  </span>
                  <span style={{...S.sans,fontSize:"0.8rem",color:"#6b7c3f",flexShrink:0,fontWeight:500}}>
                    {t.amount?`$${parseFloat(t.amount).toFixed(Number.isInteger(parseFloat(t.amount))?0:2)}`:"—"}
                  </span>
                  <button onClick={()=>removeTx(i+1)} style={{background:"none",border:"none",cursor:"pointer",color:"#6b4c2a",fontSize:"1.1rem",padding:"0 2px",flexShrink:0,lineHeight:1}}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{padding:"12px 20px",flexShrink:0,borderTop:"1px solid #f0e8dc",background:"#faf6f0",display:"flex",flexDirection:"column",gap:8}}>
            {/* Log button */}
            <button onClick={handleSubmit}
              style={{...S.btnPrimary,width:"100%",fontSize:"1rem",padding:"14px 0",
                opacity:txList.some(t=>t.amount&&!isNaN(parseFloat(t.amount)))?1:0.45,
                borderRadius:14}}>
              {txList.filter(t=>t.amount).length > 1
                ? `log all ${txList.filter(t=>t.amount).length} ✓`
                : "log it ✓"}
            </button>
            <button onClick={()=>{
                const cur = txList[0];
                if (!cur.amount || isNaN(parseFloat(cur.amount))) return;
                const fresh = mkBlank(sharedDate);
                setTxList(prev=>[fresh, ...prev]);
                setShowMore(false);
                document.querySelector(".quick-log-scroll")?.scrollTo({top:0,behavior:"smooth"});
              }}
              style={{...S.sans,fontSize:"0.82rem",fontWeight:500,
                color:txList[0].amount?"#5a3e2b":"#b8a08a",
                background:txList[0].amount?"#e8ddd0":"#f5ede4",
                border:"none",borderRadius:10,padding:"11px 0",
                cursor:txList[0].amount?"pointer":"default",
                width:"100%",transition:"all 0.15s"}}>
              + add more transactions
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Desktop full form (unchanged) ─────────────────────────────────────────
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(44,33,22,0.35)",zIndex:300}}/>
      <div style={{position:"fixed",zIndex:301,background:"#faf6f0",
        top:0,right:0,bottom:0,width:420,
        boxShadow:"-8px 0 40px rgba(44,33,22,0.15)",
        display:"flex",flexDirection:"column",
        borderLeft:"1px solid #e8ddd0"}}>

        <div style={{padding:"16px 20px 12px",borderBottom:"1px solid #e8ddd0",display:"flex",alignItems:"center",gap:10,flexShrink:0,background:"#faf6f0"}}>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:"1.1rem",color:"#7a5c3a",padding:"2px 4px",marginLeft:-4}}>←</button>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.15rem",flex:1}}>add transaction</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#7a5c3a"}}>{MONTHS[curMonth]}</div>
        </div>

        <div style={{padding:"10px 20px 0",borderBottom:"1px solid #f0e8dc",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:10}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a"}}>date (shared)</div>
            <input style={{...S.input,flex:1,maxWidth:160}} type="date" value={sharedDate}
              onChange={e=>{
                setSharedDate(e.target.value);
                setTxList(prev=>prev.map(t=>({...t,date:e.target.value,_period:periodForDate(e.target.value)})));
              }}/>
          </div>
        </div>

        <div style={{overflowY:"auto",flex:1,padding:"0 20px",WebkitOverflowScrolling:"touch"}}>
          {txList.map((tx,idx)=>{
            const isMulti = txList.length > 1;
            return (
              <div key={tx.id} style={{borderBottom:idx<txList.length-1?"2px dashed #e8ddd0":"none",padding:"16px 0"}}>
                {isMulti&&(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a"}}>transaction {idx+1}</div>
                    <button onClick={()=>removeTx(idx)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"0.7rem",color:"#6b4c2a"}}>remove</button>
                  </div>
                )}
                <div style={{marginBottom:12}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:4}}>Amount ($)</div>
                  <input style={{...S.input,fontSize:"1.4rem",fontFamily:"'DM Serif Display',serif",textAlign:"right",padding:"10px 14px"}}
                    type="number" inputMode="decimal" placeholder="0.00"
                    value={tx.amount} onChange={e=>updateTx(idx,{amount:e.target.value})}
                    autoFocus={idx===0}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{display:"flex",gap:8}}>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:3}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"#7a5c3a"}}>Notes</div>
                      <input style={S.input} placeholder="what was it for?" value={tx.notes} onChange={e=>updateTx(idx,{notes:e.target.value})}/>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"#7a5c3a"}}>Category</div>
                    <select style={S.select} value={tx.category} onChange={e=>updateTx(idx,{category:e.target.value})}>
                      {allItems.map(i=><option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"#7a5c3a"}}>Paid from</div>
                      <select style={S.select} value={tx.from_account_id} onChange={e=>{
                        const flow=inferFlow(e.target.value,tx.to_account_id,accounts);
                        updateTx(idx,{from_account_id:e.target.value,money_flow:flow});
                      }}>
                        {accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.label}</option>)}
                      </select>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"#7a5c3a"}}>Paid to</div>
                      <select style={S.select} value={tx.to_account_id} onChange={e=>{
                        const flow=inferFlow(tx.from_account_id,e.target.value,accounts);
                        updateTx(idx,{to_account_id:e.target.value,money_flow:flow});
                      }}>
                        <option value="">— none —</option>
                        {accounts.filter(a=>a.id!==tx.from_account_id).map(a=>(
                          <option key={a.id} value={a.id}>{a.name} · {a.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {Object.entries(flowLabel).map(([k,v])=>(
                      <button key={k} onClick={()=>updateTx(idx,{money_flow:k})}
                        style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.68rem",padding:"3px 9px",borderRadius:6,cursor:"pointer",border:"1.5px solid",
                          borderColor:tx.money_flow===k?v.color:"#e0d0be",
                          background:tx.money_flow===k?v.color+"18":"transparent",
                          color:tx.money_flow===k?v.color:"#7a5c3a"}}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    {FEELINGS.map(f=>(
                      <button key={f.v} onClick={()=>updateTx(idx,{feeling:f.v})}
                        style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",padding:"6px 0",borderRadius:8,cursor:"pointer",
                          border:`1.5px solid ${tx.feeling===f.v?f.color:"#e0d0be"}`,
                          background:tx.feeling===f.v?f.color+"18":"transparent",
                          color:tx.feeling===f.v?f.color:"#4a3020"}}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {[{id:"first",label:"1st–15th"},{id:"second",label:"16th–end"}].map(p=>(
                      <button key={p.id} onClick={()=>updateTx(idx,{_period:p.id})}
                        style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.75rem",flex:1,padding:"6px 0",borderRadius:8,cursor:"pointer",
                          border:`1.5px solid ${tx._period===p.id?"#c8a882":"#e0d0be"}`,
                          background:tx._period===p.id?"#c8a88222":"transparent",
                          color:tx._period===p.id?"#2c2116":"#7a6048"}}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={addAnother}
            style={{width:"100%",padding:"11px 0",borderRadius:10,border:"1.5px dashed #c8a882",background:"transparent",color:"#7a5c3a",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"0.82rem",fontWeight:500,margin:"8px 0 16px"}}>
            + add another transaction
          </button>
        </div>

        <div style={{padding:"14px 20px",paddingBottom:"calc(14px + env(safe-area-inset-bottom, 0px))",borderTop:"1px solid #e8ddd0",flexShrink:0,background:"#faf6f0",display:"flex",gap:8}}>
          <button style={S.btnGhost} onClick={onClose}>cancel</button>
          <button style={{...S.btnPrimary,flex:1,fontSize:"0.9rem",padding:"11px 0",opacity:txList.some(t=>t.amount&&!isNaN(parseFloat(t.amount)))?1:0.5}}
            onClick={handleSubmit}>
            log {txList.length>1?`${txList.filter(t=>t.amount).length} transaction${txList.filter(t=>t.amount).length!==1?"s":""}` :"transaction"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── DepositPage — full page on mobile, sidebar on desktop ────────────────────
function DepositPage({ accounts, onLog, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const checkingAccts = accounts.filter(a => a.type !== "credit");
  const totalSplit = checkingAccts.reduce((s,a) => s + (a.paycheckSplit||0), 0);

  const [totalAmt,  setTotalAmt]  = useState("");
  const [date,      setDate]      = useState(today);
  const [notes,     setNotes]     = useState("");
  const [splitMode, setSplitMode] = useState("auto"); // "auto" | "manual"
  const [manualSplits, setManualSplits] = useState(
    Object.fromEntries(checkingAccts.map(a => [a.id, ""]))
  );

  const total = parseFloat(totalAmt) || 0;

  // Auto-split by paycheckSplit ratio
  function getAutoSplit(acct) {
    if (!total || !totalSplit) return 0;
    return Math.round((acct.paycheckSplit || 0) / totalSplit * total * 100) / 100;
  }

  function getSplits() {
    if (splitMode === "auto") {
      return checkingAccts.map(a => ({ accountId: a.id, amount: getAutoSplit(a) })).filter(s => s.amount > 0);
    }
    return checkingAccts.map(a => ({ accountId: a.id, amount: parseFloat(manualSplits[a.id]) || 0 })).filter(s => s.amount > 0);
  }

  const splits = getSplits();
  const splitTotal = splits.reduce((s, x) => s + x.amount, 0);
  const unallocated = splitMode === "manual" ? total - splitTotal : 0;
  const canSubmit = total > 0 && splits.length > 0 && (splitMode === "auto" || Math.abs(unallocated) < 0.01);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 620;

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(44,33,22,0.35)",zIndex:300,display:isMobile?"none":"block"}}/>
      <div style={{
        position:"fixed", zIndex:301, background:"#faf6f0",
        ...(isMobile ? { inset:0, display:"flex", flexDirection:"column" }
          : { top:0, right:0, bottom:0, width:400, boxShadow:"-8px 0 40px rgba(44,33,22,0.15)", display:"flex", flexDirection:"column", borderLeft:"1px solid #e8ddd0" })
      }}>
        {/* Header */}
        <div style={{padding:"16px 20px 12px",borderBottom:"1px solid #e8ddd0",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:"1.1rem",color:"#7a5c3a",padding:"2px 4px",marginLeft:-4}}>←</button>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.15rem",flex:1}}>log deposit</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#8faa8b"}}>💰 money in</div>
        </div>

        <div style={{overflowY:"auto",flex:1,padding:"20px",WebkitOverflowScrolling:"touch",display:"flex",flexDirection:"column",gap:16}}>
          {/* Amount */}
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:6}}>Total Amount</div>
            <input style={{...S.input,fontSize:"1.6rem",fontFamily:"'DM Serif Display',serif",textAlign:"right",padding:"12px 16px",borderColor:"#8faa8b66"}}
              type="number" inputMode="decimal" placeholder="0.00"
              value={totalAmt} onChange={e=>setTotalAmt(e.target.value)}
              autoFocus/>
          </div>

          {/* Date + notes */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:4}}>Date</div>
              <input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            </div>
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:4}}>Notes</div>
              <input style={S.input} placeholder="e.g. paycheck" value={notes} onChange={e=>setNotes(e.target.value)}/>
            </div>
          </div>

          {/* Split mode toggle */}
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:6}}>Split across accounts</div>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {[{id:"auto",label:"auto-split"},{id:"manual",label:"manual"}].map(m=>(
                <button key={m.id} onClick={()=>setSplitMode(m.id)}
                  style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.75rem",flex:1,padding:"7px 0",borderRadius:8,cursor:"pointer",
                    border:`1.5px solid ${splitMode===m.id?"#8faa8b":"#e0d0be"}`,
                    background:splitMode===m.id?"#8faa8b18":"transparent",
                    color:splitMode===m.id?"#4a7c59":"#7a6048"}}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Account rows */}
            {checkingAccts.map(acct=>{
              const autoAmt = getAutoSplit(acct);
              return (
                <div key={acct.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f5ede4"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.82rem",fontWeight:500,color:"#1e140a"}}>{acct.name}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",color:"#7a5c3a"}}>{acct.label} · current: {fmt(acct.balance)}</div>
                    {splitMode==="auto" && acct.paycheckSplit > 0 && (
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.65rem",color:"#8faa8b"}}>split setting: {fmt(acct.paycheckSplit)}</div>
                    )}
                  </div>
                  {splitMode==="auto" ? (
                    <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1rem",color:autoAmt>0?"#4a7c59":"#c8b89a",minWidth:70,textAlign:"right"}}>
                      {autoAmt > 0 ? `+${fmt(autoAmt)}` : "—"}
                    </div>
                  ) : (
                    <input style={{...S.input,width:90,textAlign:"right",borderColor:"#8faa8b66"}}
                      type="number" inputMode="decimal" placeholder="0"
                      value={manualSplits[acct.id]}
                      onChange={e=>setManualSplits(p=>({...p,[acct.id]:e.target.value}))}/>
                  )}
                </div>
              );
            })}

            {/* Manual: unallocated warning */}
            {splitMode==="manual" && total > 0 && (
              <div style={{marginTop:10,fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",
                color:Math.abs(unallocated)<0.01?"#8faa8b":unallocated>0?"#c8a882":"#b85050",
                background:Math.abs(unallocated)<0.01?"#8faa8b12":unallocated>0?"#c8a88212":"#c88b8b12",
                border:`1px solid ${Math.abs(unallocated)<0.01?"#8faa8b44":unallocated>0?"#c8a88244":"#c88b8b44"}`,
                borderRadius:8,padding:"7px 10px",display:"flex",justifyContent:"space-between"}}>
                <span>{Math.abs(unallocated)<0.01?"✓ fully allocated":unallocated>0?`${fmt(unallocated)} unallocated`:`${fmt(Math.abs(unallocated))} over`}</span>
                <span>{fmt(splitTotal)} of {fmt(total)}</span>
              </div>
            )}

            {/* Auto: no paycheckSplit set warning */}
            {splitMode==="auto" && totalSplit===0 && (
              <div style={{marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#8a5c2a",background:"#c8a88212",border:"1px solid #c8a88244",borderRadius:8,padding:"7px 10px"}}>
                No direct deposit splits configured. Set them in Accounts → each checking account.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:"14px 20px",paddingBottom:"calc(14px + env(safe-area-inset-bottom,0px))",borderTop:"1px solid #e8ddd0",flexShrink:0,background:"#faf6f0",display:"flex",gap:8}}>
          <button style={S.btnGhost} onClick={onClose}>cancel</button>
          <button style={{...S.btnPrimary,flex:1,fontSize:"0.9rem",padding:"11px 0",background:canSubmit?"#4a7c59":"#2c2116",opacity:canSubmit?1:0.5}}
            onClick={()=>{ if(!canSubmit) return; onLog(splits, notes, date); onClose(); }}>
            log {fmt(total)} deposit
          </button>
        </div>
      </div>
    </>
  );
}

// ── LoanCard — with transaction dropdown ──────────────────────────────────────
function LoanCard({ loanKey, loan, paid, target, lp, done, remaining, mo, loanTxs, accounts,
  editLoan, setEditLoan, loanDraft, setLoanDraft, setLoans, loans, setTxns, curMonth, uid, setArchived }) {
  const [txOpen, setTxOpen] = useState(false);
  const fmt2 = n => `$${Math.abs(n).toFixed(2)}`;
  return (
    <div style={{background:"#fdf8f2",borderRadius:14,border:`1px solid ${done?"#8faa8b44":"#e8ddd0"}`,marginBottom:12,boxShadow:"0 1px 6px rgba(44,33,22,0.07)",overflow:"hidden"}}>
      <div style={{padding:"16px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
          <div style={{fontSize:"1.5rem",lineHeight:1,flexShrink:0}}>{loan.emoji||"📋"}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1rem",textTransform:"capitalize"}}>{loanKey}</div>
              <PriorityBadge priority={loan.priority}/>
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#7a5c3a"}}>{loan.deadline&&`by ${loan.deadline}`}{mo>0&&!done?` · ~${Math.ceil(remaining/mo)}mo at ${fmt2(mo)}/mo`:""}</div>
            {loan.notes&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.71rem",color:"#8a6848",fontStyle:"italic",marginTop:3}}>{loan.notes}</div>}
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            {editLoan===loanKey?(
              <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                <div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",color:"#7a5c3a"}}>total:</span><input style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.82rem",padding:"4px 7px",border:"1.5px solid #e0d0be",borderRadius:8,background:"#fff",color:"#1e140a",outline:"none",width:85,boxSizing:"border-box",textAlign:"right"}} type="number" inputMode="decimal" value={loanDraft.target} onChange={e=>setLoanDraft(p=>({...p,target:e.target.value}))}/></div>
                <div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",color:"#7a5c3a"}}>paid:</span><input style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.82rem",padding:"4px 7px",border:"1.5px solid #e0d0be",borderRadius:8,background:"#fff",color:"#1e140a",outline:"none",width:85,boxSizing:"border-box",textAlign:"right"}} type="number" inputMode="decimal" value={loanDraft.paid} onChange={e=>setLoanDraft(p=>({...p,paid:e.target.value}))} autoFocus/></div>
                <div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.67rem",color:"#7a5c3a"}}>date:</span><input style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.78rem",padding:"4px 7px",border:"1.5px solid #e0d0be",borderRadius:8,background:"#fff",color:"#1e140a",outline:"none",width:120,boxSizing:"border-box"}} type="date" value={loanDraft.payDate||new Date().toISOString().split("T")[0]} onChange={e=>setLoanDraft(p=>({...p,payDate:e.target.value}))}/></div>
                <div style={{display:"flex",gap:4}}>
                  <button style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",padding:"4px 10px",borderRadius:6,border:"none",background:"#2c2116",color:"#faf6f0",cursor:"pointer"}} onClick={()=>{
                    const newPaid=parseFloat(loanDraft.paid)||0,oldPaid=loans[loanKey]?.paid||0,newTarget=parseFloat(loanDraft.target)||loans[loanKey].target;
                    const paymentAmt=Math.max(0,newPaid-oldPaid);
                    setLoans(p=>({...p,[loanKey]:{...p[loanKey],paid:newPaid,target:newTarget}}));
                    if(paymentAmt>0){
                      const payDate=loanDraft.payDate||new Date().toISOString().split("T")[0];
                      const day=parseInt(payDate.split("-")[2]);
                      const pp=day<=15?"first":"second";
                      const mk2=String(curMonth);
                      const payAcct = accounts.find(a=>a.type==="checking"||a.type==="savings") || accounts[0];
                      const newTx={id:uid(),date:payDate,notes:`${loanKey} payment`,amount:paymentAmt,category:loanKey,account:payAcct?.id||"",feeling:"necessary",txType:"loan_payment",money_flow:"debt_payment",from_account_id:payAcct?.id||"",createdAt:Date.now()};
                      setTxns(prev=>({...prev,[`${mk2}_${pp}`]:[...(prev[`${mk2}_${pp}`]||[]),newTx]}));
                    }
                    setEditLoan(null);
                  }}>✓</button>
                  <button style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",padding:"4px 10px",borderRadius:6,border:"1.5px solid #e0d0be",background:"transparent",color:"#4a3020",cursor:"pointer"}} onClick={()=>setEditLoan(null)}>✕</button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",color:done?"#4a7c59":"#2c2116"}}>{done?"paid off":fmt2(remaining)}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.69rem",color:"#7a5c3a"}}>{done?"🎉 complete":"remaining"}</div>
                </div>
                <button style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",padding:"4px 10px",borderRadius:6,border:"1.5px solid #e0d0be",background:"transparent",color:"#4a3020",cursor:"pointer"}} onClick={()=>{setEditLoan(loanKey);setLoanDraft({paid:String(paid),target:String(target)});}}>edit</button>
                {done&&<button style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",padding:"4px 10px",borderRadius:6,border:"1.5px solid #8faa8b",background:"transparent",color:"#4a7c59",cursor:"pointer"}} onClick={()=>{
                  setArchived(p=>({...p,[`loan_${loanKey}`]:{...loan,paid,target,archivedAt:Date.now(),type:"loan",name:loanKey,status:"paid off, complete"}}));
                  setLoans(p=>{ const n={...p}; delete n[loanKey]; return n; });
                }}>archive ✓</button>}
              </div>
            )}
          </div>
        </div>
        <ProgressBar value={lp} color="linear-gradient(90deg,#8fa44a,#4f5e2a)" height={10} noShadow/>
        <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'DM Sans',sans-serif",fontSize:"0.69rem",color:"#7a5c3a",marginTop:4}}>
          <span>{lp.toFixed(0)}% paid off{!done&&<span style={{color:"#8a6848"}}> · {fmt2(paid)} paid</span>}</span>
          {!done&&<span>{fmt2(target)} total</span>}
        </div>
      </div>
      {loanTxs.length>0&&(
        <div style={{borderTop:"1px solid #f0e8dc"}}>
          <button onClick={()=>setTxOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 18px",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#7a5c3a"}}>
            <span>payment history ({loanTxs.length})</span>
            <span style={{fontSize:"0.65rem"}}>{txOpen?"▲":"▼"}</span>
          </button>
          {txOpen&&(
            <div style={{padding:"0 18px 12px",display:"flex",flexDirection:"column",gap:5}}>
              {loanTxs.map(tx=>{
                const acct=accounts.find(a=>a.id===(tx.from_account_id||tx.account));
                return (
                  <div key={tx.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid #f8f3ee"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#a89bc8",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.79rem",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.notes||loanKey+" payment"}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.65rem",color:"#7a5c3a"}}>{tx.date}{acct&&` · ${acct.name}`}</div>
                    </div>
                    <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"0.88rem",color:"#a89bc8",whiteSpace:"nowrap"}}>{fmt2(tx.amount)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── Main App ─────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
// ── AutoFocusInput — focuses once on mount, never steals focus on re-render ──
function AutoFocusInput({ style, placeholder, value, onChange, type="text", inputMode, onKeyDown, onBlur }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []); // empty deps = mount only
  return (
    <input ref={ref} style={style} placeholder={placeholder}
      value={value} onChange={onChange} type={type}
      inputMode={inputMode} onKeyDown={onKeyDown} onBlur={onBlur}/>
  );
}

// ── AddDeferredModal — stable component so AutoFocusInput doesn't remount ────
function AddDeferredModal({ newDeferred, setNewDeferred, onAdd, onClose }) {
  return (
    <Modal title="add to wishlist" onClose={onClose} footer={
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button style={S.btnGhost} onClick={onClose}>cancel</button>
        <button style={{...S.btnPrimary,opacity:newDeferred.name.trim()?1:0.5}} onClick={()=>{
          if(!newDeferred.name.trim()) return;
          onAdd();
        }}>add to list</button>
      </div>
    }>
      <div style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
        <FormGroup label="what do you want? *">
          <AutoFocusInput style={S.input} placeholder="e.g. new headphones"
            value={newDeferred.name} onChange={e=>setNewDeferred(p=>({...p,name:e.target.value}))}/>
        </FormGroup>
        <FormRow>
          <FormGroup label="min price (optional)"><input style={S.input} type="number" inputMode="decimal" placeholder="$0" value={newDeferred.price} onChange={e=>setNewDeferred(p=>({...p,price:e.target.value}))}/></FormGroup>
          <FormGroup label="max price (optional)"><input style={S.input} type="number" inputMode="decimal" placeholder="$0" value={newDeferred.priceMax} onChange={e=>setNewDeferred(p=>({...p,priceMax:e.target.value}))}/></FormGroup>
        </FormRow>
        <FormGroup label="notes (optional)"><input style={S.input} placeholder="why you want it, where you saw it…" value={newDeferred.notes} onChange={e=>setNewDeferred(p=>({...p,notes:e.target.value}))}/></FormGroup>
        <div style={{height:4}}/>
      </div>
    </Modal>
  );
}

// ── AddHabitModal — stable component so autoFocus doesn't remount ─────────────
function AddHabitModal({ newHabit, setNewHabit, onAdd, onClose }) {
  const [presetMode, setPresetMode] = useState(true);
  return (
    <Modal title="new habit" onClose={onClose} footer={
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button style={S.btnGhost} onClick={onClose}>cancel</button>
        <button style={{...S.btnPrimary,opacity:newHabit.name.trim()?1:0.5}} onClick={()=>{
          if(!newHabit.name.trim()) return;
          onAdd();
        }}>add habit</button>
      </div>
    }>
      <div style={{paddingTop:14,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:6,background:"#f0e8dc",borderRadius:8,padding:3}}>
          {[{id:true,label:"from presets"},{id:false,label:"custom"}].map(opt=>(
            <button key={String(opt.id)} onClick={()=>setPresetMode(opt.id)}
              style={{...S.sans,flex:1,fontSize:"0.72rem",fontWeight:500,padding:"6px 0",borderRadius:6,border:"none",cursor:"pointer",
                background:presetMode===opt.id?"#2c2116":"transparent",
                color:presetMode===opt.id?"#faf6f0":"#7a6048"}}>{opt.label}</button>
          ))}
        </div>
        {presetMode ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {HABIT_PRESETS.map(p=>(
              <button key={p.name} onClick={()=>setNewHabit(h=>({...h,name:p.name,emoji:p.emoji}))}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:10,cursor:"pointer",textAlign:"left",
                  border:`1.5px solid ${newHabit.name===p.name?"#c8a882":"#e0d0be"}`,
                  background:newHabit.name===p.name?"#c8a88218":"#fff"}}>
                <span style={{fontSize:"1.2rem"}}>{p.emoji}</span>
                <div>
                  <div style={{...S.sans,fontSize:"0.82rem",fontWeight:500}}>{p.name}</div>
                  <div style={{...S.sans,fontSize:"0.7rem",color:"#7a5c3a"}}>{p.desc}</div>
                </div>
                {newHabit.name===p.name&&<span style={{marginLeft:"auto",color:"#8a5c2a"}}>✓</span>}
              </button>
            ))}
          </div>
        ) : (
          <FormRow>
            <FormGroup label="emoji"><input style={{...S.input,textAlign:"center",fontSize:"1.2rem"}} value={newHabit.emoji} onChange={e=>setNewHabit(h=>({...h,emoji:e.target.value}))}/></FormGroup>
            <FormGroup label="habit name"><AutoFocusInput style={S.input} placeholder="e.g. Journaled" value={newHabit.name} onChange={e=>setNewHabit(h=>({...h,name:e.target.value}))}/></FormGroup>
          </FormRow>
        )}
        <FormRow>
          <FormGroup label="target count"><input style={S.input} type="number" inputMode="numeric" min={1} value={newHabit.target} onChange={e=>setNewHabit(h=>({...h,target:e.target.value}))}/></FormGroup>
          <FormGroup label="resets">
            <select style={S.select} value={newHabit.cadence} onChange={e=>setNewHabit(h=>({...h,cadence:e.target.value}))}>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
              <option value="ongoing">ongoing (no reset)</option>
            </select>
          </FormGroup>
        </FormRow>
        <div style={{height:4}}/>
      </div>
    </Modal>
  );
}

// ── PeriodAdjNotif — cross-period adjustment banner ──────────────────────────
function PeriodAdjNotif({ notif, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{...S.sans,fontSize:"0.75rem",background:notif.warning?"#c8a88218":"#8fa44a18",border:`1px solid ${notif.warning?"#c8a88266":"#8fa44a44"}`,borderRadius:10,padding:"10px 13px",marginBottom:12,display:"flex",flexDirection:"column",gap:6}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span>{notif.warning?"⚠️":"↕"}</span>
        <div style={{flex:1,color:notif.warning?"#7a5c2e":"#4a5c2e",fontWeight:500}}>
          {notif.items.length} item{notif.items.length!==1?"s":""} adjusted to match monthly budget
          {notif.warning&&<div style={{fontWeight:400,fontSize:"0.68rem",marginTop:2}}>{notif.warning}</div>}
        </div>
        <button onClick={()=>setExpanded(e=>!e)} style={{...S.sans,fontSize:"0.65rem",color:"#7a5c3a",background:"none",border:"none",cursor:"pointer"}}>{expanded?"▲ hide":"▼ details"}</button>
        <button onClick={onDismiss} style={{background:"none",border:"none",cursor:"pointer",color:"#7a5c3a",fontSize:"0.9rem"}}>✕</button>
      </div>
      {expanded&&(
        <div style={{display:"flex",flexDirection:"column",gap:4,paddingLeft:24}}>
          {notif.items.map(({key,oldAmt,newAmt})=>(
            <div key={key} style={{display:"flex",justifyContent:"space-between",color:"#5a6a3e",fontSize:"0.7rem"}}>
              <span style={{textTransform:"capitalize"}}>{key}</span>
              <span>{fmt(oldAmt)} → <strong>{fmt(newAmt)}</strong></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MonthView — stable top-level component (not nested in App) ───────────────
function MonthView({ p1txs, p2txs, income, cats, pBudgets, actBudg, curMonth, yearPlan,
  goals, getPace, accounts, showMonthBE, setShowMonthBE, setShowLI,
  delTx, editTx, orderedCats, catOrder, setCatOrder, setMIncome, setPBudgets,
  setPPay, setYearPlan, txSpend }) {

  const allMonthTxs = [...p1txs, ...p2txs];
  const totalSpent  = allMonthTxs.filter(t=>!t._isDeposit).reduce((s,t)=>s+txSpend(t),0);
  const left = income - totalSpent;
  const over = left < 0;

  // Aggregate budgets for the whole month
  const monthBudget = {};
  const allItems = [...new Set(Object.values(cats).flatMap(c=>c.items))];
  allItems.forEach(item=>{
    const b1 = (pBudgets[`${curMonth}_first`]?.[item]) ?? (actBudg[item]/2);
    const b2 = (pBudgets[`${curMonth}_second`]?.[item]) ?? (actBudg[item]/2);
    monthBudget[item] = Math.round((b1 + b2) * 100) / 100;
  });
  Object.keys(goals).forEach(gk=>{
    const monthly = yearPlan[gk]?.[curMonth] ?? getPace(gk).pace ?? 0;
    monthBudget[gk] = monthly;
  });

  return (
    <>
      <StickyMoneyLeft spent={totalSpent} budget={income} label={`${MONTHS[curMonth]} · money left`}/>
      <div className="g3">
        <Card><Label>monthly income</Label><div className="cv g">{fmt(income)}</div><div className="cs">full month</div></Card>
        <Card><Label>total spent</Label><div className="cv">{fmt(totalSpent)}</div><div className="cs">{allMonthTxs.length} transactions</div></Card>
        <Card><Label>left</Label><div className={`cv ${over?"r":"g"}`}>{over?"-":""}{fmt(Math.abs(left))}</div><div className="cs">{over?"over 😬":"on track ✨"}</div></Card>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{...S.serif,fontSize:"1.05rem"}}>monthly budget</div>
        <div style={{display:"flex",gap:6}}>
          <BtnSm onClick={()=>setShowLI(true)}>⚙️ categories</BtnSm>
          <BtnSm onClick={()=>setShowMonthBE(true)}>✏️ edit budget</BtnSm>
        </div>
      </div>

      {orderedCats.map(key=>{
        const cat = cats[key]; if(!cat) return null;
        return (
          <div key={key} style={{marginBottom:18}}>
            <div style={{...S.sans,fontSize:"0.67rem",fontWeight:600,letterSpacing:"0.09em",textTransform:"uppercase",color:"#4a3020",marginBottom:7}}>{cat.label}</div>
            <Card style={{padding:"7px 13px"}}>
              {cat.items.map(item=>{
                const b = monthBudget[item]||0;
                const itemTxs = allMonthTxs.filter(t=>t.category===item);
                const s = itemTxs.filter(t=>!t._isDeposit).reduce((a,t)=>a+txSpend(t),0);
                const left = b-s;
                const isOver = s>b&&b>0;
                const isPaid = b>0&&s>=b&&!isOver;
                return (
                  <div key={item} className="brow" style={{
                    background:isPaid?"rgba(143,170,139,0.08)":"transparent",
                    padding:"6px 13px",transition:"background 0.2s"}}>
                    <div className="bn" style={{color:isPaid?"#4a6b42":undefined,opacity:isPaid?0.8:1}}>
                      {isPaid&&<span style={{marginRight:5,fontSize:"0.65rem"}}>✓</span>}
                      {item}
                    </div>
                    {b>0&&<div className="bbar"><div style={{height:"100%",width:`${Math.min(pct(s,b),100)}%`,background:isOver?"#b85050":isPaid?"#6b8f64":"#c8a882",borderRadius:3,transition:"width 0.3s"}}/></div>}
                    <div className={`bamt${isOver?" ov":""}`} style={{color:isPaid?"#4a6b42":undefined}}>
                      {b>0
                        ? (isOver
                            ? <>{fmt(Math.abs(left))} over<span style={{opacity:0.55}}> · {fmt(b)} budget</span></>
                            : <>{fmt(left)} left<span style={{opacity:0.55}}> of {fmt(b)}</span></>)
                        : fmt(s)}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        );
      })}

      <div className="div"/>
      <div style={{...S.serif,fontSize:"1.05rem",marginBottom:12}}>all transactions</div>
      <TxList txs={allMonthTxs} accounts={accounts} categories={cats}
        onDelete={id=>{ const inFirst=p1txs.some(t=>t.id===id); delTx(id,inFirst?"first":"second"); }}
        onEdit={(id,upd)=>{ const inFirst=p1txs.some(t=>t.id===id); editTx(id,inFirst?"first":"second",upd); }}/>
      <div className="note">every dollar accounted for 🌿</div>

      {showMonthBE&&(
        <BudgetEditorModal
          title={`${MONTHS[curMonth]} · full month`}
          income={income}
          budgets={monthBudget}
          categories={cats}
          catOrder={catOrder}
          goalKeys={Object.keys(goals)}
          getGoalPace={(gk)=>getPace(gk)}
          onReset={null}
          onSave={(db, inc, newCatOrder)=>{
            setMIncome(p=>({...p,[curMonth]:inc}));
            const parsed={};
            for(const [k,v] of Object.entries(db)) parsed[k]=parseFloat(v)||0;
            const goalKeysSet = new Set(Object.keys(goals));
            goalKeysSet.forEach(gk=>{
              if(parsed[gk]!=null) setYearPlan(prev=>({...prev,[gk]:{...(prev[gk]||{}),[curMonth]:parsed[gk]}}));
            });
            const nonGoal={};
            Object.entries(parsed).forEach(([k,v])=>{ if(!goalKeysSet.has(k)) nonGoal[k]=v; });
            const b1={}, b2={};
            Object.entries(nonGoal).forEach(([k,v])=>{ b1[k]=Math.round(v/2*100)/100; b2[k]=Math.round(v/2*100)/100; });
            setPBudgets(prev=>({...prev,[`${curMonth}_first`]:{...(prev[`${curMonth}_first`]||{}),...b1},[`${curMonth}_second`]:{...(prev[`${curMonth}_second`]||{}),...b2}}));
            setPPay(prev=>({...prev,[`${curMonth}_first`]:Math.round(inc/2),[`${curMonth}_second`]:Math.round(inc/2)}));
            if(newCatOrder) setCatOrder(newCatOrder);
            setShowMonthBE(false);
          }}
          onClose={()=>setShowMonthBE(false)}/>
      )}
    </>
  );
}

// ── PaymentPlanModalInner — proper component so hooks work ───────────────────
function PaymentPlanModalInner({ paymentPlanModal, loans, now, curMonth, MONTHS, fmt, S, addToRolloverPlan, setLoans, onClose }) {
  const { account, remaining, existingPlanKey } = paymentPlanModal;
  const existingPlan = existingPlanKey ? loans[existingPlanKey] : null;
  const [months, setMonths] = React.useState(existingPlan?.months||3);
  const monthly = Math.ceil(remaining / months);
  const deadline = new Date(now.getFullYear(), now.getMonth()+months, 1)
    .toLocaleDateString("en-US",{month:"long",year:"numeric"});
  return (
    <Modal title={`💳 ${account.name} payment plan`} onClose={onClose}
      footer={
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button style={S.btnGhost} onClick={onClose}>cancel</button>
          <button style={S.btnPrimary} onClick={()=>{
            const key = addToRolloverPlan(account.id, existingPlan ? 0 : remaining, account.name);
            setLoans(p=>({...p,[key]:{...p[key],monthlyPayment:monthly,months}}));
            onClose();
          }}>
            {existingPlan?"update plan":"create plan"}
          </button>
        </div>
      }>
      <div style={{padding:"16px 0",display:"flex",flexDirection:"column",gap:16}}>
        <div style={{background:"#f0e8dc",borderRadius:10,padding:"12px 14px"}}>
          <div style={{...S.sans,fontSize:"0.67rem",color:"#7a5c3a",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>still owed</div>
          <div style={{...S.serif,fontSize:"1.8rem",color:"#1e140a"}}>{fmt(remaining)}</div>
        </div>
        <div>
          <div style={{...S.sans,fontSize:"0.72rem",fontWeight:500,color:"#7a5c3a",marginBottom:8}}>pay off in how many months?</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setMonths(m=>Math.max(1,m-1))} style={{...S.btnGhost,padding:"6px 12px",fontSize:"1.1rem"}}>−</button>
            <div style={{...S.serif,fontSize:"1.4rem",flex:1,textAlign:"center"}}>{months} month{months!==1?"s":""}</div>
            <button onClick={()=>setMonths(m=>m+1)} style={{...S.btnGhost,padding:"6px 12px",fontSize:"1.1rem"}}>+</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:"rgba(248,242,228,0.9)",border:"0.5px solid rgba(210,195,165,0.5)",borderRadius:10,padding:"12px"}}>
            <div style={{...S.sans,fontSize:"0.65rem",color:"#7a5c3a",marginBottom:3}}>per month</div>
            <div style={{...S.serif,fontSize:"1.2rem",color:"#6b7c3f"}}>{fmt(monthly)}</div>
          </div>
          <div style={{background:"rgba(248,242,228,0.9)",border:"0.5px solid rgba(210,195,165,0.5)",borderRadius:10,padding:"12px"}}>
            <div style={{...S.sans,fontSize:"0.65rem",color:"#7a5c3a",marginBottom:3}}>paid off by</div>
            <div style={{...S.serif,fontSize:"1rem",color:"#1e140a"}}>{deadline}</div>
          </div>
        </div>
        <div style={{...S.sans,fontSize:"0.72rem",color:"#7a5c3a",fontStyle:"italic"}}>
          this plan will appear in your Loans section and track payments to {account.name} automatically.
        </div>
      </div>
    </Modal>
  );
}

// ── RightPanel — desktop context panel ───────────────────────────────────────
function RightPanel({ view, period, isMobile, accounts, goals, goalOrder, loans,
  txns, txSpend, curMonth, mk, ptxs, allTxs, habits, now,
  onDeposit, onAddTx, getPace, fmt, GREEN }) {

  if (isMobile) return null;

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const today  = now.toISOString().split("T")[0];

  // Mood ring mini — compute segments
  const FEEL_COLORS = { happy:"#8faa8b", necessary:"#c8a882", guilty:"#c8906e", regretted:"#b85050" };
  const validTxs = (ptxs||[]).filter(t=>!t._isDeposit&&t.feeling);
  const grand = validTxs.reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const cx=60, cy=60, R=44, r=28;
  function arc(pct, startAngle) {
    const angle = pct * 2 * Math.PI;
    const x1 = cx + R*Math.sin(startAngle), y1 = cy - R*Math.cos(startAngle);
    const x2 = cx + R*Math.sin(startAngle+angle), y2 = cy - R*Math.cos(startAngle+angle);
    const x3 = cx + r*Math.sin(startAngle+angle), y3 = cy - r*Math.cos(startAngle+angle);
    const x4 = cx + r*Math.sin(startAngle), y4 = cy - r*Math.cos(startAngle);
    const lg = angle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${lg} 0 ${x4} ${y4} Z`;
  }
  let startAngle = 0;
  const segs = Object.entries(FEEL_COLORS).map(([v,color])=>{
    const tot = validTxs.filter(t=>t.feeling===v).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
    const pct = grand>0 ? tot/grand : 0;
    const d = pct>0 ? arc(pct, startAngle) : null;
    startAngle += pct * 2 * Math.PI;
    return { v, color, pct, tot, d };
  }).filter(s=>s.d);

  // Stats by view
  const liquid   = accounts.filter(a=>a.type!=="credit").reduce((s,a)=>s+a.balance,0);
  const ccDebt   = accounts.filter(a=>a.type==="credit").reduce((s,a)=>s+a.balance,0);
  const loanDebt = Object.values(loans).reduce((s,l)=>s+Math.max(0,(l.target||0)-(l.paid||0)),0);
  const net      = liquid - ccDebt - loanDebt;
  const mTxs     = [...(txns[`${curMonth}_first`]||[]),...(txns[`${curMonth}_second`]||[])];
  const spent    = mTxs.filter(t=>!t._isDeposit).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const habitsToday = habits.filter(h=>(h.logs||[]).includes(today)).length;
  const activeGoals = (goalOrder||[]).filter(k=>goals[k]&&(goals[k].saved||0)<(goals[k].target||1));

  return (
    <div className="right-panel">
      {/* Action buttons — always shown */}
      <div className="rp-section" style={{display:"flex",flexDirection:"column",gap:7}}>
        <button onClick={onDeposit}
          style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.78rem",fontWeight:500,
            padding:"9px 12px",borderRadius:9,border:"none",background:GREEN,
            color:"#faf6f0",cursor:"pointer",textAlign:"left"}}>
          + deposit
        </button>
        <button onClick={onAddTx}
          style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.78rem",fontWeight:500,
            padding:"9px 12px",borderRadius:9,border:"1.5px solid #e0d0be",
            background:"transparent",color:"#5a3e2b",cursor:"pointer",textAlign:"left"}}>
          + log transaction
        </button>
      </div>

      {/* Budget tab — money left + mood ring */}
      {(view==="tracker") && (<>
        <div className="rp-section">
          <div className="rp-label">this period</div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.6rem",
            color:net>=0?"#8faa8b":"#b85050",lineHeight:1,marginBottom:2}}>
            {fmt(Math.abs((ptxs||[]).filter(t=>!t._isDeposit).reduce((s,t)=>s+(parseFloat(t.amount)||0),0)))}
          </div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.68rem",color:"#7a5c3a"}}>
            spent · {period==="first"?"1st–15th":"16th–end"}
          </div>
        </div>
        <div className="rp-section">
          <div className="rp-label">mood ring</div>
          {grand > 0 ? (
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <svg width="80" height="80" viewBox="0 0 120 120" style={{flexShrink:0}}>
                {segs.map(sg=>(
                  <path key={sg.v} d={sg.d} fill={sg.color} opacity={0.9}/>
                ))}
                <text x={cx} y={cy-4} textAnchor="middle" style={{fontFamily:"'DM Serif Display',serif",fontSize:"10px",fill:"#2c2116"}}>{fmt(grand)}</text>
                <text x={cx} y={cy+8} textAnchor="middle" style={{fontFamily:"'DM Sans',sans-serif",fontSize:"7px",fill:"#a8906e"}}>{validTxs.length} tx</text>
              </svg>
              <div style={{display:"flex",flexDirection:"column",gap:5,flex:1}}>
                {segs.map(sg=>(
                  <div key={sg.v} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:sg.color,flexShrink:0}}/>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.65rem",color:"#2a1f14",flex:1}}>{sg.v}</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.65rem",color:"#7a5c3a"}}>{(sg.pct*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#8a6848",fontStyle:"italic"}}>
              no transactions yet
            </div>
          )}
        </div>
      </>)}

      {/* Home tab — pinned goals */}
      {view==="home" && (<>
        <div className="rp-section">
          <div className="rp-label">pinned goals</div>
          {activeGoals.slice(0,4).map(k=>{
            const g = goals[k];
            const pct = Math.min(100, Math.round(((g.saved||0)/(g.target||1))*100));
            return (
              <div key={k} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#1e140a",fontWeight:500}}>
                    {g.emoji||"🎯"} {k}
                  </span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.65rem",color:"#8faa8b"}}>{pct}%</span>
                </div>
                <div style={{height:4,background:"#f0e8dc",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#8fa44a,#4f5e2a)",borderRadius:2}}/>
                </div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.62rem",color:"#8a6848",marginTop:2}}>
                  {fmt(g.saved||0)} / {fmt(g.target||0)}
                </div>
              </div>
            );
          })}
          {activeGoals.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#8a6848",fontStyle:"italic"}}>no active goals</div>}
        </div>
        <div className="rp-section">
          <div className="rp-label">habits today</div>
          {habits.length===0 ? (
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#8a6848",fontStyle:"italic"}}>no habits set up</div>
          ) : (
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.4rem",color:"#8a5c2a"}}>
              {habitsToday}/{habits.length}
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.68rem",color:"#7a5c3a",marginLeft:6}}>punched in</span>
            </div>
          )}
        </div>
      </>)}

      {/* Accounts tab — net worth breakdown */}
      {view==="accounts" && (<>
        <div className="rp-section">
          <div className="rp-label">net position</div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.6rem",
            color:net>=0?"#8faa8b":"#b85050",lineHeight:1,marginBottom:4}}>
            {net<0?"-":""}{fmt(Math.abs(net))}
          </div>
          {[
            {label:"liquid",val:liquid,color:"#8faa8b"},
            {label:"credit card",val:ccDebt,color:"#c88b8b"},
            {label:"loans",val:loanDebt,color:"#c88b8b"},
          ].map(({label,val,color})=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid #f0e8dc"}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.7rem",color:"#7a5c3a"}}>{label}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.7rem",color}}>{fmt(val)}</span>
            </div>
          ))}
        </div>
        <div className="rp-section">
          <div className="rp-label">this month</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.7rem",color:"#7a5c3a"}}>spent</span>
            <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"0.9rem",color:"#b85050"}}>{fmt(spent)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.7rem",color:"#7a5c3a"}}>accounts</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.7rem",color:"#1e140a"}}>{accounts.length}</span>
          </div>
        </div>
      </>)}

      {/* Goals tab — goal progress */}
      {view==="intentions" && (<>
        <div className="rp-section">
          <div className="rp-label">goals overview</div>
          {activeGoals.slice(0,5).map(k=>{
            const g = goals[k];
            const pace = getPace(k);
            const pct = Math.min(100, Math.round(((g.saved||0)/(g.target||1))*100));
            return (
              <div key={k} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.7rem",color:"#1e140a",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"120px"}}>
                    {g.emoji||"🎯"} {k}
                  </span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.62rem",
                    color:pace.status==="on_track"?"#8faa8b":pace.status==="urgent"?"#b85050":"#c8a882",
                    flexShrink:0,marginLeft:4}}>
                    {pace.status==="done"?"✓":pace.status==="on_track"?"on track":pace.status==="urgent"?"urgent":pace.status}
                  </span>
                </div>
                <div style={{height:4,background:"#f0e8dc",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#8fa44a,#4f5e2a)",borderRadius:2}}/>
                </div>
              </div>
            );
          })}
          {activeGoals.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#8a6848",fontStyle:"italic"}}>all goals complete 🎉</div>}
        </div>
        <div className="rp-section">
          <div className="rp-label">habits today</div>
          {habits.length===0 ? (
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",color:"#8a6848",fontStyle:"italic"}}>no habits set up</div>
          ) : habits.map(h=>{
            const done = (h.logs||[]).includes(today);
            return (
              <div key={h.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                <span style={{fontSize:"0.9rem"}}>{h.emoji||"🌱"}</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.7rem",color:done?"#8faa8b":"#a8906e",flex:1}}>{h.name}</span>
                {done&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.62rem",color:"#8faa8b"}}>✓</span>}
              </div>
            );
          })}
        </div>
      </>)}
    </div>
  );
}

export { PACHIRA_CSS };
export default function App() {
  const now = new Date();
  const todayDay = now.getDate();
  const autoPeriod = todayDay <= 15 ? "first" : "second";

  // ── Persisted state ────────────────────────────────────────────────────────
  const [txns,      setTxns]      = useState(DEF_TXNS);
  const [accounts,  setAccounts]  = useState(DEF_ACCOUNTS);
  const [goals,     setGoals]     = useState(DEF_GOALS);
  const [loans,     setLoans]     = useState(DEF_LOANS);
  const [cats,      setCats]      = useState(DEF_CATS);
  const [catOrder,  setCatOrder]  = useState(["essentials","savings","loans","misc"]);
  const [archived,  setArchived]  = useState({});
  const [goalOrder, setGoalOrder] = useState(["emergency fund","summer trip","new laptop"]);
  const [mBudgets,  setMBudgets]  = useState({});
  const [mIncome,   setMIncome]   = useState({});
  const [pBudgets,  setPBudgets]  = useState({});
  const [pPay,      setPPay]      = useState({});
  const [splitRules, setSplitRules] = useState({}); // {itemKey:{firstAmt,secondAmt,monthlyAtSave,sticky}}
  const [curMonth,  setCurMonth]  = useState(now.getMonth());
  const [habits,    setHabits]    = useState([]);   // [{id,name,emoji,target,cadence,logs:[dateStr]}]
  const [deferred,  setDeferred]  = useState([]);   // [{id,name,price,priceMax,notes,addedAt}]
  const [yearPlan,  setYearPlan]  = useState({});   // {rowKey: {0..11: plannedAmt}} for manual essentials rows
  const [hasStoredData, setHasStoredData] = useState(false); // true if real saved data exists
  const [loaded,    setLoaded]    = useState(false);
  const [isMobile,  setIsMobile]  = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 1024;
  });
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handler);
    handler(); // re-check after mount
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Ephemeral state ────────────────────────────────────────────────────────
  const [view,         setView]         = useState("home");
  const [period,       setPeriod]       = useState(autoPeriod); // for tracker
  const [pinnedBudgetItems, setPinnedBudgetItems] = useState([]); // [categoryItem] max 4
  const [periodSwitchConfirm, setPeriodSwitchConfirm] = useState(null); // {targetPeriod, targetLabel}
  const [ovPeriod,     setOvPeriod]     = useState(autoPeriod); // for overview
  const [showAddTx,    setShowAddTx]    = useState(false);
  const [expAcct,      setExpAcct]      = useState(null);
  const [showBE,       setShowBE]       = useState(null);
  const [showGoalM,    setShowGoalM]    = useState(null);
  const [goalDraft,    setGoalDraft]    = useState({});
  const [reallocGoal,  setReallocGoal]  = useState(null); // key of goal being deleted
  const [showAG,       setShowAG]       = useState(false);
  const [newG,         setNewG]         = useState({name:"",emoji:"🎯",target:"",saved:"",priority:"mid",deadline:"",monthly:"",linkedCategories:[],linkedAccount:""});
  const [showAL,       setShowAL]       = useState(false);
  const [newL,         setNewL]         = useState({name:"",emoji:"📋",target:"",paid:"",priority:"mid",deadline:"",monthly:"",notes:""});
  const [showAA,       setShowAA]       = useState(false);
  const [newA,         setNewA]         = useState({name:"",label:"Checking",type:"checking",balance:"",creditLimit:"",notes:""});
  const [showArch,     setShowArch]     = useState(false);
  const [dragG,        setDragG]        = useState(null);
  const [dragGOver,    setDragGOver]    = useState(null);
  const [editLoan,     setEditLoan]     = useState(null);
  const [loanDraft,    setLoanDraft]    = useState({paid:"",target:""});
  const [showLI,       setShowLI]       = useState(false);
  const [liDraft,      setLiDraft]      = useState(null);
  const [liBudgets,    setLiBudgets]    = useState(null);
  const [liInputs,     setLiInputs]     = useState({});
  const [showHabitM,   setShowHabitM]   = useState(false);
  const [newHabit,     setNewHabit]     = useState({name:"",emoji:"✨",target:10,cadence:"monthly"});
  const [habitComplete,setHabitComplete]= useState(null);
  const [pinnedTreats, setPinnedTreats] = useState([]); // [{id,name,price,priceMax,emoji,notes}] max 3
  const [fromHabitCelebration, setFromHabitCelebration] = useState(false); // true = arrived at wishlist from celebration
  const [removePrompt, setRemovePrompt] = useState(null); // {treat} — shown when removing pinned treat from home
  const [paymentPlanModal, setPaymentPlanModal] = useState(null); // {account, remaining, existingLoanKey}
  const [planPrompt,       setPlanPrompt]       = useState(null); // {loanKey, shortfall, monthlyPayment}
  const [overpayPrompt,    setOverpayPrompt]    = useState(null); // {loanKey, extra, monthlyPayment}
  const [lastCheckedPeriod,setLastCheckedPeriod]= useState(""); // "YYYY-M-first|second"
  const [archiveGoal,  setArchiveGoal]  = useState(null);
  const [winCelebration, setWinCelebration] = useState(null);
  const [recentWins, setRecentWins] = useState([]); // [{type,key,name,emoji,amount,at}] shown on home // {type:"goal"|"loan", key, name, emoji, amount}
  const [editPay,      setEditPay]      = useState(false);
  const [editPayVal,   setEditPayVal]   = useState("");
  const [heroIdx,      setHeroIdx]      = useState(0);
  const [showAddDeferred, setShowAddDeferred] = useState(false);
  const [newDeferred,     setNewDeferred]     = useState({name:"",price:"",priceMax:"",notes:""});
  const [buyDeferred,     setBuyDeferred]     = useState(null);
  const [treatTxPrefill,  setTreatTxPrefill]  = useState(null); // {note, amount} for pre-filling add tx
  const [deferredSort,    setDeferredSort]    = useState("date-desc");
  const [intentionsTab,   setIntentionsTab]   = useState("goals");
  const [showAddTxPage,       setShowAddTxPage]       = useState(false);
  const [showDeposit,         setShowDeposit]         = useState(false);
  const [showMonthBE,  setShowMonthBE]  = useState(false);
  const [yearMode,            setYearMode]            = useState("detailed");
  const [selectedReviewMonth, setSelectedReviewMonth] = useState(null); // 0-11 | null
  const [accountsProgressMode, setAccountsProgressMode] = useState("month"); // "month"|"ytd"
  const [accountsProgressItems, setAccountsProgressItems] = useState({savings:true,goals:true,loans:true});
  const [yearNewGoalHL,       setYearNewGoalHL]       = useState(null);
  const [yearPressureSheet,   setYearPressureSheet]   = useState(null);
  const [yearPressureSel,     setYearPressureSel]     = useState({});
  const [yearBarDrag,         setYearBarDrag]         = useState(null);
  const [yearLivePlan,        setYearLivePlan]        = useState(null);
  const [periodAdjNotif, setPeriodAdjNotif] = useState(null); // {period, items:[{key,oldAmt,newAmt}], warning?}
  const prevViewRef = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);
  useEffect(() => {
    loadData().then(d => {
      if (d && Object.keys(d).length > 0) {
        setHasStoredData(true);
        if (d.txns && Object.keys(d.txns).length > 0) setTxns(d.txns);
        if (d.accounts)  setAccounts(d.accounts);
        if (d.goals)     setGoals(d.goals);
        if (d.loans)     setLoans(d.loans);
        if (d.cats)      setCats(d.cats);
        if (d.catOrder)  setCatOrder(d.catOrder);
        if (d.archived)  setArchived(d.archived);
        if (d.goalOrder) setGoalOrder(d.goalOrder);
        if (d.mBudgets)  setMBudgets(d.mBudgets);
        if (d.mIncome)   setMIncome(d.mIncome);
        if (d.pBudgets)  setPBudgets(d.pBudgets);
        if (d.pPay)      setPPay(d.pPay);
        if (d.curMonth!==undefined) setCurMonth(d.curMonth);
        if (d.habits)       setHabits(d.habits);
        if (d.deferred)     setDeferred(d.deferred);
        if (d.pinnedTreats) setPinnedTreats(d.pinnedTreats);
        if (d.recentWins)  setRecentWins(d.recentWins.filter(w=>Date.now()-w.at < 24*60*60*1000));
        if (d.pinnedBudgetItems) setPinnedBudgetItems(d.pinnedBudgetItems);
        if (d.yearPlan)  setYearPlan(d.yearPlan);
        if (d.splitRules) setSplitRules(d.splitRules);
      }
      setLoaded(true);
    });
  }, []);

  // ── Save (debounced) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() =>
      saveData({txns,accounts,goals,loans,cats,catOrder,archived,goalOrder,mBudgets,mIncome,pBudgets,pPay,curMonth,habits,deferred,yearPlan,splitRules,pinnedTreats,recentWins,pinnedBudgetItems}), 700);
    return () => clearTimeout(timerRef.current);
  }, [loaded,txns,accounts,goals,loans,cats,catOrder,archived,goalOrder,mBudgets,mIncome,pBudgets,pPay,curMonth,habits,deferred,yearPlan,splitRules]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const income   = mIncome[curMonth] ?? DEF_INCOME;
  const actBudg  = {...DEF_BUDGETS, ...(mBudgets[curMonth]||{})};
  const defPay   = Math.round(income/2);
  const mk       = String(curMonth);
  const p1txs    = txns[`${mk}_first`]||[];
  const p2txs    = txns[`${mk}_second`]||[];
  const allTxs   = [...p1txs,...p2txs];
  const allCatItems = [...new Set(Object.values(cats).flatMap(c=>c.items))];
  const orderedCats = catOrder.filter(k=>cats[k]);

  // getMonthlyAmt — wrapper around exported pure function
  function getMonthlyAmt(itemKey) {
    if (goals[itemKey]) {
      return yearPlan[itemKey]?.[curMonth] ?? getPace(itemKey).pace ?? 0;
    }
    return actBudg[itemKey] ?? 0;
  }

  // getStaleSplitRule — wrapper
  function getStaleSplitRule(itemKey) {
    return BL.getStaleSplitRule(itemKey, { splitRules, getMonthlyAmt });
  }

  function getPB(p) {
    return BL.getPB(p, { actBudg, pBudgets, curMonth, goals, yearPlan, splitRules, getPace });
  }
  function getPay(p) { return BL.getPay(p, { pPay, curMonth, defPay }); }

  function getRollovers() {
    return BL.getRollovers({ accounts, txns, curMonth });
  }

  // ── Transaction mutations ─────────────────────────────────────────────────
  function addTx(tx, p) {
    const key = `${mk}_${p}`;
    const newTx = {...tx, id:uid(), createdAt: Date.now()};
    setTxns(prev=>({...prev,[key]:[...(prev[key]||[]),newTx]}));

    const amt = parseFloat(tx.amount)||0;
    const money_flow = tx.money_flow || (tx.txType==="payment" ? "debt_payment" : "expense");
    const fromId = tx.from_account_id || tx.account;
    const toId   = tx.to_account_id||null;

    // Always deduct from source account
    if (fromId) {
      setAccounts(prev=>prev.map(a=>{
        if (a.id!==fromId) return a;
        // If from_account is a credit card and this is an expense (charge), increase balance
        if (a.type==="credit" && money_flow==="expense") return {...a, balance: a.balance+amt};
        // Otherwise decrease (paying from checking/savings, or paying off credit)
        return {...a, balance: Math.max(0, a.balance-amt)};
      }));
    }

    // Apply to destination account if present
    if (toId) {
      setAccounts(prev=>prev.map(a=>{
        if (a.id!==toId) return a;
        if (a.type==="credit") return {...a, balance: Math.max(0, a.balance-amt)}; // debt reduced
        return {...a, balance: a.balance+amt}; // savings/checking increases
      }));
    }

    // Auto-update goal committed if category linked (all flow types)
    setGoals(prev=>{
      const updated={...prev};
      Object.entries(updated).forEach(([gk,g])=>{
        if((g.linkedCategories||[]).includes(tx.category)){
          const newSaved = (g.saved||0)+amt;
          updated[gk]={...g,saved:newSaved};
          // Goal reached!
          if (newSaved >= (g.target||Infinity) && (g.saved||0) < (g.target||Infinity)) {
            setTimeout(()=>{ const w={type:"goal",key:gk,name:gk,emoji:g.emoji||"🎯",amount:g.target,at:Date.now()}; setWinCelebration(w); setRecentWins(p=>[w,...p].slice(0,5)); }, 500);
          }
        }
      });
      return updated;
    });

    // If debt_payment and category matches a loan name, update loan paid amount
    if (money_flow==="debt_payment") {
      setLoans(prev=>{
        const cat = tx.category?.toLowerCase();
        if (!prev[cat]) return prev;
        const newPaid = Math.min((prev[cat].paid||0)+amt, prev[cat].target||Infinity);
        // Loan paid off!
        if (newPaid >= (prev[cat].target||Infinity) && (prev[cat].paid||0) < (prev[cat].target||Infinity)) {
          setTimeout(()=>{ const w={type:"loan",key:cat,name:cat,emoji:"💳",amount:prev[cat].target,at:Date.now()}; setWinCelebration(w); setRecentWins(p=>[w,...p].slice(0,5)); }, 500);
        }
        return {...prev, [cat]:{...prev[cat], paid:newPaid}};
      });

      // Also update rollover plan loan tied to the destination account
      if (toId) {
        const planKey = getRolloverPlanKey(toId);
        if (planKey) {
          setLoans(prev=>{
            const loan = prev[planKey];
            if (!loan) return prev;
            const newPaid = Math.min((loan.paid||0)+amt, loan.target||Infinity);
            // Check for overpayment vs monthly plan
            const mp = loan.monthlyPayment || 0;
            const expectedPerPeriod = mp / 2;
            if (amt > expectedPerPeriod + 1 && newPaid < loan.target) {
              const extra = amt - expectedPerPeriod;
              setTimeout(()=>setOverpayPrompt({loanKey:planKey, loanName:loan.notes||"credit card plan", extra, monthlyPayment:mp, newPaid, target:loan.target}), 400);
            }
            // Loan paid off!
            if (newPaid >= (loan.target||Infinity) && (loan.paid||0) < (loan.target||Infinity)) {
              setTimeout(()=>{ const w={type:"loan",key:planKey,name:loan.notes||"loan",emoji:"💳",amount:loan.target,at:Date.now()}; setWinCelebration(w); setRecentWins(p=>[w,...p].slice(0,5)); }, 500);
            }
            return {...prev, [planKey]:{...loan, paid:newPaid}};
          });
        }
      }
    }
  }
  function delTx(id, p) {
    const key = `${mk}_${p}`;
    // Find the tx before removing
    const tx = (txns[key]||[]).find(t=>t.id===id);
    setTxns(prev=>({...prev,[key]:(prev[key]||[]).filter(t=>t.id!==id)}));
    if (!tx) return;

    const amt       = parseFloat(tx.amount)||0;
    const money_flow = tx.money_flow || (tx.txType==="payment"||tx.txType==="loan_payment" ? "debt_payment" : "expense");
    const fromId    = tx.from_account_id || tx.account;
    const toId      = tx.to_account_id||null;

    // Reverse from_account effect
    if (fromId) {
      setAccounts(prev=>prev.map(a=>{
        if (a.id!==fromId) return a;
        // Credit card expense: just undo the balance increase, don't touch checking
        if (a.type==="credit" && money_flow==="expense") return {...a, balance: Math.max(0, a.balance-amt)};
        // Transfer or debt_payment from checking/savings: restore the balance
        if (a.type!=="credit") return {...a, balance: a.balance+amt};
        return a;
      }));
    }
    // Reverse to_account effect
    if (toId) {
      setAccounts(prev=>prev.map(a=>{
        if (a.id!==toId) return a;
        if (a.type==="credit") return {...a, balance: a.balance+amt}; // debt goes back up
        return {...a, balance: Math.max(0, a.balance-amt)};
      }));
    }
    // Reverse goal committed
    setGoals(prev=>{
      const updated={...prev};
      Object.entries(updated).forEach(([gk,g])=>{
        if((g.linkedCategories||[]).includes(tx.category))
          updated[gk]={...g,saved:Math.max(0,(g.saved||0)-amt)};
      });
      return updated;
    });
    // Reverse loan paid
    if (money_flow==="debt_payment") {
      setLoans(prev=>{
        const cat = tx.category?.toLowerCase();
        if (!prev[cat]) return prev;
        return {...prev,[cat]:{...prev[cat],paid:Math.max(0,(prev[cat].paid||0)-amt)}};
      });
    }
  }
  function editTx(id,p,updated) {
    const key=`${mk}_${p}`;
    setTxns(prev=>({...prev,[key]:(prev[key]||[]).map(t=>t.id===id?{...t,...updated}:t)}));
  }

  // ── Goal deletion with realloc ────────────────────────────────────────────
  function deleteGoal(key) { setReallocGoal(key); }
  function handleRealloc(result) {
    if (result) {
      const {choice,targetGoal,targetAcct,amt} = result;
      if (choice==="goal" && targetGoal) setGoals(p=>({...p,[targetGoal]:{...p[targetGoal],saved:(p[targetGoal].saved||0)+amt}}));
      if (choice==="account" && targetAcct) setAccounts(p=>p.map(a=>a.id===targetAcct?{...a,balance:a.balance+amt}:a));
    }
    const key = reallocGoal;
    setGoals(p=>{ const n={...p}; delete n[key]; return n; });
    setGoalOrder(p=>p.filter(k=>k!==key));
    // Remove from any account's savingsGoals
    setAccounts(p=>p.map(a=>({...a,savingsGoals:(a.savingsGoals||[]).filter(g=>g!==key)})));
    setReallocGoal(null);
  }

  // ── Second-half auto-recalc ───────────────────────────────────────────────
  function recalcSecondHalf(firstBudgets, firstPay) {
    const remaining = income - firstPay;
    const totalFirst = Object.values(firstBudgets).reduce((a,b)=>a+(parseFloat(b)||0),0);
    const unalloc = Math.max(0, firstPay - totalFirst);
    const secondPay = remaining + unalloc;
    const secondBudgets = {};
    for (const [k,v] of Object.entries(actBudg)) secondBudgets[k] = Math.max(0, Math.round((parseFloat(v)||0)/2));
    setPBudgets(p=>({...p,[`${curMonth}_second`]:secondBudgets}));
    setPPay(p=>({...p,[`${curMonth}_second`]:secondPay}));
  }

  function getBillStatus(acct) {
    return (acct.bills||[]).map(bill=>{
      const budgeted = actBudg[bill]||0;
      const paid = allTxs.filter(t=>(t.from_account_id||t.account)===acct.id&&t.category===bill)
        .reduce((s,t)=>s+txSpend(t),0);
      const remaining = Math.max(0,budgeted-paid);
      return {bill,budgeted,paid,remaining,done:budgeted>0&&paid>=budgeted,over:paid>budgeted&&budgeted>0};
    });
  }

  // Called whenever a pinned treat is resolved (bought or removed)
  // Finalizes the habit's prize claim and handles pendingRetire
  // ── Payment plan helpers ──────────────────────────────────────────────────
  function getRolloverPlanKey(accountId) {
    return Object.keys(loans).find(k=>loans[k].isRolloverPlan&&loans[k].linkedAccountId===accountId);
  }

  function addToRolloverPlan(accountId, amount, accountName) {
    const existingKey = getRolloverPlanKey(accountId);
    if (existingKey) {
      // Add to existing plan
      setLoans(p=>({...p,[existingKey]:{...p[existingKey],target:(p[existingKey].target||0)+amount,
        notes:`${accountName} rollover — updated ${new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"})}`}}));
      return existingKey;
    } else {
      // Create new plan
      const key = `rollover_${accountId}_${Date.now()}`;
      setLoans(p=>({...p,[key]:{
        target:amount, paid:0, monthlyPayment:amount, linkedAccountId:accountId,
        emoji:"💳", notes:`${accountName} rollover`, isRolloverPlan:true,
        createdAt:Date.now(), startMonth:curMonth,
      }}));
      return key;
    }
  }

  // Period-flip check — runs when period or month changes
  useEffect(()=>{
    const periodKey = `${now.getFullYear()}-${now.getMonth()}-${autoPeriod}`;
    if (lastCheckedPeriod === periodKey) return;
    setLastCheckedPeriod(periodKey);

    // Check each rollover plan loan for underpayment last period
    Object.entries(loans).forEach(([key, loan])=>{
      if (!loan.isRolloverPlan) return;
      const mp = loan.monthlyPayment || 0;
      if (!mp) return;

      // Expected paid per period = monthlyPayment / 2
      const expectedPerPeriod = mp / 2;
      const prevPeriod = autoPeriod === "first" ? "second" : "first";
      const prevMonth  = autoPeriod === "first" ? (curMonth===0?11:curMonth-1) : curMonth;
      const prevMk     = String(prevMonth);
      const prevTxs    = txns[`${prevMk}_${prevPeriod}`]||[];
      const paidLastPeriod = prevTxs
        .filter(t=>t.money_flow==="debt_payment"&&t.to_account_id===loan.linkedAccountId)
        .reduce((s,t)=>s+t.amount,0);

      const shortfall = expectedPerPeriod - paidLastPeriod;
      if (shortfall > 1 && loan.target - loan.paid > 1) {
        setPlanPrompt({loanKey:key, loanName:loan.notes||"credit card plan", shortfall, monthlyPayment:mp, paidLastPeriod, expectedPerPeriod});
      }
    });
  }, [autoPeriod, curMonth]);

  function resolveTreat(treat) {
    if (treat.fromHabitId) {
      setHabits(p=>p
        .filter(h=>!(h.id===treat.fromHabitId && h.pendingRetire)) // remove if pending retire
        .map(h=>h.id===treat.fromHabitId
          ? {...h, lastPrize:"claimed", celebrationTriggered:false}
          : h
        )
      );
    }
    setPinnedTreats(p=>p.filter(t=>t.id!==treat.id));
  }


  function exportData() {
    const data = {txns,accounts,goals,loans,cats,catOrder,archived,goalOrder,
      mBudgets,mIncome,pBudgets,pPay,curMonth,habits,deferred,yearPlan,
      splitRules,pinnedTreats,recentWins,pinnedBudgetItems};
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    const date = new Date().toISOString().slice(0,10);
    a.href     = url;
    a.download = `pachira-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const d = JSON.parse(e.target.result);
        if (!d.txns && !d.accounts && !d.goals) {
          alert("This doesn\'t look like a Pachira backup file."); return;
        }
        if (!window.confirm("This will replace all current data with the backup. Continue?")) return;
        if (d.txns)              setTxns(d.txns);
        if (d.accounts)          setAccounts(d.accounts);
        if (d.goals)             setGoals(d.goals);
        if (d.loans)             setLoans(d.loans);
        if (d.cats)              setCats(d.cats);
        if (d.catOrder)          setCatOrder(d.catOrder);
        if (d.archived)          setArchived(d.archived);
        if (d.goalOrder)         setGoalOrder(d.goalOrder);
        if (d.mBudgets)          setMBudgets(d.mBudgets);
        if (d.mIncome)           setMIncome(d.mIncome);
        if (d.pBudgets)          setPBudgets(d.pBudgets);
        if (d.pPay)              setPPay(d.pPay);
        if (d.curMonth != null)  setCurMonth(d.curMonth);
        if (d.habits)            setHabits(d.habits);
        if (d.deferred)          setDeferred(d.deferred);
        if (d.yearPlan)          setYearPlan(d.yearPlan);
        if (d.splitRules)        setSplitRules(d.splitRules);
        if (d.pinnedTreats)      setPinnedTreats(d.pinnedTreats);
        if (d.recentWins)        setRecentWins(d.recentWins);
        if (d.pinnedBudgetItems) setPinnedBudgetItems(d.pinnedBudgetItems);
        alert("\u2713 Backup restored successfully!");
      } catch(err) {
        alert("Couldn\'t read that file. Make sure it\'s a valid Pachira backup.");
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    if(!window.confirm("Reset to demo data? Your entries will be cleared.")) return;
    saveData({}).then(()=>{
      setTxns(DEF_TXNS); setAccounts(DEF_ACCOUNTS); setGoals(DEF_GOALS); setLoans(DEF_LOANS);
      setCats(DEF_CATS); setCatOrder(["essentials","savings","loans","misc"]); setArchived({});
      setGoalOrder(["emergency fund","summer trip","new laptop"]); setMBudgets({}); setMIncome({});
      setPBudgets({}); setPPay({}); setCurMonth(now.getMonth()); setYearPlan({});
    });
  }

  // ── Pace engine ───────────────────────────────────────────────────────────
  function suggestedPace(g, txnsSnapshot) {
    return BL.suggestedPace(g, txnsSnapshot || txns, { now, txSpend: BL.txSpend });
  }

  // Memoized pace results — recomputes only when goals or txns change
  const paceMemo = useMemo(() => {
    const snap = txns;
    const result = {};
    Object.entries(goals).forEach(([k, g]) => {
      result[k] = suggestedPace(g, snap);
    });
    return result;
  }, [goals, txns]); // eslint-disable-line react-hooks/exhaustive-deps

  // Convenience wrapper — uses memo when available
  function getPace(goalKey) {
    return paceMemo[goalKey] || suggestedPace(goals[goalKey] || {});
  }

  // ── Deposit handler ────────────────────────────────────────────────────────
  function logDeposit(splits, notes, date) {
    // splits: [{accountId, amount}]
    const totalAmt = splits.reduce((s,x)=>s+x.amount, 0);
    const depositDate = date || new Date().toISOString().split("T")[0];
    const day = parseInt(depositDate.split("-")[2]);
    const depositMonth = parseInt(depositDate.split("-")[1]) - 1; // 0-indexed
    const pp = day <= 15 ? "first" : "second";
    const mk2 = String(depositMonth);

    // Update account balances
    splits.forEach(({accountId, amount}) => {
      if (!accountId || !amount) return;
      setAccounts(prev => prev.map(a =>
        a.id === accountId ? {...a, balance: a.balance + amount} : a
      ));
    });

    // Log a transaction for each split so it appears in the tracker
    splits.forEach(({accountId, amount}) => {
      if (!accountId || !amount) return;
      const acct = accounts.find(a=>a.id===accountId);
      const txKey = `${mk2}_${pp}`;
      const newTx = {
        id: uid(),
        date: depositDate,
        notes: notes || "deposit",
        amount,
        category: "income",
        from_account_id: "",
        to_account_id: accountId,
        money_flow: "transfer",
        feeling: "happy",
        _isDeposit: true,
        createdAt: Date.now(),
      };
      setTxns(prev=>({...prev,[txKey]:[...(prev[txKey]||[]),newTx]}));
    });

    // Increase the period's pay by the deposit amount so "money left" updates
    const prevPay = pPay[`${mk2}_${pp}`] ?? Math.round((mIncome[depositMonth]??DEF_INCOME)/2);
    setPPay(prev=>({...prev,[`${mk2}_${pp}`]: prevPay + totalAmt}));
  }

  // ── CSS ───────────────────────────────────────────────────────────────────

  // ── Render helpers ────────────────────────────────────────────────────────

  // Unified: amount a transaction contributes to category spending (both old + new schema)
  function txSpend(t) { return BL.txSpend(t); }

  // ── BudgetRows component — tappable items drill down to transactions ──────
  function BudgetRows({ periodTxs, budgetMap, period: p }) {
    const [expanded, setExpanded] = useState(null); // "category:item"

    return orderedCats.map(key=>{
      const cat = cats[key]; if(!cat) return null;
      return (
        <div key={key} style={{marginBottom:18}}>
          <div style={{...S.sans,fontSize:"0.67rem",fontWeight:600,letterSpacing:"0.09em",textTransform:"uppercase",color:"#4a3020",marginBottom:7}}>{cat.label}</div>
          <Card style={{padding:"7px 0",overflow:"hidden"}}>
            {cat.items.map(item=>{
              const b=budgetMap[item]||0;
              const itemTxs=periodTxs.filter(t=>t.category===item);
              const s=itemTxs.reduce((a,t)=>a+txSpend(t),0);
              const left=b-s;
              const over=s>b&&b>0;
              const paid=b>0&&s>=b&&!over; // met budget exactly — "settled"
              const hasTx=itemTxs.length>0;
              const isPinned=pinnedBudgetItems.includes(item);
              const canPin=pinnedBudgetItems.length<4;
              const expandKey=`${key}:${item}`;
              const isOpen=expanded===expandKey;
              return (
                <div key={item}>
                  <div className="brow" onClick={()=>setExpanded(isOpen?null:expandKey)}
                    style={{cursor:hasTx?"pointer":"default",userSelect:"none",
                      background:isOpen?"rgba(143,170,139,0.12)":paid?"rgba(143,170,139,0.08)":"transparent",
                      padding:"6px 13px",borderRadius:isOpen?"6px 6px 0 0":0,
                      transition:"background 0.2s"}}>
                    {b>0&&(
                      <button onClick={(e)=>{
                        e.stopPropagation();
                        if(isPinned) setPinnedBudgetItems(p=>p.filter(i=>i!==item));
                        else if(canPin) setPinnedBudgetItems(p=>[...p,item]);
                      }} style={{background:"none",border:"none",cursor:canPin||isPinned?"pointer":"default",
                        padding:"0 4px 0 0",fontSize:"0.78rem",flexShrink:0,
                        color:isPinned?"#c8a882":"#d8cab0",opacity:!isPinned&&!canPin?0.3:1}}
                        title={isPinned?"unpin from Home":canPin?"pin to Home":"max 4 pinned"}>
                        {isPinned?"★":"☆"}
                      </button>
                    )}
                    <div className="bn" style={{
                      color:paid?"#4a6b42":isOpen?"#2c2116":"#4a3828",
                      opacity:paid?0.8:1}}>
                      {paid&&<span style={{marginRight:5,fontSize:"0.65rem"}}>✓</span>}
                      {item}
                      {hasTx&&<span style={{...S.sans,fontSize:"0.62rem",color:paid?"#6b8f64":"#7a5c3a",marginLeft:5,opacity:0.7}}>{itemTxs.length} tx</span>}
                    </div>
                    {b>0&&<div className="bbar"><div style={{height:"100%",width:`${Math.min(pct(s,b),100)}%`,background:over?"#b85050":paid?"#6b8f64":"#c8a882",borderRadius:3,transition:"width 0.3s"}}/></div>}
                    <div className={`bamt${over?" ov":""}`} style={{color:paid?"#4a6b42":undefined}}>
                      {b>0
                        ? (over
                            ? <>{fmt(Math.abs(left))} over<span style={{opacity:0.55}}> · {fmt(b)} budget</span></>
                            : <>{fmt(left)} left<span style={{opacity:0.55}}> of {fmt(b)}</span></>)
                        : fmt(s)}
                    </div>
                    {hasTx&&<span style={{...S.sans,fontSize:"0.65rem",color:paid?"#6b8f64":"#7a5c3a",flexShrink:0}}>{isOpen?"▲":"▼"}</span>}
                  </div>
                  {isOpen&&(
                    <div style={{background:"#fdf8f2",padding:"8px 13px 10px",borderRadius:"0 0 6px 6px",borderTop:"1px dashed #e8ddd0"}}>
                      {itemTxs.length===0
                        ? <div style={{...S.sans,fontSize:"0.76rem",color:"#7a5c3a",fontStyle:"italic"}}>no transactions yet</div>
                        : [...itemTxs].sort((a,b)=>{
                            const dateDiff = b.date?.localeCompare(a.date||"")||0;
                            if (dateDiff!==0) return dateDiff;
                            return (b.createdAt||0)-(a.createdAt||0);
                          }).map(tx=>{
                            const feel=FEELINGS.find(f=>f.v===tx.feeling);
                            const fromAcct=accounts.find(a=>a.id===(tx.from_account_id||tx.account));
                            const toAcct=accounts.find(a=>a.id===tx.to_account_id);
                            const dotClr = tx._isDeposit ? "#4a7c59" : (feel?.color||"#d4bfa0");
                            return (
                              <div key={tx.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid #ede5da"}}>
                                <div style={{width:7,height:7,borderRadius:"50%",background:dotClr,flexShrink:0}}/>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{...S.sans,fontSize:"0.79rem",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.notes||tx.category}</div>
                                  <div style={{...S.sans,fontSize:"0.65rem",color:"#7a5c3a"}}>
                                    {tx.date&&`${tx.date} · `}
                                    {fromAcct?.name}{toAcct&&` → ${toAcct.name}`}
                                    {feel&&<span style={{color:feel.color}}> · {feel.label}</span>}
                                  </div>
                                </div>
                                <div style={{...S.serif,fontSize:"0.88rem",whiteSpace:"nowrap",color:tx._isDeposit?"#4a7c59":"#2c2116"}}>{tx._isDeposit?"+":""}{fmt(tx.amount)}</div>
                              </div>
                            );
                          })
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      );
    });
  }

  // ── Touch-friendly drag-to-reorder ───────────────────────────────────────
  // Returns props to spread on each draggable item
  function useDragSort(order, setOrder) {
    const dragging = useRef(null);
    const dragOver = useRef(null);
    const [draggingKey, setDraggingKey] = useState(null);
    const [overKey,     setOverKey]     = useState(null);

    function moveUp(key) {
      const idx = order.indexOf(key);
      if (idx <= 0) return;
      const n = [...order];
      [n[idx-1], n[idx]] = [n[idx], n[idx-1]];
      setOrder(n);
    }
    function moveDown(key) {
      const idx = order.indexOf(key);
      if (idx < 0 || idx >= order.length - 1) return;
      const n = [...order];
      [n[idx], n[idx+1]] = [n[idx+1], n[idx]];
      setOrder(n);
    }

    function getProps(key) {
      return {
        draggable: true,
        onDragStart: () => { dragging.current=key; setDraggingKey(key); },
        onDragOver:  e  => { e.preventDefault(); dragOver.current=key; setOverKey(key); },
        onDrop:      e  => {
          e.preventDefault();
          const from=dragging.current, to=dragOver.current;
          if(from&&to&&from!==to){
            const n=[...order]; n.splice(n.indexOf(to),0,n.splice(n.indexOf(from),1)[0]); setOrder(n);
          }
          dragging.current=null; dragOver.current=null; setDraggingKey(null); setOverKey(null);
        },
        onDragEnd: () => { dragging.current=null; dragOver.current=null; setDraggingKey(null); setOverKey(null); },
        "data-dragkey": key,
        style_drag: { opacity: draggingKey===key?0.45:1, outline: overKey===key?"2px solid #c8a882":"none", outlineOffset:2 },
      };
    }
    return { getProps, moveUp, moveDown, order };
  }

  // ── Home / Dashboard ──────────────────────────────────────────────────────
  function HomeView() {
    const hour = now.getHours();
    const timeGreet = hour<12?"good morning":hour<17?"good afternoon":"good evening";

    // Home always shows REAL today — unaffected by which budget month user is editing
    const realMonth   = now.getMonth();
    const realDay     = now.getDate();
    const realPeriod  = realDay <= 15 ? "first" : "second";
    const realMk      = String(realMonth);
    const realP1txs   = txns[`${realMk}_first`]||[];
    const realP2txs   = txns[`${realMk}_second`]||[];
    const realPtxs    = realPeriod==="first" ? realP1txs : realP2txs;
    const realPay     = pPay[`${realMonth}_${realPeriod}`] ?? Math.round((mIncome[realMonth]??DEF_INCOME)/2);
    const spent = realPtxs.filter(t=>!t._isDeposit).reduce((s,t)=>s+txSpend(t),0);
    const left  = realPay - spent;
    const over  = left < 0;

    const starredGoals = goalOrder.filter(k=>goals[k]&&goals[k].starred).slice(0,3).map(k=>({key:k,...goals[k]}));

    // Pinned budget categories — track the App-level `period` state (explicit switches),
    // not the real calendar date, so they stay consistent with whatever the user
    // last looked at in Budget. Falls back to month if period is "month"/"year".
    const pinPeriod = (period==="first"||period==="second") ? period : realPeriod;
    const pinMk     = String(curMonth);
    const pinPtxs   = (txns[`${pinMk}_${pinPeriod}`]||[]).filter(t=>!t._isDeposit);
    const pinBudgetMap = getPB(pinPeriod);
    const pinnedCards = pinnedBudgetItems
      .map(item=>{
        const b = pinBudgetMap[item]||0;
        const s = pinPtxs.filter(t=>t.category===item).reduce((sum,t)=>sum+txSpend(t),0);
        return { item, budget:b, spent:s, left:b-s };
      })
      .filter(c=>c.budget>0 && c.left>0); // hide if no budget set or already over

    const recentTxs = [...realP1txs,...realP2txs].sort((a,b)=>{
      if(!a.date&&!b.date) return 0; if(!a.date) return 1; if(!b.date) return -1;
      return b.date.localeCompare(a.date);
    }).slice(0,4);

    // Habit helpers
    const today = new Date().toISOString().split("T")[0];
    function getHabitCount(h) {
      if(h.cadence==="monthly") {
        const prefix=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
        return (h.logs||[]).filter(d=>d.startsWith(prefix)).length;
      }
      if(h.cadence==="yearly") return (h.logs||[]).filter(d=>d.startsWith(String(now.getFullYear()))).length;
      return (h.logs||[]).length;
    }
    function toggleHabitToday(id) {
      setHabits(prev=>{
        const updated=prev.map(h=>{
          if(h.id!==id) return h;
          const logs=h.logs||[];
          const hasToday=logs.includes(today);
          return {...h, logs: hasToday?logs.filter(d=>d!==today):[...logs,today]};
        });
        const h=updated.find(h=>h.id===id);
        const prevH=prev.find(h=>h.id===id);
        if(h&&prevH){
          const getCount=hh=>{
            if(hh.cadence==="monthly"){const prefix=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;return(hh.logs||[]).filter(d=>d.startsWith(prefix)).length;}
            if(hh.cadence==="yearly") return(hh.logs||[]).filter(d=>d.startsWith(String(now.getFullYear()))).length;
            return(hh.logs||[]).length;
          };
          if(getCount(h)>=h.target&&getCount(prevH)<h.target) {
            setHabits(p=>p.map(hh=>hh.id===id?{...hh,celebrationTriggered:true}:hh));
            setTimeout(()=>setHabitComplete({id:h.id,name:h.name,emoji:h.emoji}),300);
          }
        }
        return updated;
      });
    }

    return (
      <>
        {/* Demo banner — only shown when no personal data exists yet */}
        {!hasStoredData && (
          <div style={{...S.sans,fontSize:"0.7rem",background:"#a89bc818",border:"1px solid #a89bc844",borderRadius:10,padding:"8px 12px",marginBottom:16,display:"flex",alignItems:"center",gap:8,color:"#6a5e8a"}}>
            <span>✨</span>
            <span style={{flex:1}}><strong>demo mode</strong> · sample data loaded. reset anytime to start with your own numbers.</span>
            <button onClick={resetAll} style={{...S.sans,fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:"1px solid #a89bc844",background:"transparent",color:"#6a5e8a",cursor:"pointer",whiteSpace:"nowrap"}}>reset →</button>
          </div>
        )}

        {/* Greeting + account indicator */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <div style={{...S.serif,fontSize:"1.6rem",lineHeight:1.2,marginBottom:4}}>{timeGreet} 🌿</div>
            <div style={{...S.sans,fontSize:"0.82rem",color:"#7a5c3a"}}>{MONTHS[realMonth]} · {realPeriod==="first"?"1st–15th":"16th–end"}</div>
          </div>
          {(()=>{
            const paycheckAccts = accounts.filter(a=>a.type==="checking"&&(a.paycheckSplit||0)>0);
            const safeIdx = Math.min(heroIdx, paycheckAccts.length-1);
            const acct = paycheckAccts[safeIdx];
            if (!acct) return null;
            return (
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{...S.sans,fontSize:"0.6rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:2}}>balance from</div>
                <div style={{...S.sans,fontSize:"0.75rem",fontWeight:500,color:"#1e140a",background:"#f0e8dc",borderRadius:8,padding:"3px 9px",display:"inline-block"}}>
                  🏦 {acct.name}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Hero carousel — one card per checking account with a paycheckSplit */}
        {(()=>{
          const paycheckAccts = accounts.filter(a=>a.type==="checking"&&(a.paycheckSplit||0)>0);
          // Fall back to overall period totals if no paycheck accounts configured
          if (paycheckAccts.length===0) {
            const over2=left<0;
            return (
              <>
                <div className="hero-grain" style={{background:"linear-gradient(150deg,#3d4a1a 0%,#4a5820 55%,#3a4618 100%)",borderRadius:20,padding:"32px 36px",marginBottom:12,position:"relative",overflow:"hidden"}}>
                  <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(220,235,180,0.85)",marginBottom:10}}>
                    {realPeriod==="first"?"1st – 15th":"16th – end"} · money left
                  </div>
                  <div style={{...S.serif,fontSize:"3.5rem",color:over2?"#c88b8b":"#c8a882",lineHeight:1,marginBottom:12,letterSpacing:"-0.02em"}}>
                    {over2?"-":""}{fmt(Math.abs(left))}
                  </div>
                  <div style={{height:1,background:"rgba(255,255,255,0.12)",marginBottom:12}}/>
                  <div style={{height:5,background:"#ffffff18",borderRadius:3,overflow:"hidden",marginBottom:8}}>
                    <div style={{height:"100%",width:`${Math.min(pct(spent,realPay),100)}%`,borderRadius:3,background:over2?"#c88b8b":pct(spent,realPay)>80?"#c8a882":"#8faa8b",transition:"width 0.4s"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.68rem",color:"#8fa86a"}}>
                    <span>{fmt(spent)} spent</span><span>{fmt(realPay)} paycheck</span>
                  </div>
                </div>
                {/* Nudge to set up paycheck account */}
                <button onClick={()=>setView("accounts")}
                  style={{width:"100%",marginBottom:18,padding:"10px 14px",borderRadius:12,border:"1.5px dashed #c8a882",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:10,...S.sans,textAlign:"left"}}>
                  <span style={{fontSize:"1.1rem"}}>💸</span>
                  <div>
                    <div style={{fontSize:"0.79rem",fontWeight:500,color:"#1e140a"}}>set up your paycheck account</div>
                    <div style={{fontSize:"0.69rem",color:"#7a5c3a"}}>link which account your direct deposit lands in →</div>
                  </div>
                </button>
              </>
            );
          }

          const safeIdx   = Math.min(heroIdx, paycheckAccts.length-1);
          const acct      = paycheckAccts[safeIdx];
          const acctLeft  = acct.balance;
          const acctOver  = false; // balance can't be negative in this model

          return (
            <div style={{marginBottom:24}}>
              <div className="hero-grain" style={{background:"linear-gradient(150deg,#3d4a1a 0%,#4a5820 55%,#3a4618 100%)",borderRadius:20,padding:"32px 36px",position:"relative",overflow:"hidden"}}>
                {/* Account label + nav dots */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(220,235,180,0.85)"}}>
                    {acct.name} · {realPeriod==="first"?"1st–15th":"16th–end"}
                  </div>
                  {paycheckAccts.length>1&&(
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      <button onClick={()=>setHeroIdx(i=>(i-1+paycheckAccts.length)%paycheckAccts.length)}
                        style={{background:"none",border:"none",color:"#6b4c2a",cursor:"pointer",fontSize:"1rem",padding:"0 2px",lineHeight:1}}>‹</button>
                      {paycheckAccts.map((_,i)=>(
                        <div key={i} onClick={()=>setHeroIdx(i)} style={{width:i===safeIdx?16:6,height:6,borderRadius:3,background:i===safeIdx?"#c8a882":"#ffffff30",cursor:"pointer",transition:"all 0.2s"}}/>
                      ))}
                      <button onClick={()=>setHeroIdx(i=>(i+1)%paycheckAccts.length)}
                        style={{background:"none",border:"none",color:"#6b4c2a",cursor:"pointer",fontSize:"1rem",padding:"0 2px",lineHeight:1}}>›</button>
                    </div>
                  )}
                </div>
                <div style={{...S.sans,fontSize:"0.62rem",color:"rgba(180,220,130,0.75)",marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>available balance</div>
                <div style={{...S.serif,fontSize:"3.5rem",color:"#eee8c4",lineHeight:1,marginBottom:12,letterSpacing:"-0.02em"}}>
                  {fmt(acctLeft)}
                </div>
                <div style={{height:1,background:"rgba(255,255,255,0.12)",marginBottom:12}}/>
                <div style={{...S.sans,fontSize:"0.72rem",color:"#8fa86a"}}>
                  {acct.name} · {acct.label}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Recent wins banner ───────────────────────────────────────────── */}
        {recentWins.filter(w=>Date.now()-w.at < 24*60*60*1000).length > 0 && (
          <div style={{marginBottom:20}}>
            {recentWins.filter(w=>Date.now()-w.at < 24*60*60*1000).map((w,i)=>(
              <div key={`${w.key}_${w.at}`} style={{
                background:"linear-gradient(150deg,#3d4a1a 0%,#4a5820 55%,#3a4618 100%)",
                borderRadius:16,padding:"18px 20px",marginBottom:8,
                display:"flex",alignItems:"center",gap:14,
                position:"relative",overflow:"hidden"}}>
                <div style={{fontSize:"2rem",lineHeight:1,flexShrink:0}}>{w.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{...S.sans,fontSize:"0.62rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(220,235,180,0.85)",marginBottom:3}}>
                    {w.type==="loan"?"loan paid off 🎉":"goal reached 🎉"}
                  </div>
                  <div style={{...S.serif,fontSize:"1.05rem",color:"#faf6f0",marginBottom:2}}>
                    <em>{w.name}</em> — {fmt(w.amount)}
                  </div>
                  <div style={{...S.sans,fontSize:"0.7rem",color:"#8faa8b"}}>
                    you did it! what a win 🌱
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                  <button onClick={()=>{
                    if (w.type==="goal") {
                      setArchived(p=>({...p,[w.key]:{...goals[w.key],archivedAt:Date.now(),type:"goal"}}));
                      setGoals(p=>{ const n={...p}; delete n[w.key]; return n; });
                      setGoalOrder(p=>p.filter(k=>k!==w.key));
                    } else {
                      setArchived(p=>({...p,[`loan_${w.key}`]:{...loans[w.key],archivedAt:Date.now(),type:"loan",name:w.name}}));
                      setLoans(p=>{ const n={...p}; delete n[w.key]; return n; });
                    }
                    setRecentWins(p=>p.filter((_,j)=>j!==i));
                  }} style={{...S.sans,fontSize:"0.7rem",fontWeight:500,padding:"6px 12px",borderRadius:8,
                    border:"none",background:"#8faa8b",color:"#2c2116",cursor:"pointer",whiteSpace:"nowrap"}}>
                    archive ✓
                  </button>
                  <button onClick={()=>setRecentWins(p=>p.filter((_,j)=>j!==i))}
                    style={{...S.sans,fontSize:"0.65rem",padding:"5px 12px",borderRadius:8,
                      border:"1px solid #3d2f22",background:"transparent",color:"#6b4c2a",cursor:"pointer",whiteSpace:"nowrap"}}>
                    dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pinned budget categories — quick "how much can I spend" check ── */}
        {pinnedCards.length > 0 && (
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{...S.serif,fontSize:"1rem"}}>💰 spending room</div>
              <button onClick={()=>{setView("tracker");setPeriod(pinPeriod);}}
                style={{...S.sans,fontSize:"0.7rem",color:"#8a5c2a",background:"none",border:"none",cursor:"pointer"}}>
                budget →
              </button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {pinnedCards.map(c=>(
                <div key={c.item} style={{background:"rgba(252,247,238,0.96)",border:"1px solid rgba(210,190,160,0.5)",borderRadius:12,padding:"12px 14px",boxShadow:"0 2px 16px rgba(60,35,10,0.08), 0 1px 0 rgba(255,255,248,0.9) inset"}}>
                  <div style={{...S.sans,fontSize:"0.65rem",fontWeight:500,letterSpacing:"0.04em",textTransform:"capitalize",color:"#7a5c3a",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.item}</div>
                  <div style={{...S.serif,fontSize:"1.3rem",color:"#4a6b42",lineHeight:1}}>{fmt(c.left)}</div>
                  <div style={{...S.sans,fontSize:"0.62rem",color:"#a8906e"}}>of {fmt(c.budget)} left</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pinned treat cards (earned from habit completions) ─────────── */}
        {pinnedTreats.length > 0 && (
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{...S.serif,fontSize:"1rem"}}>🎁 treat yourself</div>
              <button onClick={()=>{setView("intentions");setIntentionsTab("deferred");setFromHabitCelebration(true);}}
                style={{...S.sans,fontSize:"0.7rem",color:"#8a5c2a",background:"none",border:"none",cursor:"pointer"}}>
                wishlist →
              </button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {pinnedTreats.map(treat=>{
                const priceLabel = treat.price&&treat.priceMax
                  ? `${fmt(parseFloat(treat.price))} – ${fmt(parseFloat(treat.priceMax))}`
                  : treat.price ? fmt(parseFloat(treat.price))
                  : treat.priceMax ? `up to ${fmt(parseFloat(treat.priceMax))}`
                  : null;
                return (
                  <div key={treat.id} style={{background:"linear-gradient(135deg,#fdf8f2,#f5ede4)",border:"1.5px solid #c8a88244",borderRadius:14,padding:"13px 15px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:"1.4rem",flexShrink:0}}>{treat.emoji||"🎁"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{...S.sans,fontSize:"0.88rem",fontWeight:500,marginBottom:2}}>{treat.name}</div>
                      {priceLabel&&<div style={{...S.serif,fontSize:"0.82rem",color:"#6b7c3f"}}>{priceLabel}</div>}
                      {treat.notes&&<div style={{...S.sans,fontSize:"0.7rem",color:"#7a5c3a",fontStyle:"italic"}}>{treat.notes}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                      <button onClick={()=>{
                        setTreatTxPrefill({note:`habit treat! ${treat.name}`, amount:treat.price?String(treat.price):""});
                        setDeferred(p=>p.filter(d=>d.id!==treat.id));
                        resolveTreat(treat);
                        setShowAddTxPage(true);
                      }} style={{...S.sans,fontSize:"0.7rem",fontWeight:500,padding:"5px 10px",borderRadius:7,border:"none",background:"#2c2116",color:"#faf6f0",cursor:"pointer",whiteSpace:"nowrap"}}>
                        bought it 🎉
                      </button>
                      <button onClick={()=>setRemovePrompt({treat})}
                        style={{...S.sans,fontSize:"0.7rem",padding:"5px 10px",borderRadius:7,border:"1px solid #e0d0be",background:"transparent",color:"#7a5c3a",cursor:"pointer",whiteSpace:"nowrap"}}>
                        remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tending Habits */}
        {habits.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{...S.serif,fontSize:"1rem"}}>tending habits</div>
              <button onClick={()=>{setView("intentions");setIntentionsTab("habits");}} style={{...S.sans,fontSize:"0.7rem",color:"#8a5c2a",background:"none",border:"none",cursor:"pointer"}}>manage →</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {habits.slice(0,3).map(h=>{
                const count=getHabitCount(h);
                const done=count>=h.target;
                const punchFilled=Array.from({length:h.target},(_,i)=>i<count);
                const punchedToday=(h.logs||[]).includes(today);
                return (
                  <Card key={h.id} style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <span style={{fontSize:"1.2rem"}}>{h.emoji}</span>
                      <div style={{flex:1}}>
                        <div style={{...S.sans,fontSize:"0.82rem",fontWeight:500}}>{h.name}</div>
                        <div style={{...S.sans,fontSize:"0.67rem",color:"#7a5c3a"}}>{count}/{h.target} · {h.cadence}</div>
                      </div>
                      <button onClick={()=>toggleHabitToday(h.id)} style={{
                        ...S.sans,fontSize:"0.72rem",fontWeight:500,padding:"5px 12px",borderRadius:20,cursor:"pointer",
                        border:`1.5px solid ${punchedToday?"#8faa8b":"#e0d0be"}`,
                        background:punchedToday?"#8faa8b18":"transparent",
                        color:punchedToday?"#4a7c59":"#7a6048"
                      }}>{punchedToday?"✓ done":"punch in"}</button>
                    </div>
                    {/* Punch card dots */}
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {punchFilled.map((filled,i)=>(
                        <div key={i} style={{width:14,height:14,borderRadius:"50%",background:filled?(done?"#8faa8b":"#c8a882"):"#f0e8dc",border:`1.5px solid ${filled?(done?"#8faa8b":"#c8a882"):"#e0d0be"}`,transition:"all 0.2s"}}/>
                      ))}
                    </div>
                    {done&&<div style={{...S.sans,fontSize:"0.69rem",color:"#4a7c59",marginTop:6}}>🎉 goal reached this {h.cadence==="monthly"?"month":"year"}!</div>}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {habits.length===0&&(
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{...S.serif,fontSize:"1rem"}}>tending habits</div>
            </div>
            <button onClick={()=>{setView("intentions");setIntentionsTab("habits");}} style={{width:"100%",padding:14,borderRadius:14,border:"1.5px dashed #c8a882",background:"transparent",...S.sans,fontSize:"0.82rem",color:"#7a5c3a",cursor:"pointer"}}>
              start tracking habits →
            </button>
          </div>
        )}

        {/* Starred goals */}
        {starredGoals.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{...S.serif,fontSize:"1rem"}}>pinned goals</div>
              <button onClick={()=>{setView("intentions");setIntentionsTab("goals");}} style={{...S.sans,fontSize:"0.7rem",color:"#8a5c2a",background:"none",border:"none",cursor:"pointer"}}>all goals →</button>
            </div>
            {starredGoals.map(g=>{
              const gp=pct(g.saved||0,g.target||1);
              return (
                <div key={g.key} style={{background:"#fff",border:"1px solid #e8ddd0",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                    <span style={{fontSize:"1.1rem"}}>{g.emoji||"🎯"}</span>
                    <div style={{flex:1,...S.sans,fontSize:"0.82rem",fontWeight:500,textTransform:"capitalize"}}>{g.key}</div>
                    <div style={{...S.serif,fontSize:"0.9rem",color:"#4a7c59"}}>{fmt(g.saved||0)}</div>
                    <div style={{...S.sans,fontSize:"0.7rem",color:"#7a5c3a"}}>/ {fmt(g.target||0)}</div>
                  </div>
                  <ProgressBar value={gp} color="linear-gradient(90deg,#8fa44a,#4f5e2a)" height={6} noShadow/>
                  {g.deadline&&<div style={{...S.sans,fontSize:"0.67rem",color:"#7a5c3a",marginTop:4}}>by {g.deadline}</div>}
                </div>
              );
            })}
            {starredGoals.length===0&&(
              <div style={{...S.sans,fontSize:"0.78rem",color:"#7a5c3a",fontStyle:"italic",textAlign:"center",padding:"12px 0"}}>
                star up to 3 goals in the Goals tab to pin them here
              </div>
            )}
          </div>
        )}

        {starredGoals.length===0&&(
          <div style={{marginBottom:20}}>
            <div style={{...S.serif,fontSize:"1rem",marginBottom:10}}>pinned goals</div>
            <div style={{...S.sans,fontSize:"0.78rem",color:"#7a5c3a",fontStyle:"italic",background:"#f8f2ea",borderRadius:10,padding:"12px 14px",border:"1px solid #e8ddd0"}}>
              ⭐ star up to 3 goals in the Goals tab to pin them here
            </div>
          </div>
        )}

        {/* Recent transactions */}
        {recentTxs.length>0&&(
          <div style={{marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{...S.serif,fontSize:"1rem"}}>recent</div>
              <button onClick={()=>setView("tracker")} style={{...S.sans,fontSize:"0.7rem",color:"#8a5c2a",background:"none",border:"none",cursor:"pointer"}}>see all →</button>
            </div>
            {recentTxs.map(tx=>{
              const feel = FEELINGS.find(f=>f.v===tx.feeling);
              const dotClr = tx._isDeposit ? null : (feel?.color||"#d4bfa0");
              const chip = tx._isDeposit
                ? {label:"deposit", color:GREEN}
                : tx.money_flow==="debt_payment"||tx.txType==="payment"
                  ? {label:"paid toward debt", color:"#a89bc8"}
                  : tx.money_flow==="transfer"
                    ? {label:"allocated", color:"#7a9ec8"}
                    : null;
              return (
                <div key={tx.id} style={{display:"flex",alignItems:"center",gap:9,background:"rgba(248,242,228,0.9)",border:"0.5px solid rgba(210,195,165,0.5)",borderRadius:10,padding:"9px 13px",marginBottom:7}}>
                  {dotClr&&<div style={{width:7,height:7,borderRadius:"50%",background:dotClr,flexShrink:0}}/>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <div style={{...S.sans,fontSize:"0.82rem",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.notes||tx.category}</div>
                      {chip&&<span style={{...S.sans,fontSize:"0.6rem",padding:"1px 6px",borderRadius:8,background:chip.color+"22",color:chip.color,fontWeight:500,whiteSpace:"nowrap"}}>{chip.label}</span>}
                    </div>
                    <div style={{...S.sans,fontSize:"0.69rem",color:"#7a5c3a"}}>{tx.date&&`${tx.date} · `}{tx.category}</div>
                  </div>
                  <div style={{...S.serif,fontSize:"0.93rem",color:"#1e140a",whiteSpace:"nowrap"}}>
                    {tx._isDeposit?"+":tx.money_flow==="expense"?"-":""}{fmt(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="note">money loves you back 💛</div>
      </>
    );
  }

  // ── Accounts (home) ────────────────────────────────────────────────────────
  function AccountsView() {
    const [editingProgress, setEditingProgress] = React.useState(false);
    const progressMode  = accountsProgressMode;
    const setProgressMode = setAccountsProgressMode;
    const progressItems = accountsProgressItems;
    const setProgressItems = setAccountsProgressItems;

    const liquid  = accounts.filter(a=>a.type!=="credit").reduce((s,a)=>s+a.balance,0);
    const ccDebt  = accounts.filter(a=>a.type==="credit").reduce((s,a)=>s+a.balance,0);
    const loanDebt= Object.values(loans).reduce((s,l)=>s+Math.max(0,(l.target||0)-(l.paid||0)),0);
    const debt    = ccDebt + loanDebt;

    // Compute progress for a given set of month indices
    function computeProgress(monthIndices) {
      let deposited = 0, savedToGoals = 0, paidLoans = 0;
      monthIndices.forEach(mi=>{
        const mk2 = String(mi);
        const mTxs = [...(txns[`${mk2}_first`]||[]),...(txns[`${mk2}_second`]||[])];
        mTxs.forEach(t=>{
          if (t._isDeposit) { deposited += t.amount; return; }
          const flow = t.money_flow;
          if (flow==="transfer") savedToGoals += t.amount;
          if (flow==="debt_payment") paidLoans += t.amount;
        });
      });
      const total =
        (progressItems.savings ? deposited : 0) +
        (progressItems.goals   ? savedToGoals : 0) +
        (progressItems.loans   ? paidLoans : 0);
      return { total, deposited, savedToGoals, paidLoans };
    }

    const realMonth = now.getMonth();
    const monthIndices = progressMode==="month"
      ? [realMonth]
      : Array.from({length:realMonth+1},(_,i)=>i);

    const { total, deposited, savedToGoals, paidLoans } = computeProgress(monthIndices);
    const hasActivity = total > 0;
    const label = progressMode==="month" ? MONTHS[realMonth] : `Jan – ${MONTHS[realMonth].slice(0,3)}`;

    const progressLines = [
      progressItems.savings && deposited>0  && { label:"deposited",           val:deposited,     color:"#a8d4a0" },
      progressItems.goals   && savedToGoals>0 && { label:"saved to goals",     val:savedToGoals,  color:"#a8d4a0" },
      progressItems.loans   && paidLoans>0  && { label:"paid toward loans",   val:paidLoans,     color:"#c8b8e8" },
    ].filter(Boolean);

    return (
      <>
        {/* Progress banner */}
        <div className="landing-banner hero-grain" style={{background:"linear-gradient(150deg,#3d4a1a 0%,#4a5820 55%,#3a4618 100%)",borderRadius:18,padding:"32px 36px",marginBottom:28,position:"relative",overflow:"hidden"}}>

          {/* Header row: label + month/YTD toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(220,235,180,0.85)"}}>
              {hasActivity ? `progress · ${label}` : `${label} · so far`}
            </div>
            <div style={{display:"flex",gap:2,background:"#3d2f22",borderRadius:7,padding:2}}>
              {[{id:"month",label:"month"},{id:"ytd",label:"YTD"}].map(m=>(
                <button key={m.id} onClick={()=>setProgressMode(m.id)}
                  style={{...S.sans,fontSize:"0.65rem",fontWeight:500,padding:"3px 10px",borderRadius:5,border:"none",cursor:"pointer",
                    background:progressMode===m.id?"#6b7c3f":"transparent",
                    color:progressMode===m.id?"#faf6f0":"rgba(220,235,180,0.7)",transition:"all 0.15s"}}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hero number */}
          {hasActivity ? (
            <>
              <div style={{...S.serif,fontSize:"3rem",color:"#dff0c0",lineHeight:1,marginBottom:4,letterSpacing:"-0.02em"}}>
                +{fmt(total)}
              </div>
              <div style={{...S.sans,fontSize:"0.78rem",color:"rgba(220,235,180,0.8)",marginBottom:16}}>
                toward your future 🌱
              </div>
            </>
          ) : (
            <>
              <div style={{...S.serif,fontSize:"2rem",color:"#8fa86a",lineHeight:1,marginBottom:4,letterSpacing:"-0.02em"}}>
                nothing logged yet
              </div>
              <div style={{...S.sans,fontSize:"0.78rem",color:"#8fa86a",marginBottom:16}}>
                log a deposit, payment, or transfer to see your progress here 🌱
              </div>
            </>
          )}

          {/* Progress breakdown */}
          {hasActivity && progressLines.length > 0 && (
            <div style={{display:"flex",gap:24,marginBottom:16,flexWrap:"wrap"}}>
              {progressLines.map(({label,val,color})=>(
                <div key={label}>
                  <div style={{...S.sans,fontSize:"0.62rem",color:"#8fa86a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{label}</div>
                  <div style={{...S.serif,fontSize:"1.05rem",color}}>{fmt(val)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Hairline */}
          <div style={{height:1,background:"#ffffff10",marginBottom:16}}/>

          {/* Context stats */}
          <div style={{display:"flex",gap:24,flexWrap:"wrap",marginBottom:12}}>
            {[
              {label:"liquid assets", val:fmt(liquid),  color:"#a8d4a0"},
              {label:"total debt",    val:fmt(debt),     color: debt>0?"#e8a0a0":"#a8d4a0"},
              {label:"credit card",   val:fmt(ccDebt),   color: ccDebt>0?"#e8a0a0":"rgba(220,235,180,0.85)"},
              {label:"loans",         val:fmt(loanDebt), color: loanDebt>0?"#e8a0a0":"rgba(220,235,180,0.85)"},
            ].map(({label,val,color})=>(
              <div key={label}>
                <div style={{...S.sans,fontSize:"0.62rem",color:"#8fa86a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{label}</div>
                <div style={{...S.serif,fontSize:"0.95rem",color}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Edit what counts as progress */}
          <div>
            {editingProgress ? (
              <div style={{background:"#3d2f22",borderRadius:10,padding:"12px 14px"}}>
                <div style={{...S.sans,fontSize:"0.67rem",color:"rgba(220,235,180,0.85)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>what counts as progress?</div>
                {[
                  {key:"savings", label:"💰 deposits"},
                  {key:"goals",   label:"🎯 transfers to goals"},
                  {key:"loans",   label:"📋 loan payments"},
                ].map(({key,label})=>(
                  <button key={key} onClick={()=>setProgressItems(p=>({...p,[key]:!p[key]}))}
                    style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 0",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${progressItems[key]?"#6b7c3f":"#8fa86a"}`,background:progressItems[key]?"#6b7c3f":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {progressItems[key]&&<span style={{color:"#fff",fontSize:"0.65rem",lineHeight:1}}>✓</span>}
                    </div>
                    <span style={{...S.sans,fontSize:"0.78rem",color:progressItems[key]?"#c8b89a":"#8fa86a"}}>{label}</span>
                  </button>
                ))}
                <button onClick={()=>setEditingProgress(false)}
                  style={{...S.sans,fontSize:"0.68rem",marginTop:8,padding:"5px 12px",borderRadius:7,border:"none",background:"#6b7c3f",color:"#faf6f0",cursor:"pointer"}}>
                  done
                </button>
              </div>
            ) : (
              <button onClick={()=>setEditingProgress(true)}
                style={{...S.sans,fontSize:"0.65rem",color:"#9ab87a",background:"none",border:"none",cursor:"pointer",opacity:0.8,padding:0}}>
                edit what counts as progress →
              </button>
            )}
          </div>
        </div>

        <SectionTitle>your accounts</SectionTitle>
        {accounts.map(acct=>{
          const isOpen=expAcct===acct.id, isCredit=acct.type==="credit", isSav=acct.type==="savings";
          const bs=getBillStatus(acct);
          const allDone=bs.length>0&&bs.every(b=>b.done||b.budgeted===0);
          const totalRem=bs.reduce((s,b)=>s+b.remaining,0);
          const utilPct=isCredit&&acct.creditLimit?pct(acct.balance,acct.creditLimit):0;
          const payPct=isCredit&&acct.payoffTarget?pct(acct.payoffTarget-acct.balance,acct.payoffTarget):0;
          const acctGoals=(acct.savingsGoals||[]).map(g=>({name:g,...(goals[g]||{})}));
          const goalsSaved=acctGoals.reduce((s,g)=>s+(g.saved||0),0);
          const icon=isCredit?"💳":isSav?"🪙":"🏦";
          return (
            <div key={acct.id} className="acard" style={{background:"rgba(252,247,238,0.96)",border:"1px solid rgba(210,190,160,0.5)",boxShadow:"0 2px 16px rgba(60,35,10,0.08), 0 1px 0 rgba(255,255,248,0.9) inset"}}>
              <div className="acardh" onClick={()=>setExpAcct(isOpen?null:acct.id)}>
                <div style={{width:40,height:40,borderRadius:10,background:acct.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>{icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{...S.serif,fontSize:"1rem"}}>{acct.name}</div>
                  <div style={{...S.sans,fontSize:"0.72rem",color:"#7a5c3a"}}>{acct.label}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{...S.serif,fontSize:"1.2rem",color:isCredit?"#b85050":"#4a7c59"}}>{isCredit?`-${fmt(acct.balance)}`:fmt(acct.balance)}</div>
                  <div style={{...S.sans,fontSize:"0.68rem",color:"#7a5c3a"}}>
                    {isCredit?`${utilPct.toFixed(0)}% of ${fmt(acct.creditLimit||0)} limit`:isSav?`${fmt(goalsSaved)} in goals`:allDone?"✓ bills paid":`${fmt(totalRem)} owed`}
                  </div>
                </div>
                <span className={`chev${isOpen?" op":""}`}>▼</span>
              </div>
              {isOpen&&(
                <div className="acardb">
                  {acct.notes&&<div style={{...S.sans,fontSize:"0.78rem",color:"#7a5c3a",fontStyle:"italic",marginTop:14}}>{acct.notes}</div>}
                  <div className="asec">
                    <div className="asl">{isCredit?"balance owed":"account balance"}</div>
                    <BalanceEditor value={acct.balance} onChange={v=>setAccounts(p=>p.map(a=>a.id===acct.id?{...a,balance:v}:a))}/>
                  </div>
                  {/* Paycheck split for checking accounts */}
                  {!isCredit&&!isSav&&(
                    <div className="asec">
                      <div className="asl">direct deposit split</div>
                      <BalanceEditor
                        value={acct.paycheckSplit||0}
                        onChange={v=>setAccounts(p=>p.map(a=>a.id===acct.id?{...a,paycheckSplit:v}:a))}/>
                      <div style={{...S.sans,fontSize:"0.69rem",color:"#7a5c3a",marginTop:4}}>
                        how much of your paycheck lands here each period
                      </div>
                    </div>
                  )}
                  {isCredit&&(
                    <div className="asec">
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div className="asl" style={{marginBottom:0}}>credit utilization</div>
                        <BtnSm onClick={()=>setAccounts(p=>p.map(a=>a.id===acct.id?{...a,_editLimits:!a._editLimits}:a))}>{acct._editLimits?"done":"edit limits"}</BtnSm>
                      </div>
                      {acct._editLimits&&(
                        <div style={{background:"#fdfaf6",border:"1.5px solid #e8ddd0",borderRadius:10,padding:"12px 13px",marginBottom:10}}>
                          <FormRow>
                            <FormGroup label="credit limit">
                              <input style={S.input} type="number" inputMode="decimal" value={acct.creditLimit||""} placeholder="0" onChange={e=>setAccounts(p=>p.map(a=>a.id===acct.id?{...a,creditLimit:parseFloat(e.target.value)||0}:a))}/>
                            </FormGroup>
                            <FormGroup label="payoff target">
                              <input style={S.input} type="number" inputMode="decimal" value={acct.payoffTarget||""} placeholder="0" onChange={e=>setAccounts(p=>p.map(a=>a.id===acct.id?{...a,payoffTarget:parseFloat(e.target.value)||0}:a))}/>
                            </FormGroup>
                          </FormRow>
                        </div>
                      )}
                      {acct.creditLimit ? (<>
                        <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.75rem",marginBottom:4}}>
                          <span>{utilPct.toFixed(1)}% used</span>
                          <span style={{color:utilPct>30?"#c88b8b":utilPct>10?"#c8a882":"#8faa8b",fontWeight:500}}>{utilPct>30?"⚠️ over 30%":utilPct>10?"caution 10–30%":"✅ under 10%"}</span>
                        </div>
                        <div style={{position:"relative",marginBottom:18}}>
                          <ProgressBar value={utilPct} color={utilPct>30?"linear-gradient(90deg,#c8a882,#c88b8b)":utilPct>10?"linear-gradient(90deg,#8faa8b,#c8a882)":"#8faa8b"} height={9}/>
                          {[0.1,0.3].map(frac=>{
                            const over2=acct.balance>=acct.creditLimit*frac;
                            return (
                              <div key={frac} style={{position:"absolute",top:0,left:`${frac*100}%`,transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",pointerEvents:"none"}}>
                                <div style={{width:1,height:9,background:over2?"#c88b8b":"#c8b89a",opacity:0.8}}/>
                                <div style={{...S.sans,fontSize:"0.6rem",color:over2?"#c88b8b":"#a8906e",marginTop:2,whiteSpace:"nowrap"}}>{frac===0.1?"10%":"30%"}</div>
                                <div style={{...S.sans,fontSize:"0.6rem",color:over2?"#c88b8b":"#a8906e",whiteSpace:"nowrap"}}>{fmt(acct.creditLimit*frac)}</div>
                              </div>
                            );
                          })}
                          <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.6rem",color:"#7a5c3a",marginTop:2}}>
                            <span>$0</span><span>{fmt(acct.creditLimit)}</span>
                          </div>
                        </div>
                      </>) : <div style={{...S.sans,fontSize:"0.75rem",color:"#7a5c3a",fontStyle:"italic"}}>no limit set — tap "edit limits"</div>}
                      {acct.payoffTarget&&(
                        <div style={{marginTop:6}}>
                          <div className="asl">payoff progress</div>
                          <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.75rem",marginBottom:4}}>
                            <span>{payPct.toFixed(0)}% paid off</span><span style={{color:"#7a5c3a"}}>{fmt(acct.balance)} remaining</span>
                          </div>
                          <ProgressBar value={payPct} color="linear-gradient(90deg,#8fa44a,#4f5e2a)" height={7} noShadow/>
                          <PaydownCalc balance={acct.balance}/>
                        </div>
                      )}
                    </div>
                  )}
                  {(acct.bills||[]).length>=0&&(
                    <div className="asec">
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div className="asl" style={{marginBottom:0}}>bills & expenses</div>
                        <BtnSm onClick={()=>setAccounts(p=>p.map(a=>a.id===acct.id?{...a,_editBills:!a._editBills}:a))}>{acct._editBills?"done":"edit"}</BtnSm>
                      </div>
                      <Card style={{padding:"6px 12px"}}>
                        {bs.map(({bill,budgeted,paid,remaining,done,over})=>(
                          <div key={bill} className="ar" style={{opacity:done?0.55:1}}>
                            <div style={{width:7,height:7,borderRadius:"50%",background:done?"#8faa8b":over?"#c8a882":acct.color,flexShrink:0}}/>
                            <div className="an" style={{textDecoration:done?"line-through":"none",color:done?"#a8906e":"#4a3828"}}>{bill}</div>
                            <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                              {done?<span style={{...S.sans,fontSize:"0.72rem",color:"#8faa8b",fontWeight:500}}>✓</span>
                               :paid>0?<span style={{...S.sans,fontSize:"0.72rem",color:"#8a5c2a"}}>{fmt(paid)}/{fmt(budgeted)}</span>
                               :<span className="aa">{fmt(budgeted)}/mo</span>}
                              {acct._editBills&&<button style={{background:"none",border:"none",cursor:"pointer",color:"#d4bfa0",fontSize:"0.95rem"}} onClick={()=>setAccounts(p=>p.map(a=>a.id===acct.id?{...a,bills:a.bills.filter(b=>b!==bill)}:a))}>×</button>}
                            </div>
                          </div>
                        ))}
                        {acct._editBills&&(
                          <div style={{padding:"8px 0 2px",borderTop:"1px solid #f5ede4",marginTop:4}}>
                            <select style={{...S.select,fontSize:"0.78rem",padding:"5px 8px"}} value="" onChange={e=>{ const i=e.target.value; if(i&&!(acct.bills||[]).includes(i)) setAccounts(p=>p.map(a=>a.id===acct.id?{...a,bills:[...(a.bills||[]),i]}:a)); }}>
                              <option value="">+ assign line item…</option>
                              {allCatItems.filter(i=>!(acct.bills||[]).includes(i)).map(i=><option key={i} value={i}>{i}</option>)}
                            </select>
                          </div>
                        )}
                        <div className="ar" style={{borderTop:"1px solid #e8ddd0",marginTop:4,paddingTop:8,borderBottom:"none"}}>
                          <div className="an" style={{fontWeight:500}}>{allDone?"✓ all paid":"still owed"}</div>
                          <div className="aa" style={{fontWeight:500,color:allDone?"#8faa8b":"#2c2116"}}>{allDone?fmt(bs.reduce((s,b)=>s+Math.min(b.paid,b.budgeted),0)):fmt(totalRem)+"/mo"}</div>
                        </div>
                      </Card>
                    </div>
                  )}
                  {isSav&&acctGoals.length>0&&(
                    <div className="asec">
                      <div className="asl">savings goals</div>
                      <Card style={{padding:"6px 12px"}}>
                        {acctGoals.map(g=>{
                          const gp=pct(g.saved||0,g.target||1);
                          return (
                            <div key={g.name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f8f3ee"}}>
                              <div style={{flex:1}}>
                                <div style={{...S.sans,fontSize:"0.81rem",fontWeight:500,textTransform:"capitalize"}}>{g.name}</div>
                                {g.deadline&&<div style={{...S.sans,fontSize:"0.68rem",color:"#7a5c3a"}}>by {g.deadline}</div>}
                              </div>
                              <div style={{minWidth:90}}>
                                <ProgressBar value={gp} color={acct.color} height={5}/>
                                <div style={{...S.sans,fontSize:"0.67rem",color:"#7a5c3a",textAlign:"right",marginTop:2}}>{gp.toFixed(0)}% of {fmt(g.target||0)}</div>
                              </div>
                              <div style={{...S.serif,fontSize:"0.82rem",whiteSpace:"nowrap",color:goalsSaved>acct.balance?"#b85050":"#2c2116"}}>{fmt(g.saved||0)}</div>
                            </div>
                          );
                        })}
                        <div className="ar" style={{borderTop:"1px solid #e8ddd0",marginTop:4,paddingTop:8,borderBottom:"none"}}>
                          <div className="an" style={{fontWeight:500}}>total committed</div>
                          <div className="aa" style={{fontWeight:500,color:goalsSaved>acct.balance?"#b85050":"#2c2116"}}>{fmt(goalsSaved)}</div>
                        </div>
                      </Card>
                      {goalsSaved>acct.balance?(
                        <div style={{...S.sans,fontSize:"0.75rem",color:"#b85050",marginTop:6,display:"flex",alignItems:"center",gap:8,background:"#c88b8b0e",border:"1px solid #c88b8b33",borderRadius:8,padding:"7px 10px"}}>
                          <span>⚠️</span>
                          <span style={{flex:1}}>committed {fmt(goalsSaved)} exceeds balance {fmt(acct.balance)}</span>
                          <button onClick={()=>{setView("intentions");setIntentionsTab("goals");}}
                            style={{...S.sans,fontSize:"0.7rem",fontWeight:500,padding:"3px 9px",borderRadius:6,border:"1.5px solid #c88b8b",background:"transparent",color:"#b85050",cursor:"pointer",whiteSpace:"nowrap"}}>edit goals</button>
                        </div>
                      ):(
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
                          <div style={{...S.sans,fontSize:"0.75rem",color:"#4a7c59"}}>{fmt(Math.max(0,acct.balance-goalsSaved))} unallocated</div>
                          {acct.balance-goalsSaved>0&&(
                            <button onClick={()=>{setView("intentions");setIntentionsTab("goals");setShowAG(true);}} style={{...S.sans,fontSize:"0.7rem",color:"#8a5c2a",background:"none",border:"none",cursor:"pointer"}}>+ allocate to goal →</button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Credit card payment history */}
                  {isCredit&&(()=>{
                    const payments=allTxs.filter(t=>{
                      const toId=t.to_account_id;
                      const flow=t.money_flow||(t.txType==="payment"?"debt_payment":"expense");
                      // new schema: debt_payment to this card; old schema: txType=payment on this account
                      return (toId===acct.id&&flow==="debt_payment")||(t.account===acct.id&&t.txType==="payment");
                    }).sort((a,b)=>b.date?.localeCompare(a.date||"")||0).slice(0,5);
                    if(payments.length===0) return null;
                    return (
                      <div className="asec">
                        <div className="asl">recent payments</div>
                        <Card style={{padding:"6px 12px"}}>
                          {payments.map(tx=>(
                            <div key={tx.id} className="ar">
                              <div style={{width:7,height:7,borderRadius:"50%",background:"#8faa8b",flexShrink:0}}/>
                              <div className="an">{tx.notes||"payment"}</div>
                              <div style={{...S.sans,fontSize:"0.75rem",color:"#7a5c3a"}}>{tx.date}</div>
                              <div style={{...S.serif,fontSize:"0.85rem",color:"#4a7c59"}}>-{fmt(tx.amount)}</div>
                            </div>
                          ))}
                        </Card>
                      </div>
                    );
                  })()}
                  <div className="asec" style={{borderTop:"1px solid #f0e8dc",paddingTop:12,marginTop:8}}>
                    <button onClick={()=>{ if(window.confirm(`Remove ${acct.name}?`)){setAccounts(p=>p.filter(a=>a.id!==acct.id));setExpAcct(null);}}}
                      style={{...S.sans,fontSize:"0.72rem",color:"#c88b8b",background:"none",border:"1.5px solid #f0dada",borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>remove account</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={()=>setShowAA(true)} style={{width:"100%",marginTop:4,padding:14,borderRadius:16,border:"1.5px dashed #d4bfa0",background:"transparent",...S.sans,fontSize:"0.82rem",color:"#7a5c3a",cursor:"pointer"}}>+ add account</button>
        <div className="note" style={{marginTop:20}}>your money has a home 🏡</div>
      </>
    );
  }

  // ── MoodRing ──────────────────────────────────────────────────────────────
  function MoodRing({ txs }) {
    const [active, setActive] = useState(null);
    const R=54, r=34, cx=70, cy=70;
    const filtered = txs; // all flow types per user decision
    const groups = FEELINGS.map(f=>({
      ...f,
      txs: filtered.filter(t=>t.feeling===f.v),
      total: filtered.filter(t=>t.feeling===f.v).reduce((s,t)=>s+t.amount,0)
    }));
    const grand = groups.reduce((s,g)=>s+g.total,0);
    let angle=0;
    const segs = groups.map(g=>{
      if(!grand||!g.total) return null;
      const frac=g.total/grand, gap=2.5;
      const s=angle+gap/2, e=angle+frac*360-gap/2;
      angle+=frac*360;
      const isA=active===g.v;
      function arc(a1,a2,R2,r2){
        const mid=(a1+a2)/2, ox=isA?Math.cos((mid-90)*Math.PI/180)*4:0, oy=isA?Math.sin((mid-90)*Math.PI/180)*4:0;
        const p2=(ang,rad)=>({x:cx+rad*Math.cos((ang-90)*Math.PI/180),y:cy+rad*Math.sin((ang-90)*Math.PI/180)});
        const o1=p2(a1,R2),o2=p2(a2,R2),i1=p2(a2,r2),i2=p2(a1,r2);
        const lg=(a2-a1)>180?1:0;
        return `M${o1.x+ox} ${o1.y+oy} A${R2} ${R2} 0 ${lg} 1 ${o2.x+ox} ${o2.y+oy} L${i1.x+ox} ${i1.y+oy} A${r2} ${r2} 0 ${lg} 0 ${i2.x+ox} ${i2.y+oy}Z`;
      }
      return {...g, d:arc(s,e,R,r), isA};
    }).filter(Boolean);
    const am = active ? groups.find(g=>g.v===active) : null;

    return (
      <Card style={{marginBottom:16,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",padding:"18px 22px",gap:8,flexWrap:"wrap"}}>
          <svg width="200" height="200" viewBox="0 0 140 140" style={{flexShrink:0,width:"clamp(140px,18vw,220px)",height:"clamp(140px,18vw,220px)"}}>
            {!grand
              ? <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f0e8dc" strokeWidth={R-r}/>
              : segs.map(sg=>(
                  <path key={sg.v} d={sg.d} fill={sg.isA?sg.color+"dd":sg.color}
                    style={{cursor:"pointer",filter:sg.isA?`drop-shadow(0 2px 6px ${sg.color}88)`:"none",transition:"all 0.2s"}}
                    onClick={()=>setActive(active===sg.v?null:sg.v)}/>
                ))
            }
            <text x={cx} y={cy-10} textAnchor="middle" style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",fill:"#2c2116"}}>
              {am ? am.label.split(" ")[0] : grand ? fmt(grand) : "—"}
            </text>
            <text x={cx} y={cy+8} textAnchor="middle" style={{...S.sans,fontSize:"0.58rem",fill:"#a8906e"}}>
              {am ? fmt(am.total) : `${filtered.length} transactions`}
            </text>
          </svg>
          <div className="mood-breakdown">
            <div style={S.label}>mood breakdown</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {groups.map(g=>{
                const isA=active===g.v;
                return (
                  <div key={g.v} onClick={()=>setActive(active===g.v?null:g.v)} style={{
                    display:"flex",alignItems:"center",gap:8,cursor:"pointer",
                    padding:"5px 8px",borderRadius:8,transition:"all 0.15s",
                    background:isA?g.color+"18":"transparent",
                    border:`1.5px solid ${isA?g.color:"transparent"}`,
                  }}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:g.color,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{...S.sans,fontSize:"0.85rem",fontWeight:isA?500:400}}>{g.label}</div>
                      <div style={{...S.sans,fontSize:"0.72rem",color:"#7a5c3a"}}>{g.txs.length} tx · {fmt(g.total)}</div>
                    </div>
                    <div style={{...S.serif,fontSize:"0.9rem",color:isA?g.color:"#c8b8a0"}}>
                      {grand?((g.total/grand)*100).toFixed(0):0}%
                    </div>
                  </div>
                );
              })}
              {active&&<button onClick={()=>setActive(null)} style={{...S.sans,fontSize:"0.7rem",color:"#7a5c3a",background:"none",border:"none",cursor:"pointer",textAlign:"left",paddingLeft:8}}>← show all</button>}
            </div>
          </div>
        </div>
        {am&&(
          <div style={{borderTop:"1px solid #f0e8dc",padding:"12px 18px",background:"#fdfaf6"}}>
            <div style={S.label}>{am.label} transactions</div>
            <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
              {am.txs.length===0
                ? <div style={{...S.sans,fontSize:"0.82rem",color:"#7a5c3a",fontStyle:"italic"}}>none this period</div>
                : am.txs.map(tx=>{
                    const ac=accounts.find(a=>a.id===tx.account);
                    return (
                      <div key={tx.id} style={{display:"flex",alignItems:"center",gap:9,background:"#fff",border:"1px solid #e8ddd0",borderLeft:`3px solid ${am.color}`,borderRadius:9,padding:"8px 12px"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{...S.sans,fontSize:"0.81rem",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.notes||tx.category}</div>
                          <div style={{...S.sans,fontSize:"0.68rem",color:"#7a5c3a"}}>{tx.date&&`${tx.date} · `}{tx.category}{ac?` · ${ac.name}`:""}</div>
                        </div>
                        <div style={{...S.serif,fontSize:"0.95rem"}}>{fmt(tx.amount)}</div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}
      </Card>
    );
  }

  // ── Monthly Tracker ────────────────────────────────────────────────────────
  function TrackerView() {
    const ptxs    = period==="first"?p1txs:p2txs;
    const pb       = getPB(period);
    const pay      = getPay(period);
    const spent    = ptxs.filter(t=>!t._isDeposit).reduce((s,t)=>s+txSpend(t),0);
    const rollovers = getRollovers();

    return (
      <>
        <StickyMoneyLeft spent={spent} budget={pay} label={period==="first"?"1st–15th · money left":"16th–end · money left"}/>
        <div className="g3">
          <Card><Label>paycheck</Label><div className="cv">{fmt(pay)}</div><div className="cs">{fmt(orderedCats.flatMap(k=>(cats[k]?.items||[])).reduce((a,item)=>a+(pb[item]||0),0))} budgeted</div></Card>
          <Card><Label>spent</Label><div className="cv">{fmt(spent)}</div><div className="cs">{ptxs.filter(t=>!t._isDeposit).length} transactions</div></Card>
          <Card><Label>left</Label><div className={`cv ${pay-spent>=0?"g":"r"}`}>{pay-spent<0?"-":""}{fmt(Math.abs(pay-spent))}</div><div className="cs">{pay-spent<0?"over 😬":"on track ✨"}</div></Card>
          <Card><Label>used</Label><div className={`cv ${pct(spent,pay)>100?"r":pct(spent,pay)>80?"":"g"}`}>{pct(spent,pay).toFixed(0)}%</div><div className="cs">of {period==="first"?"1st–15th":"16th–end"} budget</div></Card>
        </div>

        {rollovers.map(({account, rolloverAmt, paidAmt, remaining})=>{
          const existingPlanKey = getRolloverPlanKey(account.id);
          const existingPlan    = existingPlanKey ? loans[existingPlanKey] : null;
          return (
            <div key={account.id} style={{background:"#7a9ec818",border:"1.5px solid #7a9ec844",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span>💳</span>
                <div style={{flex:1}}>
                  <div style={{...S.sans,fontSize:"0.78rem",fontWeight:500,color:"#1e140a"}}>{account.name} rollover from {MONTHS[curMonth===0?11:curMonth-1]}</div>
                  <div style={{...S.sans,fontSize:"0.70rem",color:"#7a9ec8"}}>
                    {fmt(rolloverAmt)} carried over{paidAmt>0?` · ${fmt(paidAmt)} paid`:""} · <strong>{fmt(remaining)} still owed</strong>
                  </div>
                  {existingPlan && (
                    <div style={{...S.sans,fontSize:"0.67rem",color:"#8faa8b",marginTop:2}}>
                      📋 payment plan · {fmt(existingPlan.monthlyPayment)}/mo · {fmt(existingPlan.paid)} of {fmt(existingPlan.target)} paid
                    </div>
                  )}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{...S.serif,fontSize:"1rem",color:"#7a9ec8"}}>{fmt(remaining)}</div>
                  <button onClick={()=>setPaymentPlanModal({account, remaining, existingPlanKey})}
                    style={{...S.sans,fontSize:"0.65rem",marginTop:4,padding:"3px 8px",borderRadius:6,
                      border:"1px solid #7a9ec8",background:"transparent",color:"#7a9ec8",cursor:"pointer",
                      whiteSpace:"nowrap"}}>
                    {existingPlan ? "update plan" : "set up plan"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Cross-period adjustment notification */}
        {periodAdjNotif?.period===period&&(
          <PeriodAdjNotif notif={periodAdjNotif} onDismiss={()=>setPeriodAdjNotif(null)}/>
        )}

        <MoodRing txs={ptxs}/>

        <div className="tracker-grid">
          {/* Left col: budget tracker */}
          <div>
            <SectionTitle action={
              <div style={{display:"flex",gap:6}}>
                <BtnSm onClick={()=>setShowLI(true)}>⚙️ categories</BtnSm>
                <BtnSm onClick={()=>setShowBE(period)}>✏️ edit budget</BtnSm>
              </div>
            }>budget tracker</SectionTitle>
            <BudgetRows periodTxs={ptxs} budgetMap={pb} period={period}/>
          </div>
          {/* Right col: transactions */}
          <div>
            <SectionTitle>transactions</SectionTitle>
            <TxList txs={ptxs} accounts={accounts} categories={cats} onDelete={id=>delTx(id,period)} onEdit={(id,upd)=>editTx(id,period,upd)}/>
            {showAddTx
              ? <AddTxForm categories={cats} accounts={accounts} onAdd={(tx)=>{ addTx(tx,period); setShowAddTx(false); }} onCancel={()=>setShowAddTx(false)}/>
              : <button className="qadd" onClick={()=>setShowAddTx(true)}>+ add transaction</button>
            }
          </div>
        </div>
        <div className="note">money loves you back 💛</div>
      </>
    );
  }

  // ── Intentions View (Goals + Habits + Deferred Purchases) ─────────────────
  function IntentionsView() {
    const [goalsOpen,  setGoalsOpen]  = useState(true);
    const [loansOpen,  setLoansOpen]  = useState(true);
    const [presetMode, setPresetMode] = useState(true);
    const [showAddHabit, setShowAddHabit] = useState(false);

    // ── Deferred helpers
    const sortedDeferred = [...deferred].sort((a,b)=>{
      if(deferredSort==="date-desc") return (b.addedAt||0)-(a.addedAt||0);
      if(deferredSort==="date-asc")  return (a.addedAt||0)-(b.addedAt||0);
      if(deferredSort==="price-asc") return (parseFloat(a.price)||0)-(parseFloat(b.price)||0);
      if(deferredSort==="price-desc")return (parseFloat(b.price)||0)-(parseFloat(a.price)||0);
      if(deferredSort==="name")      return a.name.localeCompare(b.name);
      return 0;
    });

    // Goals data
    const ge = Object.entries(goals);
    const le = Object.entries(loans);
    const ordered = goalOrder.filter(k=>goals[k]).map(k=>[k,goals[k]]);
    Object.entries(goals).forEach(([k,g])=>{ if(!goalOrder.includes(k)) ordered.push([k,g]); });
    const { getProps, moveUp, moveDown } = useDragSort(goalOrder, setGoalOrder);

    // Habits data
    const today = new Date().toISOString().split("T")[0];
    function getHabitCount(h) {
      if(h.cadence==="monthly"){const prefix=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;return(h.logs||[]).filter(d=>d.startsWith(prefix)).length;}
      if(h.cadence==="yearly") return(h.logs||[]).filter(d=>d.startsWith(String(now.getFullYear()))).length;
      return(h.logs||[]).length;
    }
    function toggleHabitToday(id) {
      setHabits(prev=>{
        const updated=prev.map(h=>{
          if(h.id!==id) return h;
          const logs=h.logs||[];
          const hasToday=logs.includes(today);
          return {...h,logs:hasToday?logs.filter(d=>d!==today):[...logs,today]};
        });
        const h=updated.find(h=>h.id===id);
        const prevH=prev.find(h=>h.id===id);
        if(h&&prevH){
          const getCount=hh=>{
            if(hh.cadence==="monthly"){const prefix=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;return(hh.logs||[]).filter(d=>d.startsWith(prefix)).length;}
            if(hh.cadence==="yearly") return(hh.logs||[]).filter(d=>d.startsWith(String(now.getFullYear()))).length;
            return(hh.logs||[]).length;
          };
          if(getCount(h)>=h.target&&getCount(prevH)<h.target) {
            setHabits(p=>p.map(hh=>hh.id===id?{...hh,celebrationTriggered:true}:hh));
            setTimeout(()=>setHabitComplete({id:h.id,name:h.name,emoji:h.emoji}),300);
          }
        }
        return updated;
      });
    }

    // Only habits where celebration was naturally triggered (via punch-in) but prize not yet claimed
    // Excludes habits that merely have count >= target via log editing
    const unclaimedHabits = habits.filter(h=>h.celebrationTriggered&&!h.lastPrize);

    // Sub-tab pill nav
    const subTabs = [{id:"goals",label:"Goals"},{id:"habits",label:"Habits"},{id:"deferred",label:"Wishlist"}];

    // Banner stats
    const totalSaved   = Object.values(goals).reduce((s,g)=>s+(g.saved||0),0);
    const totalTarget  = Object.values(goals).reduce((s,g)=>s+(g.target||0),0);
    const goalsComplete = Object.values(goals).filter(g=>(g.saved||0)>=(g.target||1)).length;
    const activeHabits = habits.length;
    const habitsDoneToday = habits.filter(h=>(h.logs||[]).includes(new Date().toISOString().split("T")[0])).length;
    const totalLoanPaid = Object.values(loans).reduce((s,l)=>s+(l.paid||0),0);
    const totalLoanOwed = Object.values(loans).reduce((s,l)=>s+Math.max(0,(l.target||0)-(l.paid||0)),0);

    return (
      <>
        {/* Landing banner */}
        <div className="landing-banner hero-grain" style={{background:"linear-gradient(150deg,#3d4a1a 0%,#4a5820 55%,#3a4618 100%)",borderRadius:18,padding:"32px 36px",marginBottom:24,position:"relative",overflow:"hidden"}}>
          <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(165,210,115,0.8)",marginBottom:8}}>committed savings</div>
          <div style={{...S.serif,fontSize:"3rem",color:"#8faa8b",lineHeight:1,marginBottom:6,letterSpacing:"-0.02em"}}>
            {fmt(totalSaved)}
          </div>
          <div style={{...S.sans,fontSize:"0.72rem",color:"#8fa86a",marginBottom:16}}>
            of {fmt(totalTarget)} across {Object.keys(goals).length} goal{Object.keys(goals).length!==1?"s":""}{goalsComplete>0?` · ${goalsComplete} complete ✓`:""}
          </div>
          <div style={{display:"flex",gap:28,flexWrap:"wrap"}}>
            {totalLoanOwed > 0 && (
              <div>
                <div style={{...S.sans,fontSize:"0.62rem",color:"#8fa86a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>loans remaining</div>
                <div style={{...S.serif,fontSize:"1.1rem",color:"#e8a0a0"}}>{fmt(totalLoanOwed)}</div>
              </div>
            )}
            {activeHabits > 0 && (
              <div>
                <div style={{...S.sans,fontSize:"0.62rem",color:"#8fa86a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>habits today</div>
                <div style={{...S.serif,fontSize:"1.1rem",color:"#f0ead8"}}>{habitsDoneToday} / {activeHabits}</div>
              </div>
            )}
            {deferred.length > 0 && (
              <div>
                <div style={{...S.sans,fontSize:"0.62rem",color:"#8fa86a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>on wishlist</div>
                <div style={{...S.serif,fontSize:"1.1rem",color:"#f0ead8"}}>{deferred.length} item{deferred.length!==1?"s":""}</div>
              </div>
            )}
          </div>
        </div>

        {/* Sub-tab pills */}
        <div style={{display:"flex",gap:4,marginBottom:20,background:"#f0e8dc",borderRadius:10,padding:4}}>
          {subTabs.map(t=>(
            <button key={t.id} onClick={()=>{ setIntentionsTab(t.id); if(t.id!=="deferred") setFromHabitCelebration(false); }}
              style={{flex:1,...S.sans,fontSize:"0.75rem",fontWeight:500,padding:"7px 0",borderRadius:7,border:"none",cursor:"pointer",
                background:intentionsTab===t.id?"#2c2116":"transparent",
                color:intentionsTab===t.id?"#faf6f0":"#7a6048",transition:"all 0.15s"}}>
              {t.label}
              {t.id==="deferred"&&deferred.length>0&&<span style={{marginLeft:5,background:intentionsTab===t.id?"#ffffff30":"#c8a88244",borderRadius:8,padding:"1px 6px",fontSize:"0.65rem"}}>{deferred.length}</span>}
            </button>
          ))}
        </div>

        {/* ── GOALS sub-tab ─────────────────────────────────────────────── */}
        {intentionsTab==="goals"&&(<>
          <div style={{...S.sans,fontSize:"0.74rem",color:"#7a5c3a",fontStyle:"italic",marginBottom:14,background:"#f8f2ea",borderRadius:10,padding:"9px 13px",border:"1px solid #e8ddd0"}}>
            💡 <strong>committed</strong> = money set aside or auto-added from linked categories. Drag to reorder.
          </div>

          {/* Savings goals expandable */}
          <button onClick={()=>setGoalsOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",marginBottom:goalsOpen?10:16,padding:"2px 0"}}>
            <div style={{...S.serif,fontSize:"1.05rem",display:"flex",alignItems:"center",gap:8}}>savings<span style={{height:1,background:"#e8ddd0",display:"inline-block",width:40}}/></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button style={{...S.btnPrimary,fontSize:"0.72rem",padding:"4px 10px"}} onClick={e=>{e.stopPropagation();setShowAG(true);}}>+ goal</button>
              <span style={{...S.sans,fontSize:"0.75rem",color:"#7a5c3a"}}>{goalsOpen?"▲":"▼"}</span>
            </div>
          </button>

          {goalsOpen&&ordered.map(([key,g])=>{
            const saved=g.saved||0,target=g.target||1,gp=pct(saved,target),done=saved>=target;
            const linked=g.linkedCategories||[];
            const linkedSpent=allTxs.filter(t=>linked.includes(t.category)).reduce((s,t)=>s+txSpend(t),0);
            const dp=getProps(key);
            const pace = done ? null : getPace(key);
            const paceColor = !pace ? "#8faa8b"
              : pace.status==="urgent"  ? "#c8a882"
              : pace.status==="behind"  ? "#c8a882"
              : pace.status==="lagging" ? "#b8a08a"
              : "#8faa8b";
            const paceUrgent = pace?.status==="urgent" && g.priority==="high";
            return (
              <div key={key} className="gcard" style={{background:"rgba(252,247,238,0.96)",border:"1px solid rgba(210,190,160,0.5)",boxShadow:"0 2px 16px rgba(60,35,10,0.08), 0 1px 0 rgba(255,255,248,0.9) inset"}} draggable={dp.draggable}
                onDragStart={dp.onDragStart} onDragOver={dp.onDragOver} onDrop={dp.onDrop} onDragEnd={dp.onDragEnd}
                data-dragkey={key}
                style={{...dp.style_drag,border:`1px solid ${done?"#8faa8b44":paceUrgent?"#c8a88266":"#e8ddd0"}`}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
                    <div style={{fontSize:"1.5rem",lineHeight:1}}>{g.emoji||"🎯"}</div>
                    {/* Up/down arrows for mobile reorder */}
                    <button onClick={()=>moveUp(key)} style={{background:"none",border:"none",cursor:"pointer",color:"#d4bfa0",fontSize:"0.7rem",padding:"1px 4px",lineHeight:1}} title="move up">▲</button>
                    <button onClick={()=>moveDown(key)} style={{background:"none",border:"none",cursor:"pointer",color:"#d4bfa0",fontSize:"0.7rem",padding:"1px 4px",lineHeight:1}} title="move down">▼</button>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
                      <div style={{...S.serif,fontSize:"1rem",textTransform:"capitalize"}}>{key}</div>
                      <PriorityBadge priority={g.priority}/>
                      {done&&<span style={{...S.sans,fontSize:"0.63rem",fontWeight:500,padding:"2px 7px",borderRadius:10,background:"#8faa8b22",color:"#4a7c59",textTransform:"uppercase"}}>✓ done</span>}
                    </div>
                    <div style={{...S.sans,fontSize:"0.72rem",color:"#7a5c3a"}}>{g.deadline&&`by ${g.deadline}`}</div>
                    {linked.length>0&&<div style={{...S.sans,fontSize:"0.68rem",color:"#7a9ec8",marginTop:3,display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                      🔗{linked.map(c=><span key={c} style={{background:"#7a9ec822",borderRadius:4,padding:"1px 6px"}}>{c}</span>)}
                      {linkedSpent>0&&<span style={{color:"#4a7c59"}}>+{fmt(linkedSpent)} this month</span>}
                    </div>}
                    {g.linkedAccount&&accounts.find(a=>a.id===g.linkedAccount)&&<div style={{...S.sans,fontSize:"0.68rem",color:"#8faa8b",marginTop:2}}>🏦 {accounts.find(a=>a.id===g.linkedAccount)?.name}</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{...S.serif,fontSize:"1.1rem",color:done?"#4a7c59":"#2c2116"}}>{fmt(saved)}</div>
                    <div style={{...S.sans,fontSize:"0.69rem",color:"#7a5c3a",marginBottom:5}}>of {fmt(target)}</div>
                    <div style={{display:"flex",gap:5,justifyContent:"flex-end"}}>
                      <BtnSm onClick={()=>{
                        const isStarred=g.starred;
                        const starCount=Object.values(goals).filter(g=>g.starred).length;
                        if(!isStarred&&starCount>=3) return;
                        setGoals(p=>({...p,[key]:{...p[key],starred:!isStarred}}));
                      }} style={{color:g.starred?"#c8a882":"#d4bfa0",fontSize:"0.82rem",padding:"4px 8px",border:`1.5px solid ${g.starred?"#c8a882":"#e0d0be"}`}}>{g.starred?"⭐":"☆"}</BtnSm>
                      <BtnSm onClick={()=>{setShowGoalM(key);setGoalDraft({...g,savedDraft:String(g.saved||0),targetDraft:String(g.target||0),monthlyDraft:String(actBudg[key]||0),linkedCategories:g.linkedCategories||[],linkedAccount:g.linkedAccount||""});}}>edit</BtnSm>
                      {done&&<BtnSm onClick={()=>{
                        setArchived(p=>({...p,[key]:{...g,archivedAt:Date.now(),type:"goal"}}));
                        setGoals(p=>{ const n={...p}; delete n[key]; return n; });
                        setGoalOrder(p=>p.filter(k=>k!==key));
                      }} style={{color:"#4a7c59",fontSize:"0.66rem",border:"1.5px solid #8faa8b"}}>archive ✓</BtnSm>}
                      <BtnSm onClick={()=>deleteGoal(key)} style={{color:"#7a5c3a",fontSize:"0.66rem"}}>delete</BtnSm>
                    </div>
                  </div>
                </div>
                <ProgressBar value={gp} color="linear-gradient(90deg,#8fa44a,#4f5e2a)" height={10} noShadow/>
                {/* Pace engine */}
                {!done && pace && (
                  <div style={{marginTop:6,display:"flex",flexDirection:"column",gap:2}}>
                    <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.69rem",color:"#7a5c3a"}}>
                      <span>{gp.toFixed(0)}% · {fmt(Math.max(0,target-saved))} to go</span>
                      {pace.monthsLeft > 0 && <span style={{color:"#8a6848"}}>{pace.monthsLeft}mo left</span>}
                    </div>
                    <div style={{
                      display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:7,marginTop:2,
                      background: paceUrgent ? "#c8a88218" : "#f8f3ee",
                      border: paceUrgent ? "1px solid #c8a88244" : "1px solid transparent",
                    }}>
                      <span style={{fontSize:"0.75rem"}}>{paceUrgent?"⚡":"💡"}</span>
                      <span style={{...S.sans,fontSize:"0.68rem",color:paceUrgent?"#8a6a3a":"#7a6048",flex:1}}>
                        {paceUrgent
                          ? `high priority — pick up the pace: ${fmt(pace.pace)}/mo for ${pace.monthsLeft} months to make it`
                          : `suggested pace: ${fmt(pace.pace)}/mo for ${pace.monthsLeft} months`}
                      </span>
                    </div>
                  </div>
                )}
                {done && (
                  <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.69rem",color:"#8faa8b",marginTop:4}}>
                    <span>🎉 goal complete</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Loans expandable */}
          <div style={{height:1,background:"linear-gradient(90deg,#e8ddd0,transparent)",margin:"20px 0 16px"}}/>
          <button onClick={()=>setLoansOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",marginBottom:8,padding:"2px 0"}}>
            <div style={{...S.serif,fontSize:"1.05rem",display:"flex",alignItems:"center",gap:8}}>loans<span style={{height:1,background:"#e8ddd0",display:"inline-block",width:40}}/></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button style={{...S.btnPrimary,fontSize:"0.72rem",padding:"4px 10px"}} onClick={e=>{e.stopPropagation();setShowAL(true);}}>+ loan</button>
              <span style={{...S.sans,fontSize:"0.75rem",color:"#7a5c3a"}}>{loansOpen?"▲":"▼"}</span>
            </div>
          </button>
          <div style={{...S.sans,fontSize:"0.75rem",color:"#7a5c3a",fontStyle:"italic",marginBottom:loansOpen?14:0}}>tracked separately — not held in any account</div>

          {loansOpen&&le.map(([key,loan])=>{
            const paid=loan.paid||0,target=loan.target||1,lp=pct(paid,target),done=paid>=target;
            const remaining=Math.max(0,target-paid),mo=loan.monthlyPayment||0;
            const loanTxs = Object.entries(txns).flatMap(([k,arr])=>
              (arr||[]).filter(t=>t.money_flow==="debt_payment"&&(t.category||"").toLowerCase()===key.toLowerCase())
            ).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);
            return (
              <LoanCard key={key} loanKey={key} loan={loan} paid={paid} target={target} lp={lp} done={done}
                remaining={remaining} mo={mo} loanTxs={loanTxs} accounts={accounts}
                editLoan={editLoan} setEditLoan={setEditLoan} loanDraft={loanDraft} setLoanDraft={setLoanDraft}
                setLoans={setLoans} loans={loans} setTxns={setTxns} curMonth={curMonth} uid={uid}
                setArchived={setArchived}/>
            );
          })}

          {/* Archived goals + loans */}
          {Object.keys(archived).length>0&&(
            <div style={{marginTop:16}}>
              <button onClick={()=>setShowArch(p=>!p)} style={{...S.sans,fontSize:"0.75rem",color:"#7a5c3a",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}>
                <span style={{fontSize:"0.65rem"}}>{showArch?"▼":"▶"}</span>archived ({Object.keys(archived).length})
              </button>
              {showArch&&Object.entries(archived).map(([key,g])=>{
                const isLoan = key.startsWith("loan_");
                const displayName = isLoan ? (g.name||key.replace("loan_","")) : key;
                return (
                  <div key={key} style={{background:"#f8f4ef",borderRadius:12,border:"1px solid #e8ddd0",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,opacity:0.75,marginTop:8}}>
                    <div style={{fontSize:"1.2rem"}}>{g.emoji||(isLoan?"💳":"🎯")}</div>
                    <div style={{flex:1}}>
                      <div style={{...S.sans,fontSize:"0.82rem",fontWeight:500,color:"#4a3020",textTransform:"capitalize"}}>{displayName}</div>
                      {isLoan
                        ? <div style={{...S.sans,fontSize:"0.69rem",color:"#4a7c59"}}>✓ paid off, complete · {fmt(g.target||0)}</div>
                        : <div style={{...S.sans,fontSize:"0.69rem",color:"#8a6848"}}>{fmt(g.saved||0)} of {fmt(g.target||0)}</div>
                      }
                    </div>
                    {!isLoan&&<BtnSm onClick={()=>{setGoals(p=>({...p,[key]:g}));setArchived(p=>{const n={...p};delete n[key];return n;});setGoalOrder(p=>[...p,key]);}}>restore</BtnSm>}
                  </div>
                );
              })}
            </div>
          )}
          <div className="note">every dollar saved is a future you funded 🌱</div>
        </>)}

        {/* ── HABITS sub-tab ────────────────────────────────────────────── */}
        {intentionsTab==="habits"&&(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{...S.sans,fontSize:"0.74rem",color:"#7a5c3a",fontStyle:"italic"}}>🌱 punch in each time you complete a habit. no streaks — just steady progress.</div>
            {habits.length<3
              ? <button style={{...S.btnPrimary,fontSize:"0.72rem",padding:"5px 12px"}} onClick={()=>setShowAddHabit(true)}>+ habit</button>
              : <div style={{...S.sans,fontSize:"0.72rem",color:"#7a5c3a",fontStyle:"italic"}}>3 of 3 — retire one to add more</div>
            }
          </div>

          {/* Unclaimed rewards nudge */}
          {unclaimedHabits.length>0&&(
            <div style={{marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
              {unclaimedHabits.map(h=>(
                <button key={h.id} onClick={()=>setHabitComplete({id:h.id,name:h.name,emoji:h.emoji})}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
                    background:"linear-gradient(135deg,#c8a88218,#8faa8b12)",
                    border:"1.5px solid #c8a88255",borderRadius:12,
                    cursor:"pointer",textAlign:"left",width:"100%",...S.sans}}>
                  <span style={{fontSize:"1.5rem"}}>{h.emoji||"🎉"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.85rem",fontWeight:500,color:"#1e140a"}}>
                      {h.name} — goal complete! 🎁
                    </div>
                    <div style={{fontSize:"0.72rem",color:"#7a5c3a",marginTop:2}}>
                      you haven't claimed your reward yet — tap to celebrate
                    </div>
                  </div>
                  <span style={{...S.sans,fontSize:"0.72rem",color:"#8a5c2a",flexShrink:0}}>claim →</span>
                </button>
              ))}
            </div>
          )}

          {habits.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px",color:"#7a5c3a"}}>
              <div style={{fontSize:"2rem",marginBottom:10}}>🌱</div>
              <div style={{...S.serif,fontSize:"1.1rem",marginBottom:6}}>no habits yet</div>
              <div style={{...S.sans,fontSize:"0.8rem"}}>add your first habit to start tracking</div>
            </div>
          )}

          {habits.map(h=>{
            const count=getHabitCount(h);
            const done=count>=h.target;
            const punchFilled=Array.from({length:h.target},(_,i)=>i<count);
            const punchedToday=(h.logs||[]).includes(today);
            const days=(()=>{const arr=[];for(let i=29;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const ds=d.toISOString().split("T")[0];arr.push({ds,filled:(h.logs||[]).includes(ds)});}return arr;})();
            return (
              <Card key={h.id} style={{marginBottom:14,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                  <div style={{fontSize:"1.6rem",lineHeight:1,flexShrink:0}}>{h.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{...S.sans,fontSize:"0.88rem",fontWeight:500,marginBottom:2}}>{h.name}</div>
                    <div style={{...S.sans,fontSize:"0.68rem",color:"#7a5c3a"}}>
                      {count} of {h.target} · resets {h.cadence}
                      {done&&<span style={{color:"#4a7c59",fontWeight:500}}> · 🎉 goal reached!</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                    <button onClick={()=>toggleHabitToday(h.id)} style={{
                      ...S.sans,fontSize:"0.72rem",fontWeight:500,padding:"6px 13px",borderRadius:20,cursor:"pointer",
                      border:`1.5px solid ${punchedToday?"#8faa8b":"#e0d0be"}`,
                      background:punchedToday?"#8faa8b18":"transparent",
                      color:punchedToday?"#4a7c59":"#7a6048"
                    }}>{punchedToday?"✓ punched":"punch in"}</button>
                    <button onClick={()=>setHabits(p=>p.filter(hh=>hh.id!==h.id))} style={{...S.sans,fontSize:"0.65rem",color:"#6b4c2a",background:"none",border:"none",cursor:"pointer"}}>remove</button>
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{...S.sans,fontSize:"0.62rem",color:"#7a5c3a",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>
                    {h.cadence==="monthly"?"this month":h.cadence==="yearly"?"this year":"all time"} — {count}/{h.target}
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {punchFilled.map((filled,i)=>(
                      <div key={i} style={{width:16,height:16,borderRadius:"50%",transition:"all 0.15s",
                        background:filled?(done?"#8faa8b":"#c8a882"):"transparent",
                        border:`1.5px solid ${filled?(done?"#8faa8b":"#c8a882"):"#d4bfa0"}`}}/>
                    ))}
                  </div>
                </div>
                <div style={{borderTop:"1px solid #f0e8dc",paddingTop:10}}>
                  <div style={{...S.sans,fontSize:"0.62rem",color:"#7a5c3a",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>last 30 days</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                    {days.map(({ds,filled})=>(
                      <div key={ds} onClick={()=>{
                        setHabits(prev=>prev.map(hh=>{
                          if(hh.id!==h.id) return hh;
                          const logs=hh.logs||[];
                          const updated={...hh,logs:logs.includes(ds)?logs.filter(d=>d!==ds):[...logs,ds]};
                          // Check completion
                          const getC=hh2=>{
                            if(hh2.cadence==="monthly"){const prefix=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;return(hh2.logs||[]).filter(d=>d.startsWith(prefix)).length;}
                            if(hh2.cadence==="yearly") return(hh2.logs||[]).filter(d=>d.startsWith(String(now.getFullYear()))).length;
                            return(hh2.logs||[]).length;
                          };
                          if(getC(updated)>=hh.target&&getC(hh)<hh.target) setTimeout(()=>setHabitComplete({id:hh.id,name:hh.name,emoji:hh.emoji}),300);
                          return updated;
                        }));
                      }} title={ds}
                        style={{width:14,height:14,borderRadius:3,cursor:"pointer",transition:"all 0.15s",
                          background:filled?"#c8a882":"#f0e8dc",border:`1px solid ${filled?"#c8a882":"#e0d0be"}`,opacity:ds===today?1:0.75}}/>
                    ))}
                  </div>
                  <div style={{...S.sans,fontSize:"0.62rem",color:"#8a6848",marginTop:4}}>tap any day to toggle</div>
                </div>
              </Card>
            );
          })}

          <div className="note">small habits, tended with care 🌿</div>

          {/* Add habit modal */}
          {showAddHabit&&(
            <AddHabitModal
              newHabit={newHabit}
              setNewHabit={setNewHabit}
              onAdd={()=>{
                setHabits(p=>[...p,{id:uid(),name:newHabit.name.trim(),emoji:newHabit.emoji||"✨",target:parseInt(newHabit.target)||10,cadence:newHabit.cadence,logs:[]}]);
                setNewHabit({name:"",emoji:"✨",target:10,cadence:"monthly"});
                setShowAddHabit(false);
              }}
              onClose={()=>setShowAddHabit(false)}/>
          )}
        </>)}

        {/* ── DEFERRED PURCHASES sub-tab ────────────────────────────────── */}
        {intentionsTab==="deferred"&&(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{...S.sans,fontSize:"0.74rem",color:"#7a5c3a",fontStyle:"italic"}}>✨ things you want — when the time is right</div>
            <button style={{...S.btnPrimary,fontSize:"0.72rem",padding:"5px 12px"}} onClick={()=>setShowAddDeferred(true)}>+ add</button>
          </div>

          {/* Sort controls */}
          {deferred.length>1&&(
            <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap"}}>
              {[{id:"date-desc",label:"newest"},{id:"date-asc",label:"oldest"},{id:"price-asc",label:"price ↑"},{id:"price-desc",label:"price ↓"},{id:"name",label:"A–Z"}].map(s=>(
                <button key={s.id} onClick={()=>setDeferredSort(s.id)}
                  style={{...S.sans,fontSize:"0.7rem",padding:"4px 10px",borderRadius:14,cursor:"pointer",
                    border:`1.5px solid ${deferredSort===s.id?"#c8a882":"#e0d0be"}`,
                    background:deferredSort===s.id?"#c8a88222":"transparent",
                    color:deferredSort===s.id?"#2c2116":"#7a6048"}}>
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {deferred.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px",color:"#7a5c3a"}}>
              <div style={{fontSize:"2rem",marginBottom:10}}>✨</div>
              <div style={{...S.serif,fontSize:"1.1rem",marginBottom:6}}>your wishlist is empty</div>
              <div style={{...S.sans,fontSize:"0.8rem"}}>add things you want to buy someday — no guilt, just intention</div>
            </div>
          )}

          {fromHabitCelebration && deferred.length > 0 && (
            <div style={{background:"#c8a88218",border:"1.5px solid #c8a88244",borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:"1.2rem"}}>🎁</span>
              <div style={{...S.sans,fontSize:"0.78rem",color:"#8a6a3a"}}>
                <strong>you earned a treat!</strong> pin up to {3-pinnedTreats.length} item{3-pinnedTreats.length!==1?"s":""} to your home screen as a reminder.
              </div>
            </div>
          )}

          {sortedDeferred.map(item=>{
            const hasPrice = item.price||item.priceMax;
            const priceLabel = item.price&&item.priceMax ? `${fmt(parseFloat(item.price))} – ${fmt(parseFloat(item.priceMax))}` : item.price ? fmt(parseFloat(item.price)) : item.priceMax ? `up to ${fmt(parseFloat(item.priceMax))}` : null;
            const addedDate = item.addedAt ? new Date(item.addedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : null;
            const isPinned = pinnedTreats.some(t=>t.id===item.id);
            const canPin = fromHabitCelebration && pinnedTreats.length < 3 && !isPinned;
            return (
              <div key={item.id} style={{background:"#fff",border:`1px solid ${isPinned?"#c8a88266":"#e8ddd0"}`,borderRadius:12,padding:"13px 15px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                    <div style={{...S.sans,fontSize:"0.88rem",fontWeight:500}}>{item.name}</div>
                    {isPinned&&<span style={{...S.sans,fontSize:"0.6rem",background:"#c8a88233",color:"#8a6a3a",borderRadius:6,padding:"1px 6px"}}>📌 on home</span>}
                  </div>
                  {item.notes&&<div style={{...S.sans,fontSize:"0.72rem",color:"#7a5c3a",fontStyle:"italic",marginBottom:3}}>{item.notes}</div>}
                  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                    {priceLabel&&<span style={{...S.serif,fontSize:"0.88rem",color:"#4a7c59"}}>{priceLabel}</span>}
                    {addedDate&&<span style={{...S.sans,fontSize:"0.67rem",color:"#8a6848"}}>added {addedDate}</span>}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0,alignItems:"flex-end"}}>
                  {canPin&&(
                    <BtnSm onClick={()=>setPinnedTreats(p=>[...p,{...item,fromHabitId:habitComplete?.id||"manual"}])}
                      style={{background:"#c8a882",color:"#2c2116",border:"none",fontSize:"0.7rem",whiteSpace:"nowrap"}}>
                      📌 pin to home
                    </BtnSm>
                  )}
                  {isPinned&&(
                    <BtnSm onClick={()=>setPinnedTreats(p=>p.filter(t=>t.id!==item.id))}
                      style={{color:"#7a5c3a",fontSize:"0.7rem",whiteSpace:"nowrap"}}>
                      unpin
                    </BtnSm>
                  )}
                  <BtnSm onClick={()=>setBuyDeferred(item)} style={{background:"#2c2116",color:"#faf6f0",border:"none",fontSize:"0.7rem"}}>bought it</BtnSm>
                  <BtnSm onClick={()=>setDeferred(p=>p.filter(d=>d.id!==item.id))} style={{color:"#c88b8b",fontSize:"0.7rem"}}>remove</BtnSm>
                </div>
              </div>
            );
          })}

          <div className="note">someday is closer than you think 🌿</div>

          {/* Add deferred modal */}
          {showAddDeferred&&(
            <AddDeferredModal
              newDeferred={newDeferred}
              setNewDeferred={setNewDeferred}
              onAdd={()=>{
                setDeferred(p=>[...p,{id:uid(),name:newDeferred.name.trim(),price:newDeferred.price,priceMax:newDeferred.priceMax,notes:newDeferred.notes,addedAt:Date.now()}]);
                setNewDeferred({name:"",price:"",priceMax:"",notes:""});
                setShowAddDeferred(false);
              }}
              onClose={()=>setShowAddDeferred(false)}/>
          )}

          {/* Buy it modal */}
          {buyDeferred&&(
            <Modal title="you got it! 🎉" onClose={()=>setBuyDeferred(null)} footer={null}>
              <div style={{paddingTop:16,display:"flex",flexDirection:"column",gap:14,paddingBottom:20}}>
                <div style={{textAlign:"center",padding:"12px 0"}}>
                  <div style={{...S.serif,fontSize:"1.2rem",marginBottom:4}}>congrats on <em>{buyDeferred.name}</em> ✨</div>
                  <div style={{...S.sans,fontSize:"0.78rem",color:"#7a5c3a"}}>want to log this as a transaction?</div>
                </div>
                {[
                  {id:"log", label:"📝 log as transaction", desc:"record it in your monthly spending"},
                  {id:"remove", label:"✅ just remove it", desc:"no transaction, just clear it from the list"},
                ].map(opt=>(
                  <button key={opt.id} onClick={()=>{
                    if(opt.id==="log"){
                      // Pre-fill tx with item name and price
                      const prefillNote = `habit treat! ${buyDeferred.name}`;
                      const prefillAmt  = buyDeferred.price ? String(buyDeferred.price) : "";
                      setTreatTxPrefill({note:prefillNote, amount:prefillAmt});
                      setShowAddTxPage(true);
                      // Also remove from pinned treats if it was pinned
                      setPinnedTreats(p=>p.filter(t=>t.id!==buyDeferred.id));
                    }
                    setDeferred(p=>p.filter(d=>d.id!==buyDeferred.id));
                    setBuyDeferred(null);
                  }} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,cursor:"pointer",textAlign:"left",border:"1.5px solid #e0d0be",background:"#fff",...S.sans}}>
                    <div>
                      <div style={{fontSize:"0.85rem",fontWeight:500}}>{opt.label}</div>
                      <div style={{fontSize:"0.72rem",color:"#7a5c3a",marginTop:2}}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Modal>
          )}
        </>)}
      </>
    );
  }

  // ── Year view (nested inside Monthly tab) ────────────────────────────────
  function YearView() {
    const liquid = accounts.filter(a=>a.type!=="credit").reduce((s,a)=>s+a.balance,0);
    const debt   = accounts.filter(a=>a.type==="credit").reduce((s,a)=>s+a.balance,0);
    const loanDebt = Object.values(loans).reduce((s,l)=>s+Math.max(0,(l.target||0)-(l.paid||0)),0);
    const ytdEarned = Array.from({length:curMonth+1},(_,i)=>mIncome[i]??DEF_INCOME).reduce((a,b)=>a+b,0);
    const ytdSpent  = Array.from({length:curMonth+1},(_,i)=>{
      const mk2=String(i);
      return [...(txns[`${mk2}_first`]||[]),...(txns[`${mk2}_second`]||[])].filter(t=>!t._isDeposit).reduce((a,t)=>a+txSpend(t),0);
    }).reduce((a,b)=>a+b,0);
    const ytdSaved  = liquid;
    const ytdFuture = Object.values(goals).reduce((s,g)=>s+(g.saved||0),0);

    // ── Year Plan state ──────────────────────────────────────────────────────
    // (yearMode, barDrag, livePlan, pressureSheet, pressureSelections, newGoalHighlight live at App level)
    const [editingCell, setEditingCell]   = useState(null);
    const [cellDraft, setCellDraft]       = useState("");
    const [expandedPast, setExpandedPast] = useState(false);
    const [showCompletedFocus, setShowCompletedFocus] = useState(false);
    const [dragCell, setDragCell]         = useState(null);
    const [dragYearPlan, setDragYearPlan] = useState(null);
    const tableRef = useRef(null);
    // Aliases so inner code is unchanged
    const newGoalHighlight    = yearNewGoalHL;
    const setNewGoalHighlight = setYearNewGoalHL;
    const pressureSheet       = yearPressureSheet;
    const setPressureSheet    = setYearPressureSheet;
    const pressureSelections  = yearPressureSel;
    const setPressureSelections = setYearPressureSel;
    const barDrag             = yearBarDrag;
    const setBarDrag          = setYearBarDrag;
    const livePlan            = yearLivePlan;
    const setLivePlan         = setYearLivePlan;

    // Pick up new-goal navigation signal
    useEffect(()=>{
      const key = window.__pachiraNewGoal;
      if (key) {
        window.__pachiraNewGoal = null;
        setYearMode("detailed");
        setNewGoalHighlight(key);
        setTimeout(()=>setNewGoalHighlight(null), 4000);
      }
    });

    // Window-level mouse listeners for bar drag (so drag works outside the element)
    useEffect(()=>{
      function onMove(e) {
        if (!barDrag) return;
        const {goalKey,edge,startX,origStart,origEnd,colW} = barDrag;
        // Continuous delta for live preview (not snapped) — snapping happens on release
        const rawDelta = (e.clientX - startX) / colW;
        const snappedDelta = Math.round(rawDelta);
        let ws=origStart, we=origEnd;
        if (edge==="left")  ws=Math.max(0,Math.min(origStart+snappedDelta,we));
        if (edge==="right") we=Math.max(ws,Math.min(origEnd+snappedDelta,11));

        // Recalculate per-month amount: remaining / new window length
        const g = goals[goalKey]||{};
        const remaining = Math.max(0,(g.target||0)-(g.saved||0));
        const windowLen = we - ws + 1;
        const perMo = windowLen > 0 ? Math.ceil(remaining / windowLen) : 0;

        const newPlan={};
        for(let i=0;i<12;i++) newPlan[i]=i>=ws&&i<=we?perMo:0;

        // Store both the plan and the live pixel offset for smooth preview
        setLivePlan(prev=>({
          ...(prev||{}),
          [goalKey]: newPlan,
          __dragMeta: { goalKey, edge, rawDelta, ws, we, perMo }
        }));
      }
      function onUp() {
        if (!barDrag) return;
        const {goalKey} = barDrag;
        const meta = livePlan?.__dragMeta;
        const newGoalPlan = livePlan?.[goalKey];
        if (newGoalPlan) {
          let maxOver=0;
          for(let i=thisMonthIdx;i<12;i++){
            const inc=mIncome[i]??DEF_INCOME;
            let tot=0;
            ROWS.forEach(s=>s.rows.forEach(r=>{
              tot += r.type==="goal" ? (newGoalPlan[i]??0) : (yearPlan[r.key]?.[i]??actBudg[r.key]??0);
            }));
            maxOver=Math.max(maxOver,tot-inc);
          }
          if (maxOver>10) {
            // Build initial adjustable values for pressure sheet
            const initAdj={};
            [...(ROWS.find(s=>s.section==="Essentials")?.rows||[]),
             ...(ROWS.find(s=>s.section==="Loans")?.rows||[]),
             ...(ROWS.find(s=>s.section==="Other")?.rows||[]),
             ...(ROWS.find(s=>s.section==="Savings Goals")?.rows||[]).filter(r=>r.key!==goalKey),
            ].forEach(r=>{ initAdj[r.key]=getPlanned(r.key,r.type,thisMonthIdx); });
            setPressureSheet({delta:maxOver,goalKey,draftPlan:{[goalKey]:newGoalPlan},adjustable:initAdj});
            setPressureSelections({});
          } else {
            setYearPlan(prev=>({...prev,[goalKey]:{...(prev[goalKey]||{}),...newGoalPlan}}));
          }
        }
        setBarDrag(null);
        setLivePlan(null);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup",   onUp);
      return ()=>{
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup",   onUp);
      };
    }, [yearBarDrag, yearLivePlan, goals, yearPlan, mIncome, actBudg]);

    const thisMonthIdx = now.getMonth();

    // Write a goal amount to yearPlan for a specific month
    function setGoalMonthPlan(rowKey, monthIdx, val) {
      setYearPlan(prev=>({
        ...prev,
        [rowKey]: { ...(prev[rowKey]||{}), [monthIdx]: val }
      }));
    }

    // Update yearPlan cell (for all row types)
    function saveCellDraft(rowKey, rowType, monthIdx) {
      const val = parseFloat(cellDraft) || 0;
      setYearPlan(prev=>({
        ...prev,
        [rowKey]: { ...(prev[rowKey]||{}), [monthIdx]: val }
      }));
      setEditingCell(null);
      setCellDraft("");
    }
    function getActual(category, monthIdx) {
      const mk2 = String(monthIdx);
      const mTxs = [...(txns[`${mk2}_first`]||[]),...(txns[`${mk2}_second`]||[])];
      return mTxs.filter(t=>t.category===category).reduce((s,t)=>s+txSpend(t),0);
    }

    // Helper: get planned amount for a row in a month
    function getPlanned(rowKey, rowType, monthIdx) {
      if (rowType==="loan") {
        return loans[rowKey]?.monthlyPayment || 0;
      }
      if (rowType==="goal") {
        // yearPlan is source of truth; fall back to suggestedPace for current month
        const g = goals[rowKey];
        if (!g) return 0;
        if (yearPlan[rowKey]?.[monthIdx] != null) return yearPlan[rowKey][monthIdx];
        // Default: use suggested pace
        const pace = getPace(rowKey);
        return pace.pace || 0;
      }
      // essentials / variable: yearPlan per month
      return yearPlan[rowKey]?.[monthIdx] ?? actBudg[rowKey] ?? 0;
    }

    // Build section rows
    const essentialItems = cats["essentials"]?.items || [];
    const miscItems      = cats["misc"]?.items || [];
    const variableItems  = [...new Set([...miscItems, ...Object.keys(DEF_BUDGETS).filter(k=>
      !essentialItems.includes(k) && !Object.keys(loans).includes(k) && !Object.keys(goals).includes(k)
    )])].filter(item => (actBudg[item]||0) > 0 || Object.values(yearPlan[item]||{}).some(v=>v>0));

    const ROWS = [
      { section:"Essentials", color:"#8a5c2a", rows: essentialItems.map(k=>({key:k,type:"essential",label:k})) },
      { section:"Savings Goals", color:"#8faa8b", rows: goalOrder.filter(k=>goals[k]).map(k=>({key:k,type:"goal",label:k,emoji:goals[k].emoji,deadline:goals[k].deadline})) },
      { section:"Loans", color:"#a89bc8", rows: Object.keys(loans).map(k=>({key:k,type:"loan",label:k,emoji:loans[k].emoji,deadline:loans[k].deadline})) },
      { section:"Other", color:"#c8907a", rows: miscItems.filter(k=>actBudg[k]>0).map(k=>({key:k,type:"misc",label:k})) },
    ].filter(s=>s.rows.length>0);

    // Income per month
    function getIncome(monthIdx) { return mIncome[monthIdx]??DEF_INCOME; }

    // Disposable = income - sum of planned
    function getDisposable(monthIdx) {
      const inc = getIncome(monthIdx);
      const planned = ROWS.flatMap(s=>s.rows).reduce((sum,row)=>sum+getPlanned(row.key,row.type,monthIdx),0);
      return inc - planned;
    }
    function getDisposableActual(monthIdx) {
      if (monthIdx > thisMonthIdx) return null;
      const mk2=String(monthIdx);
      const spent=[...(txns[`${mk2}_first`]||[]),...(txns[`${mk2}_second`]||[])].reduce((a,t)=>a+txSpend(t),0);
      return getIncome(monthIdx) - spent;
    }

    // Status for a cell: null=future, "on_track", "behind", "done"
    function getCellStatus(rowKey, rowType, monthIdx) {
      if (monthIdx > thisMonthIdx) return "future";
      const planned = getPlanned(rowKey, rowType, monthIdx);
      const actual  = getActual(rowKey, monthIdx);
      if (planned === 0) return actual > 0 ? "behind" : "future";
      if (actual >= planned) return "on_track";
      if (monthIdx < thisMonthIdx) return "behind"; // past month, didn't hit target
      // current month: partial is ok
      return actual > 0 ? "on_track" : "neutral";
    }


    const statusColor = { on_track:"#4a7c59", behind:"#b85050", future:"#c8c0b4", neutral:"#c8a882" };
    const statusDot   = { on_track:"#8faa8b", behind:"#c88b8b", future:"#e0d6cc", neutral:"#c8a882" };

    // Months to show in Focus mode: current + future (past collapsed)
    const pastMonths   = Array.from({length:thisMonthIdx},(_,i)=>i);
    const activeMonths = Array.from({length:12-thisMonthIdx},(_,i)=>i+thisMonthIdx);

    // ── Render: Overview mode ─────────────────────────────────────────────────
    function renderReview() {
      const isMobileR = typeof window !== "undefined" && window.innerWidth < 640;

      // ── Month detail panel (slides in from right) ─────────────────────────
      function MonthDetailPanel({ monthIdx, onClose }) {
        const isPast    = monthIdx < thisMonthIdx;
        const isCurrent = monthIdx === thisMonthIdx;
        const mk2       = String(monthIdx);
        const mTxs      = [...(txns[`${mk2}_first`]||[]),...(txns[`${mk2}_second`]||[])];
        const monthInc  = mIncome[monthIdx] ?? DEF_INCOME;
        const spent     = mTxs.filter(t=>!t._isDeposit).reduce((s,t)=>s+txSpend(t),0);
        const planned   = ROWS.flatMap(s=>s.rows).reduce((s,row)=>s+getPlanned(row.key,row.type,monthIdx),0);
        const leftover  = monthInc - spent;
        const leftoverPlanned = monthInc - planned;

        // Only categories with activity (spent>0 or planned>0)
        const activeSections = ROWS.map(section=>({
          ...section,
          rows: section.rows.filter(row=>{
            const p = getPlanned(row.key, row.type, monthIdx);
            const a = getActual(row.key, monthIdx);
            return p > 0 || a > 0;
          })
        })).filter(s=>s.rows.length>0);

        return (
          <div style={{
            position:"absolute", inset:0, background:"#faf6f0", zIndex:10,
            transform: selectedReviewMonth !== null ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
            display:"flex", flexDirection:"column", borderRadius:"inherit",
            overflow:"hidden",
          }}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px 12px",borderBottom:"1px solid #e8ddd0",flexShrink:0}}>
              <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#7a5c3a",fontSize:"1.1rem",padding:"2px 4px",marginLeft:-4}}>←</button>
              <div style={{...S.serif,fontSize:"1.1rem",flex:1}}>{MONTHS[monthIdx]}</div>
              <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,padding:"2px 8px",borderRadius:10,
                background:isPast?"#f0e8dc":isCurrent?"#c8a88222":"#f5ede4",
                color:isPast?"#a8906e":isCurrent?"#8a6a3a":"#b8a08a"}}>
                {isPast?"past":isCurrent?"current":"upcoming"}
              </div>
            </div>

            {/* Summary strip */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,borderBottom:"1px solid #e8ddd0",flexShrink:0}}>
              {[
                {label:"income",   value:fmt(monthInc),               color:"#1e140a"},
                {label:"spent",    value:isPast||isCurrent?fmt(spent):"—", color:spent>monthInc?"#b85050":"#3d2b1f"},
                {label:isPast||isCurrent?"leftover":"planned left",
                 value:isPast||isCurrent?(leftover>=0?`+${fmt(leftover)}`:`-${fmt(Math.abs(leftover))}`):(leftoverPlanned>=0?`+${fmt(leftoverPlanned)}`:`-${fmt(Math.abs(leftoverPlanned))}`),
                 color:((isPast||isCurrent)?leftover:leftoverPlanned)>=0?GREEN:"#b85050"},
              ].map(({label,value,color})=>(
                <div key={label} style={{padding:"10px 12px",textAlign:"center",borderRight:"1px solid #f0e8dc"}}>
                  <div style={{...S.sans,fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.06em",color:"#7a5c3a",marginBottom:3}}>{label}</div>
                  <div style={{...S.serif,fontSize:"0.95rem",color}}>{value}</div>
                </div>
              ))}
            </div>

            {/* Category breakdown — scrollable */}
            <div style={{overflowY:"auto",flex:1,padding:"12px 16px",WebkitOverflowScrolling:"touch"}}>
              {activeSections.length === 0 && (
                <div style={{...S.sans,fontSize:"0.8rem",color:"#7a5c3a",fontStyle:"italic",textAlign:"center",padding:"32px 0"}}>
                  no activity this month
                </div>
              )}
              {activeSections.map(section=>(
                <div key={section.section} style={{marginBottom:16}}>
                  <div style={{...S.sans,fontSize:"0.62rem",fontWeight:600,letterSpacing:"0.09em",textTransform:"uppercase",color:"#4a3020",marginBottom:8}}>{section.section}</div>
                  {section.rows.map(row=>{
                    const planned = getPlanned(row.key, row.type, monthIdx);
                    const actual  = isPast||isCurrent ? getActual(row.key, monthIdx) : null;
                    const status  = getCellStatus(row.key, row.type, monthIdx);
                    const over    = actual != null && planned > 0 && actual > planned;
                    const under   = actual != null && planned > 0 && actual < planned && isPast;
                    return (
                      <div key={row.key} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #f5ede4"}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:statusDot[status],flexShrink:0}}/>
                        <div style={{...S.sans,fontSize:"0.8rem",color:"#2a1f14",flex:1,textTransform:"capitalize"}}>
                          {row.emoji&&<span style={{marginRight:4}}>{row.emoji}</span>}{row.label}
                        </div>
                        <div style={{textAlign:"right"}}>
                          {actual!=null&&(
                            <div style={{...S.sans,fontSize:"0.8rem",fontWeight:500,color:over?"#b85050":under?"#6b7c3f":"#3d2b1f"}}>
                              {fmt(actual)}
                            </div>
                          )}
                          {planned>0&&(
                            <div style={{...S.sans,fontSize:"0.65rem",color:"#8a6848"}}>
                              {actual!=null?"/ ":""}{fmt(planned)} planned
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{height:16}}/>
            </div>
          </div>
        );
      }

      // ── Dot grid (Overview) ───────────────────────────────────────────────
      function DotGrid() {
        return (
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:420}}>
              <thead>
                <tr>
                  <th style={{...S.sans,fontSize:"0.63rem",textTransform:"uppercase",letterSpacing:"0.06em",color:"#7a5c3a",textAlign:"left",padding:"4px 6px 8px 0",minWidth:90}}/>
                  {MONTHS.map((m,i)=>(
                    <th key={i} onClick={()=>setSelectedReviewMonth(i)}
                      style={{...S.sans,fontSize:"0.63rem",color:i===thisMonthIdx?"#6b7c3f":"#a8906e",fontWeight:i===thisMonthIdx?700:400,
                        textAlign:"center",padding:"4px 2px 8px",minWidth:22,cursor:"pointer",userSelect:"none"}}>
                      {m.slice(0,1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(section=>(
                  <React.Fragment key={section.section}>
                    <tr>
                      <td colSpan={13} style={{...S.sans,fontSize:"0.58rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#4a3020",padding:"8px 0 3px"}}>
                        {section.section}
                      </td>
                    </tr>
                    {section.rows.map(row=>(
                      <tr key={row.key}>
                        <td style={{...S.sans,fontSize:"0.72rem",color:"#2a1f14",padding:"3px 6px 3px 0",textTransform:"capitalize",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {row.emoji&&<span style={{marginRight:3}}>{row.emoji}</span>}{row.label}
                        </td>
                        {MONTHS.map((_,i)=>{
                          const status = getCellStatus(row.key, row.type, i);
                          const isCur  = i===thisMonthIdx;
                          return (
                            <td key={i} style={{textAlign:"center",padding:"3px 2px",cursor:"pointer"}}
                              onClick={()=>setSelectedReviewMonth(i)}>
                              <div style={{width:isCur?10:8,height:isCur?10:8,borderRadius:"50%",background:statusDot[status],margin:"auto",
                                boxShadow:isCur?"0 0 0 2px #c8a88244":"none",transition:"all 0.15s"}}/>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {/* Disposable row */}
                <tr><td colSpan={13} style={{...S.sans,fontSize:"0.58rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#4a3020",padding:"8px 0 3px"}}>Disposable</td></tr>
                <tr>
                  <td style={{...S.sans,fontSize:"0.72rem",color:"#2a1f14",padding:"3px 6px 3px 0"}}>leftover</td>
                  {MONTHS.map((_,i)=>{
                    const d=getDisposable(i), status=i>thisMonthIdx?"future":d>=0?"on_track":"behind";
                    return (
                      <td key={i} style={{textAlign:"center",padding:"3px 2px",cursor:"pointer"}} onClick={()=>setSelectedReviewMonth(i)}>
                        <div style={{width:i===thisMonthIdx?10:8,height:i===thisMonthIdx?10:8,borderRadius:"50%",background:statusDot[status],margin:"auto",
                          boxShadow:i===thisMonthIdx?"0 0 0 2px #c8a88244":"none"}}/>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
            {/* Legend */}
            <div style={{...S.sans,fontSize:"0.63rem",color:"#8a6848",marginTop:10,display:"flex",gap:12,flexWrap:"wrap"}}>
              {[["#8faa8b","on track"],["#c88b8b","behind"],["#c8a882","this month"],["#e0d6cc","future"]].map(([c,l])=>(
                <span key={l} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:7,height:7,borderRadius:"50%",background:c,display:"inline-block"}}/>{l}</span>
              ))}
            </div>
            <div style={{...S.sans,fontSize:"0.63rem",color:"#8a6848",marginTop:5,fontStyle:"italic"}}>tap any month to review</div>
          </div>
        );
      }

      // ── Month list ────────────────────────────────────────────────────────
      function MonthList() {
        return (
          <div style={{marginTop:16}}>
            <div style={{...S.sans,fontSize:"0.62rem",fontWeight:600,letterSpacing:"0.09em",textTransform:"uppercase",color:"#4a3020",marginBottom:8}}>months</div>
            {MONTHS.map((_,i)=>{
              const mk2   = String(i);
              const mTxs  = [...(txns[`${mk2}_first`]||[]),...(txns[`${mk2}_second`]||[])];
              const inc   = mIncome[i] ?? DEF_INCOME;
              const spent = mTxs.filter(t=>!t._isDeposit).reduce((s,t)=>s+txSpend(t),0);
              const left  = inc - spent;
              const isPast    = i < thisMonthIdx;
              const isCurrent = i === thisMonthIdx;
              const isFuture  = i > thisMonthIdx;
              const dispPlanned = getDisposable(i);
              const hasWin = winMonths.has(i);
              return (
                <button key={i} onClick={()=>setSelectedReviewMonth(i)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:10,
                    padding:"9px 10px",borderRadius:10,marginBottom:4,cursor:"pointer",
                    border:`1px solid ${isCurrent?"#c8a88266":hasWin?"#c8a88233":"#f0e8dc"}`,
                    background:isCurrent?"#fdf8f2":hasWin?"#fdf8f4":"transparent",
                    textAlign:"left"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,
                    background:isPast?(left>=0?GREEN:"#b85050"):isCurrent?"#c8a882":"#e0d6cc"}}/>
                  <div style={{...S.sans,fontSize:"0.82rem",color:"#1e140a",flex:1,fontWeight:isCurrent?500:400}}>
                    {MONTHS[i].slice(0,3)}
                    {isCurrent&&<span style={{...S.sans,fontSize:"0.62rem",color:"#8a5c2a",marginLeft:6,fontWeight:400}}>current</span>}
                    {hasWin&&<span style={{marginLeft:6,fontSize:"0.72rem"}} title="goal or loan completed this month">🏆</span>}
                  </div>
                  <div style={{...S.serif,fontSize:"0.88rem",
                    color:isFuture?"#b8a08a":((isPast||isCurrent)&&left<0)?"#b85050":GREEN}}>
                    {isFuture
                      ? (dispPlanned>=0?`+${fmt(dispPlanned)}`:`-${fmt(Math.abs(dispPlanned))}`)
                      : (left>=0?`+${fmt(left)}`:`-${fmt(Math.abs(left))}`)}
                  </div>
                  <div style={{...S.sans,fontSize:"0.65rem",color:"#6b4c2a"}}>›</div>
                </button>
              );
            })}
          </div>
        );
      }

      return (
        <div style={{position:"relative",overflow:"hidden",minHeight:400}}>
          {/* Base: dot grid + month list */}
          <div style={{
            transform: selectedReviewMonth !== null ? "translateX(-100%)" : "translateX(0)",
            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <DotGrid/>
            <MonthList/>
          </div>

          {/* Detail panel slides in from right */}
          {selectedReviewMonth !== null && (
            <MonthDetailPanel
              monthIdx={selectedReviewMonth}
              onClose={()=>setSelectedReviewMonth(null)}/>
          )}
        </div>
      );
    }

    // ── Render: Plan mode (bars for goals, grid for essentials/loans) ──────────
    function renderDetailed() {
      const COL_MIN_W = 64;
      const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

      function getGoalWindow(goalKey) {
        const plan = yearPlan[goalKey] || {};
        const months = Object.keys(plan).map(Number).filter(m => (plan[m]||0) > 0);
        if (months.length === 0) {
          const g = goals[goalKey];
          const pace = getPace(goalKey);
          const start = thisMonthIdx;
          const end = Math.min(11, start + Math.max(1,(pace.monthsLeft||3)) - 1);
          return [start, end];
        }
        return [Math.min(...months), Math.max(...months)];
      }

      function getGoalMonthVal(goalKey, monthIdx) {
        if ((yearPlan[goalKey]||{})[monthIdx] != null) return yearPlan[goalKey][monthIdx];
        const [ws, we] = getGoalWindow(goalKey);
        if (monthIdx < ws || monthIdx > we) return 0;
        return getPace(goalKey).pace || 0;
      }

      function getEffectiveGoalVal(goalKey, monthIdx) {
        if (livePlan?.[goalKey]?.[monthIdx] != null) return livePlan[goalKey][monthIdx];
        return getGoalMonthVal(goalKey, monthIdx);
      }

      function getEffectiveWindow(goalKey) {
        const meta = livePlan?.__dragMeta;
        if (meta && meta.goalKey === goalKey) return [meta.ws, meta.we];
        return getGoalWindow(goalKey);
      }

      function getEffectivePerMo(goalKey) {
        const meta = livePlan?.__dragMeta;
        if (meta && meta.goalKey === goalKey) return meta.perMo;
        const [ws,we] = getGoalWindow(goalKey);
        return getEffectiveGoalVal(goalKey, ws);
      }

      function startBarDrag(e, goalKey, edge) {
        e.preventDefault(); e.stopPropagation();
        const [ws, we] = getGoalWindow(goalKey);
        const tableW = tableRef.current?.offsetWidth || (12*COL_MIN_W+130);
        const colW = (tableW-130)/12;
        setBarDrag({goalKey,edge,startX:e.clientX,origStart:ws,origEnd:we,colW});
        setLivePlan(null);
      }

      // Mobile: tap handles to shift window by 1 month
      function shiftWindow(goalKey, edge, dir) {
        const [ws, we] = getGoalWindow(goalKey);
        const g = goals[goalKey]||{};
        const remaining = Math.max(0,(g.target||0)-(g.saved||0));
        let nws = ws, nwe = we;
        if (edge==="left")  nws = Math.max(0, Math.min(ws+dir, we));
        if (edge==="right") nwe = Math.max(ws, Math.min(we+dir, 11));
        const windowLen = nwe - nws + 1;
        const perMo = windowLen > 0 ? Math.ceil(remaining/windowLen) : 0;
        const newPlan={};
        for(let i=0;i<12;i++) newPlan[i]=i>=nws&&i<=nwe?perMo:0;
        setYearPlan(prev=>({...prev,[goalKey]:{...(prev[goalKey]||{}),...newPlan}}));
      }

      // Shared pressure sheet rendering
      const pressureSheetEl = pressureSheet&&(()=>{
        const adjRows = [
          ...(ROWS.find(s=>s.section==="Essentials")?.rows||[]),
          ...(ROWS.find(s=>s.section==="Loans")?.rows||[]),
          ...(ROWS.find(s=>s.section==="Other")?.rows||[]),
          ...(ROWS.find(s=>s.section==="Savings Goals")?.rows||[]).filter(r=>r.key!==pressureSheet.goalKey),
        ];
        const adj = pressureSheet.adjustable || {};
        const totalAdj = adjRows.reduce((s,r)=>s+(adj[r.key]??getPlanned(r.key,r.type,thisMonthIdx)),0);
        const newGoalMo = Object.values(pressureSheet.draftPlan[pressureSheet.goalKey]||{}).find(v=>v>0) || 0;
        const inc = getIncome(thisMonthIdx);
        const totalWithGoal = totalAdj + newGoalMo;
        const over = totalWithGoal - inc;
        const isOver = over > 0;
        const fillPct = Math.min((totalWithGoal/inc)*100, 130);
        function updateAdj(rowKey, delta) {
          const cur = adj[rowKey] ?? getPlanned(rowKey,"essential",thisMonthIdx);
          const next = Math.max(0, cur + delta);
          setPressureSheet(prev=>({...prev,adjustable:{...prev.adjustable,[rowKey]:next}}));
        }
        return (
          <div style={{position:"fixed",inset:0,zIndex:250,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}
            onClick={e=>{if(e.target===e.currentTarget)setPressureSheet(null);}}>
            <div style={{background:"rgba(44,33,22,0.4)",position:"absolute",inset:0}}/>
            <div style={{position:"relative",background:"#faf6f0",borderRadius:"20px 20px 0 0",padding:"20px 20px 28px",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(44,33,22,0.2)"}}>
              <div style={{...S.serif,fontSize:"1.1rem",marginBottom:4}}>budget is tight ✦</div>
              <div style={{...S.sans,fontSize:"0.75rem",color:"#4a3020",marginBottom:14}}>
                adding <strong>{fmt(newGoalMo)}/mo</strong> for this goal puts you over budget. adjust other items to make room.
              </div>
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.68rem",color:"#7a5c3a",marginBottom:5}}>
                  <span>total allocated</span>
                  <span style={{color:isOver?"#b85050":"#4a7c59",fontWeight:500}}>
                    {fmt(totalWithGoal)} / {fmt(inc)} {isOver?`(+${fmt(over)} over)`:"✓ within budget"}
                  </span>
                </div>
                <div style={{height:10,background:"#f0e8dc",borderRadius:5,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(fillPct,100)}%`,borderRadius:5,
                    background:isOver?"linear-gradient(90deg,#c8a882,#c88b8b)":"linear-gradient(90deg,#a89bc8,#8faa8b)",
                    transition:"width 0.2s,background 0.2s"}}/>
                </div>
                {isOver&&<div style={{...S.sans,fontSize:"0.62rem",color:"#b85050",marginTop:2}}>↑ {fmt(over)} needs to come out somewhere below</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,marginBottom:10,background:"#8faa8b12",border:"1.5px solid #8faa8b44"}}>
                <div style={{flex:1,...S.sans,fontSize:"0.82rem",fontWeight:500,textTransform:"capitalize",color:"#2a1f14"}}>
                  🎯 {pressureSheet.goalKey} <span style={{...S.sans,fontSize:"0.65rem",color:"#8faa8b",fontWeight:400}}>new goal</span>
                </div>
                <div style={{...S.sans,fontSize:"0.8rem",fontWeight:500,color:"#4a7c59"}}>{fmt(newGoalMo)}/mo</div>
              </div>
              <div style={{...S.sans,fontSize:"0.63rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:8}}>adjust to make room</div>
              {adjRows.map(row=>{
                const base = getPlanned(row.key,row.type,thisMonthIdx);
                const cur  = adj[row.key] ?? base;
                const diff = cur - base;
                return (
                  <div key={row.key} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:10,marginBottom:5,background:"#fff",border:"1px solid #e8ddd0"}}>
                    <div style={{flex:1,...S.sans,fontSize:"0.8rem",textTransform:"capitalize",color:"#2a1f14"}}>{row.emoji||""} {row.label}</div>
                    {diff!==0&&<div style={{...S.sans,fontSize:"0.65rem",color:diff<0?"#4a7c59":"#b85050",background:diff<0?"#8faa8b12":"#c88b8b12",borderRadius:4,padding:"1px 6px"}}>{diff>0?"+":""}{fmt(diff)}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <button onClick={()=>updateAdj(row.key,-10)} style={{width:26,height:26,borderRadius:7,border:"1.5px solid #e0d0be",background:"transparent",cursor:"pointer",...S.sans,fontSize:"1rem",color:"#4a3020",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <div style={{...S.sans,fontSize:"0.8rem",fontWeight:500,minWidth:48,textAlign:"center",color:cur<base?"#4a7c59":"#2c2116"}}>{fmt(cur)}</div>
                      <button onClick={()=>updateAdj(row.key,10)} style={{width:26,height:26,borderRadius:7,border:"1.5px solid #e0d0be",background:"transparent",cursor:"pointer",...S.sans,fontSize:"1rem",color:"#4a3020",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    </div>
                  </div>
                );
              })}
              <div style={{display:"flex",gap:8,marginTop:16}}>
                <button style={S.btnGhost} onClick={()=>setPressureSheet(null)}>cancel</button>
                <button style={{...S.btnPrimary,flex:1,padding:"11px 0",background:isOver?"#b85050":"#2c2116"}}
                  onClick={()=>{
                    const {goalKey,draftPlan}=pressureSheet;
                    setYearPlan(prev=>({...prev,[goalKey]:{...(prev[goalKey]||{}),...draftPlan[goalKey]}}));
                    adjRows.forEach(r=>{
                      if(adj[r.key]!=null&&adj[r.key]!==getPlanned(r.key,r.type,thisMonthIdx))
                        setYearPlan(prev=>({...prev,[r.key]:{...(prev[r.key]||{}),[thisMonthIdx]:adj[r.key]}}));
                    });
                    setPressureSheet(null); setPressureSelections({});
                  }}>
                  {isOver?"confirm over budget →":"confirm & save →"}
                </button>
              </div>
            </div>
          </div>
        );
      })();

      // ── MOBILE LAYOUT ────────────────────────────────────────────────────────
      if (isMobile) {
        const goalRows = ROWS.find(s=>s.section==="Savings Goals")?.rows||[];
        const nonGoalSections = ROWS.filter(s=>s.section!=="Savings Goals");
        return (
          <div style={{position:"relative"}}>
            {pressureSheetEl}

            {/* Goal cards */}
            <div style={{marginBottom:16}}>
              <div style={{...S.sans,fontSize:"0.62rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#8faa8b",marginBottom:8}}>savings goals</div>
              {goalRows.map(row=>{
                const [ws,we] = getEffectiveWindow(row.key);
                const g = goals[row.key]||{};
                const done = (g.saved||0)>=(g.target||1);
                const perMo = getEffectivePerMo(row.key);
                const rem = Math.max(0,(g.target||0)-(g.saved||0));
                const isHL = row.key===newGoalHighlight;
                const gp = pct(g.saved||0, g.target||1);
                return (
                  <div key={row.key} style={{background:"#fff",border:`1.5px solid ${isHL?"#8fa44a":done?"#8fa44a33":"#e8ddd0"}`,borderRadius:14,padding:"12px 14px",marginBottom:10,
                    boxShadow:isHL?"0 0 0 3px #8fa44a44,0 2px 12px #8fa44a22":"0 1px 4px rgba(44,33,22,0.05)"}}>
                    {/* Header */}
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{fontSize:"1.2rem"}}>{row.emoji||"🎯"}</span>
                      <div style={{flex:1}}>
                        <div style={{...S.sans,fontSize:"0.82rem",fontWeight:500,textTransform:"capitalize",color:"#1e140a"}}>
                          {row.label}
                          {isHL&&<span style={{marginLeft:6,fontSize:"0.6rem",color:"#6b7c3f",fontWeight:500}}>new ✦</span>}
                        </div>
                        <div style={{...S.sans,fontSize:"0.67rem",color:"#7a5c3a"}}>
                          {g.deadline&&g.deadline!=="ongoing"?`by ${g.deadline}`:"ongoing"}
                          {!done&&<span style={{marginLeft:8,color:"#8faa8b",fontWeight:500}}>{fmt(perMo)}/mo</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{...S.sans,fontSize:"0.8rem",fontWeight:500,color:done?"#4a7c59":"#2c2116"}}>{fmt(g.saved||0)}</div>
                        <div style={{...S.sans,fontSize:"0.65rem",color:"#7a5c3a"}}>of {fmt(g.target||0)}</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{height:4,background:"#f0e8dc",borderRadius:2,overflow:"hidden",marginBottom:10}}>
                      <div style={{height:"100%",width:`${gp}%`,background:"linear-gradient(90deg,#8fa44a,#4f5e2a)",borderRadius:2,transition:"width 0.3s"}}/>
                    </div>

                    {/* Mini 12-month timeline */}
                    <div style={{marginBottom:8}}>
                      <div style={{display:"flex",gap:1,height:20,borderRadius:4,overflow:"hidden"}}>
                        {Array.from({length:12},(_,i)=>{
                          const inWindow = i>=ws && i<=we;
                          const isCur = i===thisMonthIdx;
                          const isDeadline = g.deadline&&g.deadline!=="ongoing"&&
                            (()=>{const d=new Date(g.deadline.replace(/^(late|early|mid)\s+/i,""));return !isNaN(d)&&d.getMonth()===i;})();
                          return (
                            <div key={i} style={{flex:1,height:"100%",position:"relative",
                              background:inWindow
                                ? (isCur?"#6b7c3f":"#8fa44a88")
                                : (isCur?"#f0e8d8":"#f8f4ef"),
                              borderLeft:isCur?"2px solid #c8a882":isDeadline?"2px solid #c88b8b88":"none",
                              borderRadius:i===0?4:i===11?4:0,
                              transition:"background 0.15s"}}/>
                          );
                        })}
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",...S.sans,fontSize:"0.58rem",color:"#6b4c2a",marginTop:2}}>
                        <span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span>
                      </div>
                    </div>

                    {/* Window controls — tap +/- to shift start/end */}
                    {!done&&(
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <div style={{...S.sans,fontSize:"0.62rem",color:"#7a5c3a",textTransform:"uppercase",letterSpacing:"0.06em"}}>window</div>
                        <div style={{display:"flex",gap:4,flex:1,alignItems:"center"}}>
                          <button onClick={()=>shiftWindow(row.key,"left",-1)}
                            style={{width:26,height:26,borderRadius:7,border:"1.5px solid #e0d0be",background:"transparent",cursor:"pointer",...S.sans,fontSize:"0.75rem",color:"#4a3020"}}>◂</button>
                          <div style={{flex:1,textAlign:"center",...S.sans,fontSize:"0.72rem",color:"#2a1f14",fontWeight:500}}>
                            {MONTHS[ws].slice(0,3)} → {MONTHS[we].slice(0,3)}
                          </div>
                          <button onClick={()=>shiftWindow(row.key,"left",1)}
                            style={{width:26,height:26,borderRadius:7,border:"1.5px solid #e0d0be",background:"transparent",cursor:"pointer",...S.sans,fontSize:"0.75rem",color:"#4a3020"}}>▸</button>
                        </div>
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          <button onClick={()=>shiftWindow(row.key,"right",-1)}
                            style={{width:26,height:26,borderRadius:7,border:"1.5px solid #e0d0be",background:"transparent",cursor:"pointer",...S.sans,fontSize:"0.75rem",color:"#4a3020"}}>◂</button>
                          <div style={{...S.sans,fontSize:"0.62rem",color:"#7a5c3a"}}>end</div>
                          <button onClick={()=>shiftWindow(row.key,"right",1)}
                            style={{width:26,height:26,borderRadius:7,border:"1.5px solid #e0d0be",background:"transparent",cursor:"pointer",...S.sans,fontSize:"0.75rem",color:"#4a3020"}}>▸</button>
                        </div>
                      </div>
                    )}
                    {done&&<div style={{...S.sans,fontSize:"0.72rem",color:"#8faa8b",textAlign:"center"}}>🎉 goal complete</div>}
                  </div>
                );
              })}
            </div>

            {/* Essentials, Loans, Other — compact editable grid */}
            {nonGoalSections.map(section=>(
              <div key={section.section} style={{marginBottom:14}}>
                <div style={{...S.sans,fontSize:"0.62rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#4a3020",marginBottom:6}}>{section.section}</div>
                {section.rows.map(row=>{
                  const planned = getPlanned(row.key,row.type,thisMonthIdx);
                  const actual  = getActual(row.key,thisMonthIdx);
                  const status  = getCellStatus(row.key,row.type,thisMonthIdx);
                  const isEditing = editingCell?.rowKey===row.key&&editingCell?.monthIdx===thisMonthIdx;
                  return (
                    <div key={row.key} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #f5ede4"}}>
                      <div style={{...S.sans,fontSize:"0.8rem",color:"#2a1f14",flex:1,textTransform:"capitalize"}}>{row.emoji||""} {row.label}</div>
                      {actual>0&&<div style={{...S.sans,fontSize:"0.72rem",color:statusColor[status],fontWeight:500}}>{fmt(actual)}</div>}
                      {isEditing?(
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          <input autoFocus style={{...S.input,width:72,padding:"3px 6px",fontSize:"0.78rem",textAlign:"right"}}
                            type="number" inputMode="decimal" value={cellDraft}
                            onChange={e=>setCellDraft(e.target.value)}
                            onKeyDown={e=>{if(e.key==="Enter")saveCellDraft(row.key,row.type,thisMonthIdx);if(e.key==="Escape"){setEditingCell(null);setCellDraft("");}}}
                            onBlur={()=>saveCellDraft(row.key,row.type,thisMonthIdx)}/>
                          <button style={{...S.btnPrimary,padding:"3px 8px",fontSize:"0.68rem"}} onClick={()=>saveCellDraft(row.key,row.type,thisMonthIdx)}>✓</button>
                        </div>
                      ):(
                        <button onClick={()=>{setEditingCell({rowKey:row.key,monthIdx:thisMonthIdx});setCellDraft(String(planned||""));}}
                          style={{...S.sans,fontSize:"0.78rem",color:"#7a5c3a",background:"#f5ede4",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:500}}>
                          {planned>0?fmt(planned):"set"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{...S.sans,fontSize:"0.63rem",color:"#8a6848",marginTop:4,textAlign:"center"}}>
              tap ◂▸ to shift goal window · tap amounts to edit
            </div>
          </div>
        );
      }

      // ── DESKTOP LAYOUT (table with drag handles) ─────────────────────────────
      return (
        <div style={{position:"relative"}}>
          {pressureSheetEl}
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}} ref={tableRef}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:700,tableLayout:"fixed"}}>
              <colgroup>
                <col style={{width:130}}/>
                {MONTHS.map((_,i)=><col key={i} style={{width:COL_MIN_W}}/>)}
              </colgroup>
              <thead>
                <tr style={{background:"#f5ede4"}}>
                  <th style={{...S.sans,fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.06em",color:"#7a5c3a",textAlign:"left",padding:"6px 8px",position:"sticky",left:0,zIndex:3,background:"#f5ede4",boxShadow:"2px 0 4px rgba(44,33,22,0.06)"}}>commitment</th>
                  {MONTHS.map((m,i)=>(
                    <th key={i} style={{...S.sans,fontSize:"0.62rem",color:i===thisMonthIdx?"#c8a882":"#a8906e",fontWeight:i===thisMonthIdx?700:400,textAlign:"center",padding:"6px 2px"}}>{m.slice(0,3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(section=>(
                  <React.Fragment key={section.section}>
                    <tr key={section.section}>
                      <td colSpan={13} style={{...S.sans,fontSize:"0.6rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#4a3020",padding:"10px 8px 3px",background:"#fdfaf6",position:"sticky",left:0,zIndex:2,boxShadow:"2px 0 4px rgba(44,33,22,0.04)"}}>
                        {section.section}
                      </td>
                    </tr>
                    {section.rows.map(row=>{
                      const isGoalRow = row.type==="goal";
                      const isHL = isGoalRow && row.key===newGoalHighlight;

                      if (isGoalRow) {
                        const [ws,we] = getEffectiveWindow(row.key);
                        const g = goals[row.key]||{};
                        const done = (g.saved||0)>=(g.target||1);
                        const perMo = getEffectivePerMo(row.key);
                        const totalP = Array.from({length:12},(_,i)=>getEffectiveGoalVal(row.key,i)).reduce((a,b)=>a+b,0);
                        const rem = Math.max(0,(g.target||0)-(g.saved||0));
                        const isDraggingThis = barDrag?.goalKey===row.key;
                        return (
                          <tr key={row.key} style={{borderBottom:"1px solid #f5ede4",height:36}}>
                            <td style={{...S.sans,fontSize:"0.73rem",color:"#2a1f14",padding:"4px 8px",textTransform:"capitalize",position:"sticky",left:0,zIndex:2,
                              background:isHL?"#8fa44a0a":isDraggingThis?"#8fa44a06":"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                              boxShadow:"2px 0 4px rgba(44,33,22,0.04)"}}>
                              {row.emoji&&<span style={{marginRight:3}}>{row.emoji}</span>}{row.label}
                              {isHL&&<span style={{marginLeft:4,fontSize:"0.6rem",color:"#6b7c3f",fontWeight:500}}>new ✦</span>}
                              {isDraggingThis&&<span style={{marginLeft:4,fontSize:"0.6rem",color:"#a89bc8"}}>{we-ws+1}mo · {fmt(perMo)}/mo</span>}
                            </td>
                            <td colSpan={12} style={{padding:"3px 4px",position:"relative",verticalAlign:"middle",cursor:isDraggingThis?"ew-resize":"default"}}>
                              <div style={{position:"relative",height:28,display:"flex",alignItems:"center"}}>
                                <div style={{position:"absolute",inset:0,display:"flex",borderRadius:4,overflow:"hidden"}}>
                                  {Array.from({length:12},(_,i)=>(
                                    <div key={i} style={{flex:1,height:"100%",background:i===thisMonthIdx?"#f0e8d8":"#f8f4ef",borderRight:"1px solid #ede5da"}}/>
                                  ))}
                                </div>
                                {ws<=we&&(
                                  <div style={{
                                    position:"absolute",left:`${(ws/12)*100}%`,width:`${((we-ws+1)/12)*100}%`,
                                    height:22,top:3,borderRadius:6,
                                    background:done?"linear-gradient(90deg,#8fa44a,#4f5e2a)"
                                      :isDraggingThis?"linear-gradient(90deg,#c8d98a,#8fa44a)"
                                      :isHL?"linear-gradient(90deg,#8fa44a,#4f5e2a)"
                                      :"linear-gradient(90deg,#8fa44a99,#8fa44a66)",
                                    boxShadow:isDraggingThis?"0 0 0 2px #8fa44a,0 2px 12px #8fa44a44"
                                      :isHL?"0 0 0 2px #8fa44a,0 2px 8px #8fa44a55"
                                      :done?"0 1px 4px #8fa44a44":"0 1px 3px rgba(44,33,22,0.08)",
                                    display:"flex",alignItems:"center",overflow:"hidden",
                                    transition:isDraggingThis?"none":"left 0.12s,width 0.12s,box-shadow 0.2s",
                                    zIndex:1,
                                  }}>
                                    <div style={{...S.sans,fontSize:"0.6rem",color:"#fff",fontWeight:500,padding:"0 6px",flex:1,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                      {we-ws>=1?`${fmt(perMo)}/mo`:fmt(perMo)}
                                    </div>
                                    {we-ws>=2&&<div style={{...S.sans,fontSize:"0.57rem",color:"#ffffffbb",padding:"0 5px 0 0",whiteSpace:"nowrap"}}>{fmt(totalP)}/{fmt(rem)}</div>}
                                  </div>
                                )}
                                {ws<=we&&ws>=thisMonthIdx&&(
                                  <div onMouseDown={e=>startBarDrag(e,row.key,"left")}
                                    style={{position:"absolute",left:`${(ws/12)*100}%`,width:12,height:28,cursor:"ew-resize",zIndex:3,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                    <div style={{width:3,height:14,background:"#fff",borderRadius:2,opacity:0.9,boxShadow:"0 0 2px rgba(0,0,0,0.2)"}}/>
                                  </div>
                                )}
                                {ws<=we&&(
                                  <div onMouseDown={e=>startBarDrag(e,row.key,"right")}
                                    style={{position:"absolute",left:`${((we+1)/12)*100}%`,width:12,height:28,cursor:"ew-resize",zIndex:3,display:"flex",alignItems:"center",justifyContent:"center",transform:"translateX(-12px)"}}>
                                    <div style={{width:3,height:14,background:"#fff",borderRadius:2,opacity:0.7,boxShadow:"0 0 2px rgba(0,0,0,0.2)"}}/>
                                  </div>
                                )}
                                {g.deadline&&g.deadline!=="ongoing"&&(()=>{
                                  const d=new Date(g.deadline.replace(/^(late|early|mid)\s+/i,""));
                                  if(isNaN(d)) return null;
                                  const dmo=d.getMonth();
                                  return <div title={`deadline: ${g.deadline}`} style={{position:"absolute",left:`${((dmo+1)/12)*100}%`,width:2,height:28,background:we>dmo?"#c88b8b88":"#8faa8b88",zIndex:2,borderRadius:1}}/>;
                                })()}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Number grid row
                      return (
                        <tr key={row.key} style={{borderBottom:"1px solid #f5ede4"}}>
                          <td style={{...S.sans,fontSize:"0.73rem",color:"#2a1f14",padding:"5px 8px",textTransform:"capitalize",position:"sticky",left:0,zIndex:2,background:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",boxShadow:"2px 0 4px rgba(44,33,22,0.04)"}}>
                            {row.emoji&&<span style={{marginRight:3}}>{row.emoji}</span>}{row.label}
                          </td>
                          {MONTHS.map((_,i)=>{
                            const planned=getPlanned(row.key,row.type,i);
                            const actual=i<=thisMonthIdx?getActual(row.key,i):null;
                            const status=getCellStatus(row.key,row.type,i);
                            const isCur=i===thisMonthIdx;
                            const isEditing=editingCell?.rowKey===row.key&&editingCell?.monthIdx===i;
                            return (
                              <td key={i} style={{textAlign:"center",padding:"3px 2px",verticalAlign:"middle",background:isCur?"#fdf8f2":"#fff"}}>
                                {isEditing?(
                                  <input autoFocus style={{...S.input,width:52,padding:"2px 3px",fontSize:"0.68rem",textAlign:"right"}}
                                    type="number" inputMode="decimal" value={cellDraft}
                                    onChange={e=>setCellDraft(e.target.value)}
                                    onKeyDown={e=>{if(e.key==="Enter")saveCellDraft(row.key,row.type,i);if(e.key==="Escape"){setEditingCell(null);setCellDraft("");}}}
                                    onBlur={()=>saveCellDraft(row.key,row.type,i)}/>
                                ):(
                                  <div style={{cursor:"pointer",userSelect:"none"}}
                                    onClick={()=>{setEditingCell({rowKey:row.key,monthIdx:i});setCellDraft(String(planned||"")); }}>
                                    {actual!=null&&<div style={{...S.sans,fontSize:"0.68rem",fontWeight:500,color:statusColor[status]}}>{actual>0?fmt(actual):"—"}</div>}
                                    <div style={{...S.sans,fontSize:"0.63rem",color:i>thisMonthIdx?"#b8a08a":"#c8b8a4"}}>{planned>0?fmt(planned):<span style={{color:"#e8ddd0"}}>—</span>}</div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                <tr><td colSpan={13} style={{...S.sans,fontSize:"0.6rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"#4a3020",padding:"8px 8px 3px",background:"#fdfaf6",position:"sticky",left:0,zIndex:2}}>Disposable Income</td></tr>
                <tr style={{background:"#f8f3ee"}}>
                  <td style={{...S.sans,fontSize:"0.72rem",color:"#2a1f14",padding:"5px 8px",position:"sticky",left:0,zIndex:2,background:"#f8f3ee",fontStyle:"italic"}}>planned leftover</td>
                  {MONTHS.map((_,i)=>{
                    const d=getDisposable(i),da=getDisposableActual(i),isCur=i===thisMonthIdx;
                    return(
                      <td key={i} style={{textAlign:"center",padding:"3px 2px",background:isCur?"#fdf8f2":"#f8f3ee"}}>
                        <div style={{...S.sans,fontSize:"0.68rem",fontWeight:500,color:d>=0?"#4a7c59":"#b85050"}}>{d>=0?"+":"-"}{fmt(Math.abs(d))}</div>
                        {da!=null&&<div style={{...S.sans,fontSize:"0.6rem",color:da>=0?"#8faa8b":"#c88b8b"}}>{da>=0?"+":"-"}{fmt(Math.abs(da))}</div>}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{...S.sans,fontSize:"0.63rem",color:"#8a6848",marginTop:8}}>
            drag goal bar edges ◂▸ to reshape window · tap essentials & loans to edit · colored line = deadline
          </div>
        </div>
      );
    }

    // Compute which months had a goal or loan completion
    // Check archived entries first, then scan txns for goals still active
    const winMonths = new Set();

    // From archived items with archivedAt timestamp
    Object.values(archived).forEach(item=>{
      if (!item.archivedAt || !item.type) return;
      const d = new Date(item.archivedAt);
      if (d.getFullYear()===now.getFullYear()) winMonths.add(d.getMonth());
    });

    // From active goals that are complete — find month when they crossed the line
    // by finding the latest transfer/tx month that pushed saved over target
    Object.values(goals).forEach(g=>{
      if ((g.saved||0) < (g.target||1)) return;
      // Scan months for when this goal's linked category had enough transactions
      let running = 0;
      for (let mi=0; mi<=11; mi++) {
        const mTxs2 = [...(txns[`${mi}_first`]||[]),...(txns[`${mi}_second`]||[])];
        const contrib = mTxs2.filter(t=>(g.linkedCategories||[]).includes(t.category)&&!t._isDeposit)
          .reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
        running += contrib;
        if (running >= (g.target||1)) { winMonths.add(mi); break; }
      }
    });

    // From completed loans — similar scan via debt_payment to linkedAccountId
    Object.values(loans).forEach(loan=>{
      if ((loan.paid||0) < (loan.target||1)) return;
      let running = 0;
      for (let mi=0; mi<=11; mi++) {
        const mTxs2 = [...(txns[`${mi}_first`]||[]),...(txns[`${mi}_second`]||[])];
        const contrib = mTxs2.filter(t=>t.money_flow==="debt_payment"&&(
          (loan.linkedAccountId&&t.to_account_id===loan.linkedAccountId)||
          t.category?.toLowerCase()===Object.keys(loans).find(k=>loans[k]===loan)
        )).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
        running += contrib;
        if (running >= (loan.target||1)) { winMonths.add(mi); break; }
      }
    });

    return (
      <>
        {/* Monthly income vs spent — shows the arc of the year */}
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",gap:3,alignItems:"flex-end",height:90}}>
            {MONTHS.map((_,i)=>{
              const mk2   = String(i);
              const mTxs  = [...(txns[`${mk2}_first`]||[]),...(txns[`${mk2}_second`]||[])];
              const inc   = mIncome[i] ?? DEF_INCOME;
              const spent = mTxs.filter(t=>!t._isDeposit).reduce((s,t)=>s+txSpend(t),0);
              const isFuture = i > curMonth;
              const isCur    = i === curMonth;
              const ratio    = Math.min(spent / inc, 1.3); // cap at 130% for display
              const over     = spent > inc;
              const barH     = isFuture ? 8 : Math.max(4, ratio * 70);
              const hasWin = winMonths.has(i);
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}
                  onClick={()=>{ setYearMode("review"); setSelectedReviewMonth(i); }}>
                  {/* Trophy marker */}
                  <div style={{height:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {hasWin && <span style={{fontSize:"0.6rem",lineHeight:1}} title="goal or loan completed">🏆</span>}
                  </div>
                  <div style={{width:"100%",height:70,display:"flex",alignItems:"flex-end"}}>
                    <div style={{
                      width:"100%", height:barH,
                      borderRadius:"3px 3px 0 0",
                      background: isFuture ? "#e8ddd0" : over ? "#c88b8b" : isCur ? "#c8a882" : "#8faa8b",
                      opacity: isFuture ? 0.5 : 1,
                      transition:"height 0.3s",
                    }}/>
                  </div>
                  <div style={{...S.sans,fontSize:"0.55rem",color:isCur?"#6b7c3f":"#b8a08a",fontWeight:isCur?600:400}}>
                    {MONTHS[i].slice(0,1)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:14,marginTop:8,flexWrap:"wrap"}}>
            {[["#8faa8b","under budget"],["#c8a882","this month"],["#c88b8b","over budget"],["#e8ddd0","upcoming"]].map(([c,l])=>(
              <span key={l} style={{...S.sans,fontSize:"0.62rem",color:"#8a6848",display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:8,height:8,borderRadius:2,background:c,display:"inline-block"}}/>
                {l}
              </span>
            ))}
            <span style={{...S.sans,fontSize:"0.62rem",color:"#8a6848",display:"flex",alignItems:"center",gap:4}}>
              🏆 goal/loan complete
            </span>
            <span style={{...S.sans,fontSize:"0.62rem",color:"#8a6848",fontStyle:"italic",marginLeft:"auto"}}>tap a bar to review that month</span>
          </div>
        </div>

        {/* Key numbers row — net position + debt breakdown */}
        <div className="g3" style={{marginBottom:16}}>
          <Card>
            <Label>earned to date</Label>
            <div className="cv">{fmt(ytdEarned)}</div>
            <div className="cs">Jan – {MONTHS[curMonth].slice(0,3)}</div>
          </Card>
          <Card>
            <Label>spent to date</Label>
            <div className="cv r">{fmt(ytdSpent)}</div>
            <div className="cs">{ytdEarned>0?((ytdSpent/ytdEarned)*100).toFixed(0)+"% of income":""}</div>
          </Card>
          <Card>
            <Label>saved / paid off</Label>
            <div className="cv g">{fmt(ytdEarned - ytdSpent > 0 ? ytdEarned - ytdSpent : 0)}</div>
            <div className="cs">this year so far</div>
          </Card>
        </div>

        {/* View switcher */}
        <div style={{display:"flex",gap:4,background:"#f0e8dc",borderRadius:10,padding:3,marginBottom:16}}>
          {[{id:"detailed",label:"Plan"},{id:"review",label:"Review"}].map(v=>(
            <button key={v.id} onClick={()=>{ setYearMode(v.id); setSelectedReviewMonth(null); }}
              style={{...S.sans,flex:1,fontSize:"0.75rem",fontWeight:500,padding:"7px 0",borderRadius:7,border:"none",cursor:"pointer",transition:"all 0.15s",
                background:yearMode===v.id?"#fff":"transparent",
                color:yearMode===v.id?"#2c2116":"#7a6048",
                boxShadow:yearMode===v.id?"0 1px 4px rgba(44,33,22,0.1)":"none"}}>
              {v.label}
            </button>
          ))}
        </div>

        <div style={{...S.sans,fontSize:"0.68rem",color:"#8a6848",marginBottom:12,fontStyle:"italic"}}>
          {yearMode==="review"&&"tap any month or dot to review actuals vs planned"}
          {yearMode==="detailed"&&"drag goal bars to reshape · tap essentials & loans to edit · see budget impact live"}
        </div>

        <Card style={{padding:"14px 16px",marginBottom:16}}>
          {yearMode==="review"   && renderReview()}
          {yearMode==="detailed" && renderDetailed()}
        </Card>

        <div className="note" style={{marginTop:4}}>2026 is your year 🌿</div>
        <div style={{textAlign:"center",marginTop:6,display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
          <button onClick={exportData} style={{...S.sans,fontSize:"0.7rem",color:"#6b4c2a",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>⬇ export backup</button>
          <label style={{...S.sans,fontSize:"0.7rem",color:"#6b4c2a",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>
            ⬆ import backup
            <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{importData(e.target.files[0]); e.target.value="";}}/>
          </label>
          <button onClick={resetAll} style={{...S.sans,fontSize:"0.7rem",color:"#6b4c2a",background:"none",border:"none",cursor:"pointer",textDecoration:"underline",opacity:0.5}}>reset all data</button>
        </div>
      </>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const navItems = [
    {v:"tracker",    label:"Budget"},
    {v:"accounts",   label:"Accounts"},
    {v:"home",       label:"Home"},
    {v:"intentions", label:"Goals"},
  ];
  const mobileNavItems = [
    {v:"tracker",    short:"Budget"},
    {v:"accounts",   short:"Accounts"},
    {v:"home",       short:"Home"},
    {v:"intentions", short:"Goals"},
  ];
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <div style={{fontFamily:"'DM Serif Display',serif",color:"#2a1f14"}} className="app-shell">

      {/* ── Desktop sidebar — not rendered on mobile ─────────────────────── */}
      {!isMobile && (
      <div className="sidebar">
        <div className="sidebar-logo">
          <h1>🌿 <span>pachira</span></h1>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:loaded?"#8faa8b":"#c8a882"}}/>
            <span style={{...S.sans,fontSize:"0.6rem",color:"#8fa86a",opacity:0.7}}>auto-saving</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({v,label})=>(
            <button key={v} className={`sn${view===v?" on":""}`} onClick={()=>setView(v)}>{label}</button>
          ))}
        </nav>
        <div className="sidebar-actions">
          <button onClick={()=>setShowDeposit(true)} style={{...S.sans,fontSize:"0.78rem",fontWeight:500,padding:"9px 12px",borderRadius:8,border:"none",background:GREEN,color:"#faf6f0",cursor:"pointer",textAlign:"left"}}>
            + deposit
          </button>
          <button onClick={()=>{ prevViewRef.current=view; setShowAddTxPage(true); }} style={{...S.sans,fontSize:"0.78rem",fontWeight:500,padding:"9px 12px",borderRadius:8,border:"1.5px solid #3d2f22",background:"transparent",color:"#6b4c2a",cursor:"pointer",textAlign:"left"}}>
            + add transaction
          </button>
          <button onClick={resetAll} className="sidebar-reset">reset demo data</button>
          <div style={{display:"flex",gap:4,padding:"4px 12px"}}>
            <button onClick={exportData} className="sidebar-reset" style={{padding:0,opacity:0.6}}>⬇ export</button>
            <span style={{color:"#6a5040",opacity:0.4,fontSize:"0.62rem"}}>·</span>
            <label className="sidebar-reset" style={{cursor:"pointer",padding:0,opacity:0.6}}>
              ⬆ import
              <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{importData(e.target.files[0]); e.target.value="";}}/>
            </label>
          </div>
        </div>
      </div>
      )}

      {/* ── Content wrap ─────────────────────────────────────────────────── */}
      <div className="content-wrap" style={isMobile ? {marginLeft:0, width:"100%", maxWidth:"100vw", overflowX:"hidden"} : {marginLeft:220, width:"calc(100% - 220px)"}}>

        {/* Mobile header — inside content-wrap so it flows correctly */}
        {isMobile && (
          <div className="hdr">
            <h1>🌿 <span>pachira</span></h1>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:loaded?"#8faa8b":"#c8a882"}}/>
              <span style={{...S.sans,fontSize:"0.6rem",color:"#8fa86a",opacity:0.6}}>saved</span>
            </div>
          </div>
        )}

        {view==="tracker" && (
          <div className="mbar" style={{justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <button onClick={()=>setCurMonth(m=>(m+11)%12)} style={{...S.sans,background:"none",border:"none",cursor:"pointer",color:"#4a3020",fontSize:"1rem",padding:"0 4px"}}>‹</button>
              <div style={{...S.serif,fontSize:"1rem"}}>Budget <span style={{color:"#8a5c2a"}}>|</span> {MONTHS[curMonth]}</div>
              <button onClick={()=>setCurMonth(m=>(m+1)%12)} style={{...S.sans,background:"none",border:"none",cursor:"pointer",color:"#4a3020",fontSize:"1rem",padding:"0 4px"}}>›</button>
              {period!=="year" && (editPay ? (
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <input autoFocus
                    style={{...S.input,width:76,padding:"3px 6px",fontSize:"0.8rem",textAlign:"right"}}
                    type="number" inputMode="decimal" value={editPayVal}
                    onChange={e=>setEditPayVal(e.target.value)}
                    onKeyDown={e=>{
                      if(e.key==="Enter"){
                        const v=parseFloat(editPayVal)||0;
                        if(v>0){
                          if(period==="month") setMIncome(p=>({...p,[curMonth]:v}));
                          else setPPay(p=>({...p,[`${curMonth}_${period}`]:v}));
                        }
                        setEditPay(false);
                      }
                      if(e.key==="Escape") setEditPay(false);
                    }}/>
                  <button style={{...S.btnPrimary,padding:"3px 7px",fontSize:"0.68rem"}} onClick={()=>{
                    const v=parseFloat(editPayVal)||0;
                    if(v>0){
                      if(period==="month") setMIncome(p=>({...p,[curMonth]:v}));
                      else setPPay(p=>({...p,[`${curMonth}_${period}`]:v}));
                    }
                    setEditPay(false);
                  }}>✓</button>
                  <button style={{...S.btnGhost,padding:"3px 7px",fontSize:"0.68rem"}} onClick={()=>setEditPay(false)}>✕</button>
                </div>
              ) : (
                <button onClick={()=>{ setEditPayVal(String(period==="month"?income:getPay(period))); setEditPay(true); }}
                  style={{...S.sans,fontSize:"0.72rem",padding:"3px 8px",borderRadius:7,border:"1.5px solid #d4bfa0",background:"transparent",color:"#4a3020",cursor:"pointer",whiteSpace:"nowrap"}}>
                  💸 {period==="month" ? fmt(income) : fmt(getPay(period))}
                </button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              {[{id:"month",label:"Month"},{id:"first",label:"1st–15th"},{id:"second",label:"16th–end"},{id:"year",label:"Year"}].map(p=>(
                <button key={p.id} className={`ptab${period===p.id?" on":""}`} onClick={()=>{
                  const isPeriodSwitch = (p.id==="first"||p.id==="second") && (period==="first"||period==="second") && p.id!==period;
                  if (isPeriodSwitch && pinnedBudgetItems.length>0) {
                    setPeriodSwitchConfirm({targetPeriod:p.id, targetLabel:p.label});
                  } else {
                    setPeriod(p.id);
                  }
                  setShowAddTx(false);setEditPay(false);
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Desktop shell — main content + right panel */}
        <div className="desktop-shell">
          <div className="main-content">
            {view==="home"       && <HomeView/>}
            {view==="accounts"   && <AccountsView/>}
            {view==="tracker"    && period==="month"  && <MonthView
              p1txs={p1txs} p2txs={p2txs}
              income={(pPay[`${curMonth}_first`]??Math.round(income/2)) + (pPay[`${curMonth}_second`]??Math.round(income/2))}
              cats={cats}
              pBudgets={pBudgets} actBudg={actBudg} curMonth={curMonth}
              yearPlan={yearPlan} goals={goals} getPace={getPace} accounts={accounts}
              showMonthBE={showMonthBE} setShowMonthBE={setShowMonthBE}
              setShowLI={setShowLI} delTx={delTx} editTx={editTx}
              orderedCats={orderedCats} catOrder={catOrder} setCatOrder={setCatOrder}
              setMIncome={setMIncome} setPBudgets={setPBudgets} setPPay={setPPay}
              setYearPlan={setYearPlan} txSpend={txSpend}/>}
            {view==="tracker"    && period!=="year" && period!=="month" && <TrackerView/>}
            {view==="tracker"    && period==="year"  && <YearView/>}
            {view==="intentions" && <IntentionsView/>}
          </div>

          {/* Right context panel — desktop only */}
          <RightPanel
            view={view} period={period} isMobile={isMobile}
            accounts={accounts} goals={goals} goalOrder={goalOrder}
            loans={loans} txns={txns} txSpend={txSpend}
            curMonth={curMonth} mk={mk}
            ptxs={period==="first"?p1txs:p2txs}
            allTxs={allTxs}
            habits={habits} now={now}
            onDeposit={()=>setShowDeposit(true)}
            onAddTx={()=>{ prevViewRef.current=view; setShowAddTxPage(true); }}
            getPace={getPace} fmt={fmt} GREEN={GREEN}
          />
        </div>

        {/* Mobile bottom nav */}
        {/* Mobile floating island nav */}
        {fabOpen && <div className="fab-backdrop" onClick={()=>setFabOpen(false)}/>}
        <div className="nav-bottom" style={{zIndex:101}}>
          <div className="nav-island">
            {/* Left 2 nav items */}
            {mobileNavItems.slice(0,2).map(({v,short})=>(
              <button key={v} className={`nb${view===v?" on":""}`} onClick={()=>{ setView(v); setFabOpen(false); }}>
                <span className="ni">{short}</span>
              </button>
            ))}

            {/* Center FAB */}
            <div className="fab-wrap">
            {/* Vertical action menu */}
            <div className={`fab-menu${fabOpen?" vis":""}`}>
              <button className="fab-pill"
                style={{background:GREEN,color:"#faf6f0"}}
                onClick={()=>{ setFabOpen(false); setShowDeposit(true); }}>
                💰 deposit
              </button>
              <button className="fab-pill"
                style={{background:"#fdf8f2",color:"#1e140a"}}
                onClick={()=>{ setFabOpen(false); prevViewRef.current=view; setShowAddTxPage(true); }}>
                ✏️ log transaction
              </button>
            </div>

              <button className={`fab${fabOpen?" fab-open":""}`} onClick={()=>setFabOpen(o=>!o)}>
                <span style={{
                  fontSize:"1.3rem",lineHeight:1,color:"#2c2116",
                  display:"inline-block",
                  transform:fabOpen?"rotate(45deg)":"rotate(0deg)",
                  transition:"transform 0.2s"
                }}>+</span>
              </button>
            </div>

            {/* Right 2 nav items */}
            {mobileNavItems.slice(2,4).map(({v,short})=>(
              <button key={v} className={`nb${view===v?" on":""}`} onClick={()=>{ setView(v); setFabOpen(false); }}>
                <span className="ni">{short}</span>
              </button>
            ))}
          </div>
        </div>

      </div>{/* end content-wrap */}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* ── Deposit flow ── */}
      {showDeposit&&(
        <DepositPage
          accounts={accounts}
          onLog={(splits,notes,date)=>logDeposit(splits,notes,date)}
          onClose={()=>setShowDeposit(false)}/>
      )}

      {/* ── Add Transaction — full page on mobile, sidebar on desktop ── */}
      {showAddTxPage&&(()=>{
        // Filter out categories that match completed or archived goals
        const archivedGoalKeys = new Set([
          ...Object.keys(archived).filter(k=>!k.startsWith("loan_")),
          ...Object.keys(goals).filter(k=>(goals[k].saved||0)>=(goals[k].target||Infinity)&&goals[k].target>0),
        ]);
        const filteredCats = Object.fromEntries(
          Object.entries(cats).map(([sec,cat])=>([sec,{
            ...cat,
            items: cat.items.filter(item=>!archivedGoalKeys.has(item))
          }]))
        );
        return (
          <AddTxPage
            categories={filteredCats} accounts={accounts} curMonth={curMonth} period={period}
            prefill={treatTxPrefill}
            onAdd={(txList)=>{ txList.forEach(tx=>addTx(tx,tx._period||period)); setShowAddTxPage(false); setTreatTxPrefill(null); }}
            onClose={()=>{ setShowAddTxPage(false); setTreatTxPrefill(null); }}/>
        );
      })()}

      {/* Budget editor */}
      {showBE&&(
        <BudgetEditorModal
          title={`${MONTHS[curMonth]} · ${showBE==="first"?"1st–15th":"16th–end"}`}
          income={getPay(showBE)}
          budgets={getPB(showBE)}
          categories={cats}
          catOrder={catOrder}
          goalKeys={Object.keys(goals)}
          getGoalPace={(goalKey)=>getPace(goalKey)}
          splitRules={splitRules}
          monthlyBudgets={actBudg}
          isFirstHalfLocked={showBE==="first" && curMonth === now.getMonth() && new Date().getDate() > 15}
          rolloverMap={(()=>{
            const map = {};
            const currTxs = [...(txns[`${mk}_first`]||[]),...(txns[`${mk}_second`]||[])];
            accounts.filter(a=>a.type==="credit").forEach(a=>{
              const prevMonth = curMonth===0?11:curMonth-1;
              const pm = String(prevMonth);
              const prevTxs = [...(txns[`${pm}_first`]||[]),...(txns[`${pm}_second`]||[])];
              const rolloverAmt = prevTxs.filter(t=>{
                const fromId = t.from_account_id||t.account;
                const flow = t.money_flow||(t.txType==="payment"?"debt_payment":"expense");
                return fromId===a.id && flow==="expense";
              }).reduce((s,t)=>s+t.amount,0);
              if (rolloverAmt === 0) return;
              const paidAmt = currTxs.filter(t=>{
                const flow = t.money_flow||(t.txType==="payment"?"debt_payment":"expense");
                return t.to_account_id===a.id && flow==="debt_payment";
              }).reduce((s,t)=>s+t.amount,0);
              const remaining = Math.max(0, rolloverAmt - paidAmt);
              if (remaining > 0) map[a.id] = { amount: remaining, account: a };
            });
            return map;
          })()}
          onReset={pBudgets[`${curMonth}_${showBE}`]?()=>{ setPBudgets(p=>{const n={...p};delete n[`${curMonth}_${showBE}`];return n;}); setPPay(p=>{const n={...p};delete n[`${curMonth}_${showBE}`];return n;}); setShowBE(null); }:null}
          onSave={(db,inc,newCatOrder,stickyUpdates)=>{
            // Only save items actually in categories — filter out stale keys
            const allCatItems = new Set(Object.values(cats).flatMap(c=>c.items));
            const parsed={};
            for(const [k,v] of Object.entries(db)) {
              if(allCatItems.has(k)) parsed[k]=parseFloat(v)||0;
            }
            const goalKeysSet = new Set(Object.keys(goals));
            const thisPeriod = showBE; // "first" or "second"
            const otherPeriod = thisPeriod==="first" ? "second" : "first";
            const isFirstHalfPast = new Date().getDate() > 15;

            // Write goal overrides to yearPlan
            goalKeysSet.forEach(gk=>{
              if (parsed[gk] != null) {
                setYearPlan(prev=>({...prev,[gk]:{...(prev[gk]||{}),[curMonth]:parsed[gk]*2}}));
              }
            });

            // Non-goal items
            const nonGoalParsed={};
            Object.entries(parsed).forEach(([k,v])=>{ if(!goalKeysSet.has(k)) nonGoalParsed[k]=v; });

            // Write this period's budgets
            setPBudgets(p=>({...p,[`${curMonth}_${thisPeriod}`]:parsed}));
            setPPay(p=>({...p,[`${curMonth}_${thisPeriod}`]:inc}));

            // Cross-period sync is one-directional: saving 1st-15th auto-fills 16th-end
            // as (monthly - first). Monthly = what was previously set across both periods.
            if (thisPeriod === "first") {
              const prevFirst  = pBudgets[`${curMonth}_first`]  || {};
              const prevSecond = pBudgets[`${curMonth}_second`] || {};
              const otherOverrides = {};
              Object.entries(parsed).forEach(([k,v])=>{
                // Monthly total = previous first + previous second (or actBudg fallback)
                const prevMonthly = (prevFirst[k] ?? 0) + (prevSecond[k] ?? 0);
                const monthly = prevMonthly > 0 ? prevMonthly : (actBudg[k] ?? 0);
                otherOverrides[k] = Math.max(0, Math.round((monthly - v) * 100) / 100);
              });
              setPBudgets(p=>({...p,[`${curMonth}_second`]:otherOverrides}));
              const monthlyInc = (pPay[`${curMonth}_first`] ?? Math.round((mIncome[curMonth]??DEF_INCOME)/2))
                               + (pPay[`${curMonth}_second`] ?? Math.round((mIncome[curMonth]??DEF_INCOME)/2));
              setPPay(p=>({...p,[`${curMonth}_second`]:Math.max(0, monthlyInc - inc)}));
            }

            if(newCatOrder) setCatOrder(newCatOrder);

            // Fire adjustment notification
            if (adjItems.length > 0) {
              const isPastFirstHalf = isFirstHalfPast && otherPeriod==="first";
              setPeriodAdjNotif({
                period: otherPeriod,
                items: adjItems,
                warning: isPastFirstHalf
                  ? `First half is past — monthly totals updated but first-half spend already logged`
                  : null,
              });
              setTimeout(()=>setPeriodAdjNotif(null), 8000);
            }

            setShowBE(null);
          }}
          onClose={()=>setShowBE(null)}/>
      )}

      {/* Category / line item editor */}
      {showLI&&liDraft&&(
        <Modal title="manage categories" onClose={()=>setShowLI(false)} footer={
          <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center"}}>
            <div style={{...S.sans,fontSize:"0.72rem",color:"#7a5c3a"}}>{Object.values(liDraft).reduce((s,c)=>s+c.items.length,0)} items</div>
            <div style={{display:"flex",gap:8}}>
              <button style={S.btnGhost} onClick={()=>setShowLI(false)}>cancel</button>
              <button style={S.btnPrimary} onClick={()=>{
                const nb={...(mBudgets[curMonth]||{})};
                Object.values(liDraft).forEach(c=>c.items.forEach(i=>{ nb[i]=parseFloat(liBudgets[i])||0; }));
                setCats(liDraft); setMBudgets(p=>({...p,[curMonth]:nb})); setShowLI(false); setLiDraft(null);
              }}>save</button>
            </div>
          </div>
        }>
          {orderedCats.filter(k=>liDraft[k]).map(ck=>{
            const cat=liDraft[ck];
            return (
              <div key={ck} style={{marginTop:18}}>
                <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",padding:"4px 9px",borderRadius:6,marginBottom:8,display:"inline-block",background:cat.color+"22",color:cat.color}}>{cat.label}</div>
                {cat.items.map((item,idx)=>(
                  <div key={idx} className="li-row">
                    <div style={{color:"#d4bfa0",cursor:"grab",flexShrink:0}}>⠿</div>
                    <input style={{...S.input,flex:1}} value={item} onChange={e=>{
                      const nn=e.target.value;
                      setLiDraft(p=>({...p,[ck]:{...p[ck],items:p[ck].items.map(i=>i===item?nn:i)}}));
                      setLiBudgets(p=>{const n={...p};n[nn]=n[item]??0;delete n[item];return n;});
                    }}/>
                    <input style={{...S.input,width:80,textAlign:"right"}} type="number" inputMode="decimal" value={liBudgets[item]??0} onChange={e=>setLiBudgets(p=>({...p,[item]:e.target.value}))}/>
                    <button style={{background:"none",border:"none",cursor:"pointer",color:"#d4bfa0",fontSize:"1.1rem",padding:"2px 4px"}}
                      onClick={()=>{ setLiDraft(p=>({...p,[ck]:{...p[ck],items:p[ck].items.filter((_,i)=>i!==idx)}})); setLiBudgets(p=>{const n={...p};delete n[item];return n;}); }}>×</button>
                  </div>
                ))}
                <div style={{display:"flex",gap:8,padding:"8px 0 2px"}}>
                  <input style={{...S.input,flex:1,border:"1.5px dashed #d4bfa0",background:"transparent"}} placeholder={`+ new ${cat.label.toLowerCase()} item`} value={liInputs[ck]||""}
                    onChange={e=>setLiInputs(p=>({...p,[ck]:e.target.value}))}
                    onKeyDown={e=>{ if(e.key==="Enter"){ const n=(liInputs[ck]||"").trim().toLowerCase(); if(n&&!Object.values(liDraft).flatMap(c=>c.items).includes(n)){setLiDraft(p=>({...p,[ck]:{...p[ck],items:[...p[ck].items,n]}}));setLiBudgets(p=>({...p,[n]:0}));setLiInputs(p=>({...p,[ck]:""}));} }}}/>
                  <button style={S.btnPrimary} onClick={()=>{ const n=(liInputs[ck]||"").trim().toLowerCase(); if(n&&!Object.values(liDraft).flatMap(c=>c.items).includes(n)){setLiDraft(p=>({...p,[ck]:{...p[ck],items:[...p[ck].items,n]}}));setLiBudgets(p=>({...p,[n]:0}));setLiInputs(p=>({...p,[ck]:""}));} }}>add</button>
                </div>
              </div>
            );
          })}
          <div style={{height:20}}/>
        </Modal>
      )}
      {showLI&&!liDraft&&(()=>{
        setLiDraft(JSON.parse(JSON.stringify(cats)));
        const bs={}; Object.values(cats).forEach(c=>c.items.forEach(i=>{bs[i]=actBudg[i]??0;}));
        setLiBudgets(bs); setLiInputs(Object.fromEntries(Object.keys(cats).map(k=>[k,""])));
        return null;
      })()}

      {/* Goal editor */}
      {showGoalM&&goals[showGoalM]&&(()=>{
        const key=showGoalM, d=goalDraft;
        const s=parseFloat(d.savedDraft)||0, t=parseFloat(d.targetDraft)||0, m=parseFloat(d.monthlyDraft)||0;
        const rem=Math.max(0,t-s), mo=m>0?Math.ceil(rem/m):null;
        const proj=mo?(()=>{const dd=new Date();dd.setMonth(dd.getMonth()+mo);return dd.toLocaleDateString("en-US",{month:"long",year:"numeric"});})():null;
        const linkedCats=d.linkedCategories||[];
        return (
          <Modal title={key} onClose={()=>setShowGoalM(null)} footer={
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button style={S.btnGhost} onClick={()=>setShowGoalM(null)}>cancel</button>
              <button style={S.btnPrimary} onClick={()=>{
                setGoals(p=>({...p,[key]:{...p[key],saved:s,target:t,deadline:d.deadline||p[key].deadline,priority:d.priority||p[key].priority,linkedCategories:linkedCats,linkedAccount:d.linkedAccount||""}}));
                if(m) setMBudgets(p=>({...p,[curMonth]:{...(p[curMonth]||{}),[key]:m}}));
                // sync to linked account's savingsGoals
                if(d.linkedAccount) {
                  setAccounts(p=>p.map(a=>{
                    if(a.id===d.linkedAccount&&!(a.savingsGoals||[]).includes(key)) return {...a,savingsGoals:[...(a.savingsGoals||[]),key]};
                    if(a.id!==d.linkedAccount&&(a.savingsGoals||[]).includes(key)) return {...a,savingsGoals:a.savingsGoals.filter(g=>g!==key)};
                    return a;
                  }));
                }
                setShowGoalM(null);
              }}>save</button>
            </div>
          }>
            <div style={{paddingTop:16,display:"flex",flexDirection:"column",gap:12}}>
              {/* Add / subtract committed */}
              <div style={{background:"#8faa8b18",border:"1.5px solid #8faa8b44",borderRadius:12,padding:"12px 14px"}}>
                <div style={{display:"flex",gap:4,marginBottom:10}}>
                  {[{id:"add",label:"➕ add",color:"#4a7c59",bg:"#8faa8b"},{id:"subtract",label:"➖ subtract",color:"#b85050",bg:"#c88b8b"}].map(m=>(
                    <button key={m.id} onClick={()=>setGoalDraft(p=>({...p,_commitMode:m.id}))}
                      style={{...S.sans,flex:1,fontSize:"0.72rem",fontWeight:500,padding:"5px 0",borderRadius:7,cursor:"pointer",
                        border:`1.5px solid ${(d._commitMode||"add")===m.id?m.bg+"88":"#e0d0be"}`,
                        background:(d._commitMode||"add")===m.id?m.bg+"18":"transparent",
                        color:(d._commitMode||"add")===m.id?m.color:"#4a3020"}}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input style={{...S.input,flex:1,fontSize:"1rem"}} type="number" inputMode="decimal"
                    placeholder={(d._commitMode||"add")==="add"?"amount to add":"amount to remove"}
                    id="add-savings-input"/>
                  <button style={{...S.btnPrimary,
                    background:(d._commitMode||"add")==="add"?"#4a7c59":"#b85050",
                    whiteSpace:"nowrap"}}
                    onClick={()=>{
                      const inp=document.getElementById("add-savings-input");
                      const amt=parseFloat(inp?.value)||0;
                      if(amt<=0) return;
                      const mode=d._commitMode||"add";
                      const current=parseFloat(d.savedDraft)||0;
                      const next=mode==="add"?current+amt:Math.max(0,current-amt);
                      setGoalDraft(p=>({...p,savedDraft:String(next)}));
                      if(inp) inp.value="";
                    }}>
                    {(d._commitMode||"add")==="add"?"+ add":"− remove"}
                  </button>
                </div>
                <div style={{...S.sans,fontSize:"0.69rem",color:"#4a7c59",marginTop:6}}>
                  committed so far: <strong>{fmt(s)}</strong>
                </div>
              </div>
              {/* Reallocate from another goal */}
              <div style={{background:"#c8a88218",border:"1.5px solid #c8a88244",borderRadius:12,padding:"12px 14px"}}>
                <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#8a6a3a",marginBottom:8}}>↔️ reallocate from another goal</div>
                <div style={{display:"flex",gap:7,alignItems:"flex-end",flexWrap:"wrap"}}>
                  <div style={{flex:2,minWidth:110}}>
                    <select style={{...S.select,fontSize:"0.78rem"}} id="realloc-from">
                      <option value="">select goal…</option>
                      {Object.entries(goals).filter(([k])=>k!==key&&(goals[k].saved||0)>0).map(([k,g])=>(
                        <option key={k} value={k}>{g.emoji||"🎯"} {k} ({fmt(g.saved||0)})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{flex:1,minWidth:70}}>
                    <input style={S.input} type="number" inputMode="decimal" placeholder="amt" id="realloc-amt"/>
                  </div>
                  <button style={{...S.btnPrimary,background:"#8a6a3a",whiteSpace:"nowrap"}} onClick={()=>{
                    const fromKey=document.getElementById("realloc-from")?.value;
                    const amt=parseFloat(document.getElementById("realloc-amt")?.value)||0;
                    if(!fromKey||amt<=0) return;
                    const avail=goals[fromKey]?.saved||0;
                    const actual=Math.min(amt,avail);
                    if(actual<=0) return;
                    setGoals(p=>({...p,[fromKey]:{...p[fromKey],saved:Math.max(0,(p[fromKey].saved||0)-actual)}}));
                    setGoalDraft(p=>({...p,savedDraft:String((parseFloat(p.savedDraft)||0)+actual)}));
                    document.getElementById("realloc-from").value="";
                    document.getElementById("realloc-amt").value="";
                  }}>move →</button>
                </div>
              </div>
              <FormGroup label="total target">
                <input style={{...S.input,fontSize:"1.1rem"}} type="number" inputMode="decimal" value={d.targetDraft} onChange={e=>setGoalDraft(p=>({...p,targetDraft:e.target.value}))}/>
              </FormGroup>
              <FormRow>
                <FormGroup label="priority">
                  <select style={S.select} value={d.priority||goals[key].priority} onChange={e=>setGoalDraft(p=>({...p,priority:e.target.value}))}>
                    {["high","mid","low"].map(v=><option key={v} value={v}>{v}</option>)}
                  </select>
                </FormGroup>
                <FormGroup label="deadline">
                  <input style={S.input} value={d.deadline||goals[key].deadline||""} onChange={e=>setGoalDraft(p=>({...p,deadline:e.target.value}))}/>
                </FormGroup>
              </FormRow>
              {/* Link to account */}
              <FormGroup label="linked account">
                <select style={S.select} value={d.linkedAccount||""} onChange={e=>setGoalDraft(p=>({...p,linkedAccount:e.target.value}))}>
                  <option value="">no account linked</option>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name} {a.label}</option>)}
                </select>
              </FormGroup>
              {/* Link categories */}
              <div style={{background:"#7a9ec818",border:"1.5px solid #7a9ec844",borderRadius:12,padding:"12px 14px"}}>
                <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#5a7ea8",marginBottom:8}}>🔗 linked categories</div>
                <div style={{...S.sans,fontSize:"0.73rem",color:"#4a3020",marginBottom:10}}>Transactions in these categories auto-add to your committed total.</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {allCatItems.map(cat=>{
                    const isLinked=linkedCats.includes(cat);
                    return (
                      <button key={cat} onClick={()=>setGoalDraft(p=>({...p,linkedCategories:isLinked?linkedCats.filter(c=>c!==cat):[...linkedCats,cat]}))}
                        style={{...S.sans,fontSize:"0.72rem",padding:"4px 10px",borderRadius:16,cursor:"pointer",
                          border:`1.5px solid ${isLinked?"#7a9ec8":"#e0d0be"}`,
                          background:isLinked?"#7a9ec822":"transparent",
                          color:isLinked?"#5a7ea8":"#7a6048",fontWeight:isLinked?500:400}}>
                        {isLinked?"✓ ":""}{cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Paydown calc */}
              <div style={{background:"#fdfaf6",border:"1.5px solid #e8ddd0",borderRadius:12,padding:"14px 16px"}}>
                <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#7a5c3a",marginBottom:10}}>paydown calculator</div>
                <FormGroup label="monthly contribution">
                  <input style={S.input} type="number" inputMode="decimal" value={d.monthlyDraft} onChange={e=>setGoalDraft(p=>({...p,monthlyDraft:e.target.value}))}/>
                </FormGroup>
                {mo&&<div style={{...S.sans,fontSize:"0.8rem",padding:"8px 10px",borderRadius:8,background:"#8faa8b18",border:"1px solid #8faa8b44",color:"#2a1f14",marginTop:8}}>
                  {rem<=0?"🎉 goal reached!":`at ${fmt(m)}/mo → ~${mo} month${mo!==1?"s":""} (${proj})`}
                </div>}
              </div>
              <div style={{height:8}}/>
            </div>
          </Modal>
        );
      })()}

      {/* Add goal */}
      {showAG&&(
        <Modal title="new savings goal" onClose={()=>setShowAG(false)} footer={
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button style={S.btnGhost} onClick={()=>setShowAG(false)}>cancel</button>
            <button style={{...S.btnPrimary,opacity:newG.name.trim()?1:0.5}} onClick={()=>{
              const name=newG.name.trim().toLowerCase(); if(!name||goals[name]) return;
              setGoals(p=>({...p,[name]:{target:parseFloat(newG.target)||0,saved:parseFloat(newG.saved)||0,priority:newG.priority,deadline:newG.deadline,emoji:newG.emoji||"🎯",linkedCategories:newG.linkedCategories||[],linkedAccount:newG.linkedAccount||""}}));
              if(newG.monthly) setMBudgets(p=>({...p,[curMonth]:{...(p[curMonth]||{}),[name]:parseFloat(newG.monthly)||0}}));
              if(newG.linkedAccount) setAccounts(p=>p.map(a=>a.id===newG.linkedAccount?{...a,savingsGoals:[...(a.savingsGoals||[]),name]}:a));
              setGoalOrder(p=>[...p,name]);
              setNewG({name:"",emoji:"🎯",target:"",saved:"",priority:"mid",deadline:"",monthly:"",linkedCategories:[],linkedAccount:""});
              setShowAG(false);
              // Navigate to Year → Plan view with new goal highlighted
              setPeriod("year");
              setView("tracker");
              // Signal YearView to highlight this goal and switch to Plan mode
              // We use a small timeout so the view renders first
              setTimeout(()=>{
                window.__pachiraNewGoal = name;
              }, 50);
            }}>create goal</button>
          </div>
        }>
          <div style={{paddingTop:16,display:"flex",flexDirection:"column",gap:12}}>
            <FormRow>
              <FormGroup label="emoji"><input style={{...S.input,textAlign:"center",fontSize:"1.2rem"}} value={newG.emoji} onChange={e=>setNewG(p=>({...p,emoji:e.target.value}))}/></FormGroup>
              <FormGroup label="goal name *"><input style={S.input} placeholder="e.g. new laptop" autoFocus value={newG.name} onChange={e=>setNewG(p=>({...p,name:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup label="target amount"><input style={S.input} type="number" inputMode="decimal" placeholder="0" value={newG.target} onChange={e=>setNewG(p=>({...p,target:e.target.value}))}/></FormGroup>
              <FormGroup label="already committed"><input style={S.input} type="number" inputMode="decimal" placeholder="0" value={newG.saved} onChange={e=>setNewG(p=>({...p,saved:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup label="priority"><select style={S.select} value={newG.priority} onChange={e=>setNewG(p=>({...p,priority:e.target.value}))}>{["high","mid","low"].map(v=><option key={v} value={v}>{v}</option>)}</select></FormGroup>
              <FormGroup label="deadline"><input style={S.input} placeholder="e.g. July 2026" value={newG.deadline} onChange={e=>setNewG(p=>({...p,deadline:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormGroup label="monthly contribution"><input style={S.input} type="number" inputMode="decimal" placeholder="0" value={newG.monthly} onChange={e=>setNewG(p=>({...p,monthly:e.target.value}))}/></FormGroup>
            <FormGroup label="linked account">
              <select style={S.select} value={newG.linkedAccount} onChange={e=>setNewG(p=>({...p,linkedAccount:e.target.value}))}>
                <option value="">no account</option>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.name} {a.label}</option>)}
              </select>
            </FormGroup>
            {/* Reallocate from existing goal at creation time */}
            {Object.entries(goals).some(([,g])=>(g.saved||0)>0)&&(
              <div style={{background:"#c8a88218",border:"1.5px solid #c8a88244",borderRadius:12,padding:"12px 14px"}}>
                <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#8a6a3a",marginBottom:8}}>↔️ seed from another goal (optional)</div>
                <div style={{display:"flex",gap:7,alignItems:"flex-end",flexWrap:"wrap"}}>
                  <div style={{flex:2,minWidth:110}}>
                    <select style={{...S.select,fontSize:"0.78rem"}} id="newg-realloc-from">
                      <option value="">select goal…</option>
                      {Object.entries(goals).filter(([,g])=>(g.saved||0)>0).map(([k,g])=>(
                        <option key={k} value={k}>{g.emoji||"🎯"} {k} ({fmt(g.saved||0)})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{flex:1,minWidth:70}}>
                    <input style={S.input} type="number" inputMode="decimal" placeholder="amt" id="newg-realloc-amt"/>
                  </div>
                  <button style={{...S.btnPrimary,background:"#8a6a3a",whiteSpace:"nowrap"}} onClick={()=>{
                    const fromKey=document.getElementById("newg-realloc-from")?.value;
                    const amt=parseFloat(document.getElementById("newg-realloc-amt")?.value)||0;
                    if(!fromKey||amt<=0) return;
                    const avail=goals[fromKey]?.saved||0;
                    const actual=Math.min(amt,avail);
                    if(actual<=0) return;
                    setGoals(p=>({...p,[fromKey]:{...p[fromKey],saved:Math.max(0,(p[fromKey].saved||0)-actual)}}));
                    setNewG(p=>({...p,saved:String((parseFloat(p.saved)||0)+actual)}));
                    document.getElementById("newg-realloc-from").value="";
                    document.getElementById("newg-realloc-amt").value="";
                  }}>move →</button>
                </div>
              </div>
            )}
            <FormGroup label="link categories">
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {allCatItems.map(cat=>{
                  const isLinked=(newG.linkedCategories||[]).includes(cat);
                  return (
                    <button key={cat} onClick={()=>setNewG(p=>({...p,linkedCategories:isLinked?(p.linkedCategories||[]).filter(c=>c!==cat):[...(p.linkedCategories||[]),cat]}))}
                      style={{...S.sans,fontSize:"0.69rem",padding:"3px 9px",borderRadius:14,cursor:"pointer",
                        border:`1.5px solid ${isLinked?"#7a9ec8":"#e0d0be"}`,
                        background:isLinked?"#7a9ec822":"transparent",
                        color:isLinked?"#5a7ea8":"#7a6048"}}>
                      {isLinked?"✓ ":""}{cat}
                    </button>
                  );
                })}
              </div>
            </FormGroup>
            <div style={{height:8}}/>
          </div>
        </Modal>
      )}

      {/* Add loan */}
      {showAL&&(
        <Modal title="new loan" onClose={()=>setShowAL(false)} footer={
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button style={S.btnGhost} onClick={()=>setShowAL(false)}>cancel</button>
            <button style={{...S.btnPrimary,opacity:newL.name.trim()?1:0.5}} onClick={()=>{
              const name=newL.name.trim().toLowerCase(); if(!name||loans[name]) return;
              setLoans(p=>({...p,[name]:{target:parseFloat(newL.target)||0,paid:parseFloat(newL.paid)||0,priority:newL.priority,deadline:newL.deadline,emoji:newL.emoji||"📋",notes:newL.notes,monthlyPayment:parseFloat(newL.monthly)||0}}));
              setNewL({name:"",emoji:"📋",target:"",paid:"",priority:"mid",deadline:"",monthly:"",notes:""}); setShowAL(false);
            }}>add loan</button>
          </div>
        }>
          <div style={{paddingTop:16,display:"flex",flexDirection:"column",gap:12}}>
            <FormRow>
              <FormGroup label="emoji"><input style={{...S.input,textAlign:"center",fontSize:"1.2rem"}} value={newL.emoji} onChange={e=>setNewL(p=>({...p,emoji:e.target.value}))}/></FormGroup>
              <FormGroup label="loan name *"><input style={S.input} placeholder="e.g. car loan" autoFocus value={newL.name} onChange={e=>setNewL(p=>({...p,name:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup label="total owed"><input style={S.input} type="number" inputMode="decimal" placeholder="0" value={newL.target} onChange={e=>setNewL(p=>({...p,target:e.target.value}))}/></FormGroup>
              <FormGroup label="already paid"><input style={S.input} type="number" inputMode="decimal" placeholder="0" value={newL.paid} onChange={e=>setNewL(p=>({...p,paid:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup label="monthly payment"><input style={S.input} type="number" inputMode="decimal" placeholder="0" value={newL.monthly} onChange={e=>setNewL(p=>({...p,monthly:e.target.value}))}/></FormGroup>
              <FormGroup label="priority"><select style={S.select} value={newL.priority} onChange={e=>setNewL(p=>({...p,priority:e.target.value}))}>{["high","mid","low"].map(v=><option key={v} value={v}>{v}</option>)}</select></FormGroup>
            </FormRow>
            <FormGroup label="notes"><input style={S.input} placeholder="optional" value={newL.notes} onChange={e=>setNewL(p=>({...p,notes:e.target.value}))}/></FormGroup>
            <div style={{height:8}}/>
          </div>
        </Modal>
      )}

      {/* Add account */}
      {showAA&&(
        <Modal title="add account" onClose={()=>setShowAA(false)} footer={
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button style={S.btnGhost} onClick={()=>setShowAA(false)}>cancel</button>
            <button style={{...S.btnPrimary,opacity:newA.name.trim()?1:0.5}} onClick={()=>{
              const name=newA.name.trim(); if(!name) return;
              const id=name.toLowerCase().replace(/\s+/g,"_")+"_"+uid();
              setAccounts(p=>[...p,{id,name,label:newA.label,type:newA.type,color:"#8a5c2a",balance:parseFloat(newA.balance)||0,bills:[],savingsGoals:[],notes:newA.notes,...(newA.type==="credit"?{creditLimit:parseFloat(newA.creditLimit)||0,payoffTarget:parseFloat(newA.balance)||0}:{})}]);
              setNewA({name:"",label:"Checking",type:"checking",balance:"",creditLimit:"",notes:""}); setShowAA(false);
            }}>add account</button>
          </div>
        }>
          <div style={{paddingTop:16,display:"flex",flexDirection:"column",gap:12}}>
            <FormRow>
              <FormGroup label="account name *"><input style={S.input} placeholder="e.g. Chase" autoFocus value={newA.name} onChange={e=>setNewA(p=>({...p,name:e.target.value}))}/></FormGroup>
              <FormGroup label="label"><input style={S.input} placeholder="e.g. Checking" value={newA.label} onChange={e=>setNewA(p=>({...p,label:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormGroup label="account type">
              <div style={{display:"flex",gap:6}}>
                {[{id:"checking",label:"🏦 Checking"},{id:"savings",label:"🪙 Savings"},{id:"credit",label:"💳 Credit"}].map(t=>(
                  <button key={t.id} onClick={()=>setNewA(p=>({...p,type:t.id}))}
                    style={{...S.sans,fontSize:"0.78rem",padding:"6px 10px",borderRadius:8,cursor:"pointer",flex:1,
                      border:`1.5px solid ${newA.type===t.id?"#c8a882":"#e0d0be"}`,
                      background:newA.type===t.id?"#c8a88222":"transparent",color:newA.type===t.id?"#2c2116":"#7a6048"}}>{t.label}</button>
                ))}
              </div>
            </FormGroup>
            <FormRow>
              <FormGroup label={newA.type==="credit"?"balance owed":"current balance"}><input style={S.input} type="number" inputMode="decimal" placeholder="0" value={newA.balance} onChange={e=>setNewA(p=>({...p,balance:e.target.value}))}/></FormGroup>
              {newA.type==="credit"&&<FormGroup label="credit limit"><input style={S.input} type="number" inputMode="decimal" placeholder="0" value={newA.creditLimit} onChange={e=>setNewA(p=>({...p,creditLimit:e.target.value}))}/></FormGroup>}
            </FormRow>
            <FormGroup label="notes"><input style={S.input} placeholder="optional" value={newA.notes} onChange={e=>setNewA(p=>({...p,notes:e.target.value}))}/></FormGroup>
            <div style={{height:8}}/>
          </div>
        </Modal>
      )}

      {/* Reallocation modal on goal delete */}
      {reallocGoal&&goals[reallocGoal]&&(
        <ReallocateModal
          goalKey={reallocGoal}
          goalData={goals[reallocGoal]}
          otherGoals={Object.fromEntries(Object.entries(goals).filter(([k])=>k!==reallocGoal))}
          accounts={accounts}
          onDone={handleRealloc}/>
      )}

      {/* ── Payment Plan Setup Modal ─────────────────────────────────────────── */}
      {paymentPlanModal&&(
        <PaymentPlanModalInner
          paymentPlanModal={paymentPlanModal}
          loans={loans}
          now={now}
          curMonth={curMonth}
          MONTHS={MONTHS}
          fmt={fmt}
          S={S}
          addToRolloverPlan={addToRolloverPlan}
          setLoans={setLoans}
          onClose={()=>setPaymentPlanModal(null)}
        />
      )}

      {/* ── Period-flip underpayment prompt ──────────────────────────────────── */}
      {planPrompt&&(
        <Modal title="payment plan check-in 💳" onClose={()=>setPlanPrompt(null)} footer={null}>
          <div style={{padding:"16px 0",display:"flex",flexDirection:"column",gap:12}}>
            <div style={{...S.sans,fontSize:"0.85rem",color:"#2a1f14"}}>
              Last period you paid <strong>{fmt(planPrompt.paidLastPeriod)}</strong> toward {planPrompt.loanName} — <strong>{fmt(planPrompt.shortfall)} short</strong> of your {fmt(planPrompt.expectedPerPeriod)}/period plan.
            </div>
            {[
              {
                id:"catchup",
                emoji:"⚡",
                title:"get back on track",
                desc:`pay ${fmt(planPrompt.expectedPerPeriod + planPrompt.shortfall)} this period to catch up`,
                action:()=>{
                  setLoans(p=>({...p,[planPrompt.loanKey]:{...p[planPrompt.loanKey],catchUpPeriod:true}}));
                  setPlanPrompt(null);
                }
              },
              {
                id:"extend",
                emoji:"📅",
                title:"extend the plan",
                desc:"keep paying the same amount, finish a bit later",
                action:()=>{
                  setLoans(p=>{
                    const loan = p[planPrompt.loanKey];
                    const remaining = (loan.target||0)-(loan.paid||0);
                    const newMonths = Math.ceil(remaining / (loan.monthlyPayment||1));
                    return {...p,[planPrompt.loanKey]:{...loan,months:newMonths}};
                  });
                  setPlanPrompt(null);
                }
              },
            ].map(opt=>(
              <button key={opt.id} onClick={opt.action}
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,
                  cursor:"pointer",textAlign:"left",border:"1.5px solid #e0d0be",background:"#fff",...S.sans}}>
                <span style={{fontSize:"1.3rem"}}>{opt.emoji}</span>
                <div>
                  <div style={{fontSize:"0.85rem",fontWeight:500}}>{opt.title}</div>
                  <div style={{fontSize:"0.72rem",color:"#7a5c3a",marginTop:2}}>{opt.desc}</div>
                </div>
              </button>
            ))}
            <button onClick={()=>setPlanPrompt(null)}
              style={{...S.sans,fontSize:"0.75rem",color:"#8a6848",background:"none",border:"none",cursor:"pointer",textAlign:"center",padding:"4px"}}>
              dismiss for now
            </button>
          </div>
        </Modal>
      )}

      {/* ── Overpayment prompt ───────────────────────────────────────────────── */}
      {overpayPrompt&&(
        <Modal title="you paid extra! 🎉" onClose={()=>setOverpayPrompt(null)} footer={null}>
          <div style={{padding:"16px 0",display:"flex",flexDirection:"column",gap:12}}>
            <div style={{...S.sans,fontSize:"0.85rem",color:"#2a1f14"}}>
              You paid <strong>{fmt(overpayPrompt.extra)} more</strong> than your plan this period toward {overpayPrompt.loanName}. Want to keep that pace?
            </div>
            {[
              {
                id:"accelerate",
                emoji:"🚀",
                title:"accelerate",
                desc:`update plan to ${fmt(overpayPrompt.monthlyPayment/2+overpayPrompt.extra)}/period — pay it off sooner`,
                action:()=>{
                  setLoans(p=>{
                    const loan = p[overpayPrompt.loanKey];
                    const newMonthly = Math.ceil(((loan.target||0)-(loan.paid||0)) / Math.max(1, (loan.months||3)-1));
                    return {...p,[overpayPrompt.loanKey]:{...loan,monthlyPayment:newMonthly}};
                  });
                  setOverpayPrompt(null);
                }
              },
              {
                id:"staycourse",
                emoji:"📋",
                title:"stay on original plan",
                desc:`keep paying ${fmt(overpayPrompt.monthlyPayment/2)}/period — you're ahead!`,
                action:()=>setOverpayPrompt(null)
              },
            ].map(opt=>(
              <button key={opt.id} onClick={opt.action}
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,
                  cursor:"pointer",textAlign:"left",border:"1.5px solid #e0d0be",background:"#fff",...S.sans}}>
                <span style={{fontSize:"1.3rem"}}>{opt.emoji}</span>
                <div>
                  <div style={{fontSize:"0.85rem",fontWeight:500}}>{opt.title}</div>
                  <div style={{fontSize:"0.72rem",color:"#7a5c3a",marginTop:2}}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* ── Period switch confirmation (affects Home pinned items) ───────────── */}
      {periodSwitchConfirm&&(
        <Modal title="switch period?" onClose={()=>setPeriodSwitchConfirm(null)} footer={null}>
          <div style={{padding:"14px 0",display:"flex",flexDirection:"column",gap:14}}>
            <div style={{...S.sans,fontSize:"0.85rem",color:"#2a1f14"}}>
              Switch to <strong>{periodSwitchConfirm.targetLabel}</strong>? Your pinned Home categories will update to match.
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={S.btnGhost} onClick={()=>setPeriodSwitchConfirm(null)}>cancel</button>
              <button style={{...S.btnPrimary,flex:1}} onClick={()=>{
                setPeriod(periodSwitchConfirm.targetPeriod);
                setPeriodSwitchConfirm(null);
              }}>switch</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Remove treat prompt ─────────────────────────────────────────────── */}
      {removePrompt&&(
        <Modal title="removed 🌿" onClose={()=>setRemovePrompt(null)} footer={null}>
          <div style={{paddingTop:16,display:"flex",flexDirection:"column",gap:12,paddingBottom:20}}>
            <div style={{...S.sans,fontSize:"0.85rem",color:"#2a1f14",textAlign:"center"}}>
              what would you like to do instead?
            </div>
            <button onClick={()=>{
              resolveTreat(removePrompt.treat);
              setRemovePrompt(null);
              setView("intentions");
              setIntentionsTab("deferred");
              setFromHabitCelebration(true);
            }} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,cursor:"pointer",textAlign:"left",border:"1.5px solid #e0d0be",background:"#fff",...S.sans}}>
              <span style={{fontSize:"1.2rem"}}>🎁</span>
              <div>
                <div style={{fontSize:"0.85rem",fontWeight:500}}>pick something else</div>
                <div style={{fontSize:"0.72rem",color:"#7a5c3a",marginTop:2}}>go back to your wishlist and choose a different treat</div>
              </div>
            </button>
            {Object.keys(goals).length > 0 && (
              <button onClick={()=>{
                resolveTreat(removePrompt.treat);
                setRemovePrompt(null);
                setShowDeposit(true);
              }} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,cursor:"pointer",textAlign:"left",border:"1.5px solid #e0d0be",background:"#fff",...S.sans}}>
                <span style={{fontSize:"1.2rem"}}>🌱</span>
                <div>
                  <div style={{fontSize:"0.85rem",fontWeight:500}}>
                    put {removePrompt.treat.price ? fmt(parseFloat(removePrompt.treat.price)) : "it"} toward a goal
                  </div>
                  <div style={{fontSize:"0.72rem",color:"#7a5c3a",marginTop:2}}>open the deposit flow and allocate to a savings goal</div>
                </div>
              </button>
            )}
            <button onClick={()=>{
              resolveTreat(removePrompt.treat);
              setRemovePrompt(null);
            }} style={{...S.sans,fontSize:"0.75rem",color:"#8a6848",background:"none",border:"none",cursor:"pointer",textAlign:"center",padding:"4px"}}>
              just remove it
            </button>
          </div>
        </Modal>
      )}

      {/* ── Goal / Loan win celebration ─────────────────────────────────────── */}
      {winCelebration&&(
        <Modal title={winCelebration.type==="loan"?"loan paid off! 🎉":"goal reached! 🎉"}
          onClose={()=>setWinCelebration(null)} footer={null}>
          <div style={{padding:"16px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div style={{fontSize:"3.5rem",lineHeight:1}}>{winCelebration.emoji}</div>
            <div style={{textAlign:"center"}}>
              <div style={{...S.serif,fontSize:"1.3rem",color:"#2c2116",marginBottom:4}}>
                <em>{winCelebration.name}</em> {winCelebration.type==="loan"?"is paid off":"is fully funded"} 🌱
              </div>
              <div style={{...S.sans,fontSize:"0.82rem",color:"#7a5c3a"}}>
                {fmt(winCelebration.amount)} — you did it!
              </div>
            </div>
            <div style={{height:1,background:"#e8ddd0",width:"100%"}}/>
            <div style={{...S.sans,fontSize:"0.78rem",color:"#2a1f14",textAlign:"center"}}>
              Archive it to keep your {winCelebration.type==="loan"?"loans":"goals"} list clean — it'll be saved in your history.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,width:"100%"}}>
              <button onClick={()=>{
                if (winCelebration.type==="goal") {
                  setArchived(p=>({...p,[winCelebration.key]:{...goals[winCelebration.key],archivedAt:Date.now(),type:"goal"}}));
                  setGoals(p=>{ const n={...p}; delete n[winCelebration.key]; return n; });
                  setGoalOrder(p=>p.filter(k=>k!==winCelebration.key));
                } else {
                  setArchived(p=>({...p,[`loan_${winCelebration.key}`]:{...loans[winCelebration.key],archivedAt:Date.now(),type:"loan",name:winCelebration.name}}));
                  setLoans(p=>{ const n={...p}; delete n[winCelebration.key]; return n; });
                }
                setWinCelebration(null);
              }} style={{...S.btnPrimary,padding:"12px 0",fontSize:"0.88rem",borderRadius:12,textAlign:"center"}}>
                ✓ archive it
              </button>
              <button onClick={()=>setWinCelebration(null)}
                style={{...S.btnGhost,padding:"10px 0",fontSize:"0.82rem",borderRadius:12,textAlign:"center"}}>
                keep it visible for now
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Habit completion celebration modal */}
      {habitComplete&&(
        <Modal title="habit complete! 🎉" onClose={()=>setHabitComplete(null)} footer={null}>
          <div style={{paddingTop:16,display:"flex",flexDirection:"column",gap:14,paddingBottom:20}}>
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:"3rem",marginBottom:8}}>{habitComplete.emoji}</div>
              <div style={{...S.serif,fontSize:"1.3rem",marginBottom:6}}>you did it!</div>
              <div style={{...S.sans,fontSize:"0.85rem",color:"#7a5c3a"}}>
                <strong>{habitComplete.name}</strong> goal reached 🌱
              </div>
            </div>
            {/* Prize + deferred nudge */}
            <div style={{background:"#c8a88218",border:"1.5px solid #c8a88244",borderRadius:12,padding:"14px 16px"}}>
              <div style={{...S.sans,fontSize:"0.67rem",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:"#8a6a3a",marginBottom:8}}>🎁 claim your prize</div>
              <input style={S.input} placeholder="treat yourself to… (e.g. fancy coffee, movie night)" id="habit-prize-input"/>
              <div style={{...S.sans,fontSize:"0.68rem",color:"#7a5c3a",marginTop:6}}>you earned it. write it down and go do it.</div>
              <button onClick={()=>{setHabitComplete(null);setView("intentions");setIntentionsTab("deferred");setFromHabitCelebration(true);}}
                style={{...S.sans,fontSize:"0.72rem",color:"#8a5c2a",background:"none",border:"none",cursor:"pointer",marginTop:8,padding:0}}>
                🎁 pick something from your wishlist →
              </button>
            </div>
            <div style={{...S.sans,fontSize:"0.82rem",color:"#2a1f14",fontWeight:500}}>what would you like to do with this habit?</div>
            {[
              {id:"continue", label:"🔄 keep going", desc:"reset counter and continue tracking"},
              {id:"retire",   label:"✅ retire it",   desc:"archive this habit to free a slot"},
            ].map(opt=>(
              <button key={opt.id} onClick={()=>{
                const prize = document.getElementById("habit-prize-input")?.value||"";
                // Only mark claimed now if no treat is pinned — otherwise wait until treat is resolved
                const hasPinnedTreat = pinnedTreats.some(t=>t.fromHabitId===habitComplete.id);
                if(opt.id==="continue"){
                  setHabits(p=>p.map(h=>{
                    if(h.id!==habitComplete.id) return h;
                    const cadence=h.cadence;
                    let logs=h.logs||[];
                    if(cadence==="monthly"){
                      const prefix=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
                      logs=logs.filter(d=>!d.startsWith(prefix));
                    } else if(cadence==="yearly"){
                      logs=logs.filter(d=>!d.startsWith(String(now.getFullYear())));
                    } else { logs=[]; }
                    // If treat is pinned, don't set lastPrize yet — it'll be set when treat is resolved
                    return hasPinnedTreat
                      ? {...h,logs,celebrationTriggered:false}
                      : {...h,logs,lastPrize:prize||"claimed",celebrationTriggered:false};
                  }));
                } else {
                  // Retire
                  if(!hasPinnedTreat){
                    setHabits(p=>p.filter(h=>h.id!==habitComplete.id));
                  } else {
                    // Keep in habits (hidden) until treat resolved, then remove
                    setHabits(p=>p.map(h=>h.id!==habitComplete.id?h:{...h,pendingRetire:true,celebrationTriggered:false}));
                  }
                }
                setHabitComplete(null);
              }} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:10,cursor:"pointer",textAlign:"left",
                border:"1.5px solid #e0d0be",background:"#fff",...S.sans}}>
                <div>
                  <div style={{fontSize:"0.85rem",fontWeight:500}}>{opt.label}</div>
                  <div style={{fontSize:"0.72rem",color:"#7a5c3a",marginTop:2}}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}