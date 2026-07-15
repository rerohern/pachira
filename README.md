🌿 Pachira

Money is more than numbers and optimization. It reflects how we value ourselves and the life we want to create. 

Pachira is a mindful personal finance app inspired by the Japanese concepts of mottainai (the regret of waste) and taisetsu ni suru (to cherish what you have). It helps you understand your spending habits, reduce unnecessary waste, and care for your money with greater intention.

This digital space helps you cultivate a healthier relationship with money by organizing your accounts, tracking savings, and creating systems that support mindful financial habits. Emotional spending isn’t judged, it’s understood. This PWA gives you the tools to notice, reflect, and grow your capacity to hold and care for your money with intention. Pachira started as a spiritual successor to a budgeting Google Sheet called Money Loves Me — and grew into a full app that reflects how a real person actually thinks about money.


| What it is  |

Pachira is a biweekly budgeting app designed for people who get paid on a schedule and want to plan their money across two pay periods per month, not just a single monthly view. It tracks spending, goals, loans, habits, and mood alongside your numbers.

As a PWA, it can be installed to your phone and saves everything locally in your browser.


| Development approach | Solo product + AI-assisted development |
Pachira was built collaboratively with AI as a development partner. I drove the product vision, UX decisions, feature design, data architecture, and all creative direction. AI served as a coding tutor and thought partner — helping me work through implementation challenges, learn unfamiliar patterns, and move faster than I could alone. All product decisions, the overall system design, and the final shape of the app are mine.


| Features:  |

Budget


Monthly + biweekly views | plan the full month, then split it across 1st–15th and 16th–end periods
One-directional sync | saving your 1st–15th budget auto-fills 16th–end as the remainder; editing 16th–end never overwrites the first half
"Left" not "spent" | every budget row shows $X left of $Y so you always know your spending room at a glance
Pinned categories on Home | star up to 4 budget rows to surface them on the Home tab as quick spending-room cards
Mood breakdown | tag every transaction as happy ✨, necessary 🫡, guilty pleasure 🫣, or regretted 😬; see a mood ring breakdown per period
Period assignment from date | transactions filed into the correct period based on the selected date, not today's date


Accounts


Track checking, savings, and credit card accounts
Credit utilization with 10% and 30% markers
Bill assignment per account
Direct deposit split configuration
Savings goal allocation per savings account


Goals & Loans


Savings goals with deadlines, priority levels, linked categories, and linked accounts
Suggested pace engine formula: (target - saved) / months remaining
Loan tracking with payment history
Archive completed goals and paid-off loans (history kept, not deleted)
Deleting goals = cancel + reallocate saved money elsewhere


Habits

Up to 3 active habits with punch-card tracking
30-day visual history
Completion celebration with wishlist prize flow


Wishlist


Deferred purchases — things you want when the time is right
Sort by date, price, or name
"Bought it" flow logs the transaction and removes from wishlist


Home


Personalized greeting with time of day
Balance carousel for paycheck accounts
Pinned spending-room cards (hide when over budget)
Pinned goals with progress bars
Recent transactions
Active habits with punch-in



Stack

LayerChoiceFrameworkReact (Vite)StylingCustom CSS + inline stylesStoragelocalStorage (with export/import backup)DeploymentVercel (auto-deploy from GitHub main)LogicbudgetLogic.js — pure functions, separately testable

No external UI libraries. No backend. No accounts or servers — your data stays on your device.


Local development

bashnpm install
npm run dev


Backup & restore

Since data lives in localStorage, it can be lost if the browser clears site data. Use the built-in backup system regularly:


Export — downloads pachira-backup-YYYY-MM-DD.json with all your data
Import — restores from a backup file (confirms before overwriting)


Find these in the sidebar (desktop) or at the bottom of the Goals tab (mobile).


Design philosophy

Pachira is designed to feel like a financial journal, not a dashboard. The visual language is warm parchment, olive green, and cream — intentionally different from the cold blues and grays of traditional finance apps. Wealth as cultivation and stewardship, not efficiency.


money loves you back 💛
