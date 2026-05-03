/**
 * BobOps Planning Analysis Module
 *
 * Accepts a BobPlannerPayload from the bob-planner frontend and returns
 * a structured analysis result including a full consulting-grade markdown report.
 *
 * The module understands Bob AI's structured markdown design documents and extracts
 * development phases, future enhancements, constraints, and open questions directly
 * from the document when present, falling back to keyword analysis otherwise.
 *
 * Usage:
 *   import { analyzePlan } from "./planning-analysis.js";
 *   const result = analyzePlan(payload);
 *   document.getElementById("report").textContent = result.report;
 *   // or: document.getElementById("report").innerHTML = marked.parse(result.report);
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURLY_RATE     = 70;
const RISK_BUFFER     = 1.2;
const RISK_BUFFER_PCT = 20;

/** @type {Record<string, { optimistic: number, likely: number, pessimistic: number }>} */
const KEYWORD_HOURS = {
  admin:            { optimistic: 24, likely: 40,  pessimistic: 72  },
  approval:         { optimistic: 16, likely: 32,  pessimistic: 56  },
  login:            { optimistic: 12, likely: 24,  pessimistic: 48  },
  calendar:         { optimistic: 20, likely: 36,  pessimistic: 64  },
  email:            { optimistic: 16, likely: 28,  pessimistic: 56  },
  sms:              { optimistic: 16, likely: 28,  pessimistic: 48  },
  kiosk:            { optimistic: 32, likely: 64,  pessimistic: 120 },
  "real-time":      { optimistic: 24, likely: 48,  pessimistic: 96  },
  dashboard:        { optimistic: 20, likely: 36,  pessimistic: 64  },
  analytics:        { optimistic: 32, likely: 56,  pessimistic: 96  },
  payment:          { optimistic: 40, likely: 72,  pessimistic: 120 },
  "multi-location": { optimistic: 28, likely: 48,  pessimistic: 88  },
  mobile:           { optimistic: 40, likely: 80,  pessimistic: 160 },
  notification:     { optimistic: 16, likely: 32,  pessimistic: 56  },
  offline:          { optimistic: 16, likely: 32,  pessimistic: 64  },
  search:           { optimistic: 8,  likely: 16,  pessimistic: 32  },
  background:       { optimistic: 12, likely: 24,  pessimistic: 48  },
  api:              { optimistic: 16, likely: 32,  pessimistic: 64  },
};

const BASE_HOURS = { optimistic: 12, likely: 24, pessimistic: 40 };

const FEATURE_MAP = {
  login:            { mvp: "User authentication (login / sign-up)",                          full: "SSO and social login providers",                                     risk: null,                                                                                                                                                    tip: "Use Auth0 or Firebase Auth — saves 10–15 hours vs. building from scratch." },
  admin:            { mvp: "Basic admin panel (view and manage records)",                    full: "Role-based access control with audit logging",                       risk: { level: "MEDIUM", message: "Admin panels often expand significantly once stakeholders see the first version." },                                      tip: null },
  approval:         { mvp: "Simple approval workflow (submit → approve / reject)",           full: "Multi-level approval chains with automated notifications",            risk: { level: "MEDIUM", message: "Approval workflows require careful state management — scope tends to grow." },                                         tip: null },
  calendar:         { mvp: "Basic scheduling and calendar view",                             full: "Two-way sync with Google Calendar and Outlook",                      risk: { level: "MEDIUM", message: "Calendar integrations frequently expand in scope once real users are involved." },                                     tip: "Defer external calendar sync to Phase 2 — use a simple internal scheduler for MVP." },
  email:            { mvp: "Transactional email notifications",                              full: "Custom email templates, open tracking, and digest emails",            risk: { level: "LOW",    message: "Email delivery requires CAN-SPAM opt-in compliance and unsubscribe handling." },                                       tip: "Use SendGrid's free tier (100 emails/day) to avoid early infrastructure costs." },
  sms:              { mvp: "SMS notifications via Twilio",                                   full: "Two-way SMS and delivery status tracking",                            risk: { level: "LOW",    message: "SMS requires carrier registration and opt-in compliance (TCPA)." },                                                     tip: "Defer SMS to Phase 2 — use email as the primary notification channel for MVP." },
  kiosk:            { mvp: "Basic kiosk interface (touch-friendly, single-purpose UI)",     full: "Offline mode, hardware integration, and remote management",           risk: { level: "HIGH",   message: "Kiosk development requires hardware testing, offline resilience, and UX constraints not present in standard web apps." }, tip: "Pilot with a tablet browser before investing in dedicated kiosk hardware." },
  "real-time":      { mvp: "Live data updates via polling or WebSocket",                    full: "Full real-time collaboration with conflict resolution",                risk: { level: "HIGH",   message: "Real-time features add significant infrastructure complexity — scaling must be planned early." },                          tip: "Start with 30-second polling for MVP before investing in WebSocket infrastructure." },
  dashboard:        { mvp: "Summary dashboard with key metrics",                             full: "Customizable widgets, filters, and date range comparisons",            risk: null,                                                                                                                                                    tip: null },
  analytics:        { mvp: "Basic usage reports and data export (CSV)",                     full: "Advanced analytics with trend analysis and custom report builder",     risk: { level: "MEDIUM", message: "Analytics requires a reliable data pipeline — poorly structured data early on is expensive to fix later." },            tip: "Defer advanced analytics to Phase 2. Use simple aggregation queries for MVP reports." },
  payment:          { mvp: "Payment processing via Stripe hosted checkout",                 full: "Custom payment flows, subscriptions, refunds, and invoicing",          risk: { level: "HIGH",   message: "Payment integration requires PCI compliance review — budget extra 20–30 hours for security validation." },               tip: "Use Stripe's hosted checkout — reduces payment scope by 30–40 hours vs. a custom UI." },
  "multi-location": { mvp: "Multi-location data separation and basic location switcher",    full: "Cross-location reporting and per-location permissions",                risk: { level: "HIGH",   message: "Multi-location architecture must be designed before writing any data models — retrofitting is very costly." },            tip: "Design the location data model first before building any features." },
  mobile:           { mvp: "Cross-platform mobile app (iOS and Android)",                   full: "App Store / Google Play deployment with automated CI/CD pipeline",    risk: { level: "HIGH",   message: "Cross-platform mobile development requires platform-specific testing on real devices — emulators alone are insufficient." }, tip: "Target one platform (iOS or Android) for MVP — adding the second typically adds 15–25% of the original cost." },
  notification:     { mvp: "Push or local notifications with basic scheduling",             full: "Smart notification logic (rotation, frequency caps, user preferences)", risk: { level: "MEDIUM", message: "Push notification permissions must be requested carefully — aggressive prompting leads to permanent denials." },           tip: "Use local notifications for MVP — no server infrastructure required." },
  offline:          { mvp: "Offline-first data storage with local persistence",             full: "Background sync and conflict resolution when connectivity is restored", risk: { level: "MEDIUM", message: "Offline-first architecture decisions must be made before building any data layer — retrofitting is expensive." },         tip: "Use AsyncStorage or SQLite for MVP local persistence — defer cloud sync to Phase 2." },
  search:           { mvp: "Basic search and filter functionality",                         full: "Full-text search with relevance ranking and advanced filters",          risk: null,                                                                                                                                                    tip: "Implement in-memory filtering for MVP — defer database full-text search to Phase 2." },
  background:       { mvp: "Background task execution (scheduled jobs or processing)",      full: "Resilient background processing with retry logic and monitoring",       risk: { level: "MEDIUM", message: "Background tasks on mobile have strict OS-imposed time limits (iOS: 30s, Android: ~10min for WorkManager)." },           tip: null },
  api:              { mvp: "Third-party API integration",                                   full: "Rate limiting, error recovery, and API usage monitoring",              risk: { level: "LOW",    message: "Third-party APIs can change without notice — always version-pin and monitor for deprecation." },                           tip: "Use an API wrapper library rather than raw HTTP calls to reduce maintenance burden." },
};

const BUILD_ORDER_PRIORITY = [
  "login", "admin", "approval", "offline", "mobile", "search",
  "dashboard", "calendar", "notification", "background", "email",
  "sms", "api", "analytics", "real-time", "payment", "multi-location", "kiosk",
];

const EXPENSIVE = new Set(["payment", "real-time", "analytics", "kiosk", "multi-location", "mobile"]);
const RISK_SORT = { HIGH: 0, MEDIUM: 1, LOW: 2 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text) {
  return String(text ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function threePointExpected(tp) {
  return Math.round((tp.optimistic + 4 * tp.likely + tp.pessimistic) / 6);
}

function currency(n) {
  return `$${n.toLocaleString("en-US")}`;
}

function hoursToTimeframe(hours) {
  const ft = Math.ceil(hours / 40);
  const pt = Math.ceil(hours / 20);
  if (ft <= 2) return `approximately ${ft} week(s) full-time`;
  if (ft <= 8) return `approximately ${ft} weeks full-time, or ${pt} weeks part-time`;
  return `approximately ${Math.ceil(ft / 4)} months full-time, or ${Math.ceil(pt / 4)} months part-time`;
}

// ─── Bob Markdown Document Parser ────────────────────────────────────────────

/**
 * Parse a Bob AI design document into a map of section heading → section content.
 * Handles numbered headings like "## 12. Development Phases" and
 * annotated ones like "## 11. Future Enhancements (Out of Scope for V1)".
 * @param {string} text
 * @returns {Record<string, string>}
 */
function parseSections(text) {
  const map = {};
  const lines = text.split("\n");
  let heading = null;
  let buffer = [];

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(?:\d+[\d.]*\s+)?(.+?)(?:\s*\(.*?\))?\s*$/);
    if (match) {
      if (heading !== null) map[heading] = buffer.join("\n");
      heading = match[1].toLowerCase().trim();
      buffer = [];
    } else if (heading !== null) {
      buffer.push(line);
    }
  }
  if (heading !== null) map[heading] = buffer.join("\n");
  return map;
}

/** @param {Record<string, string>} sections @param {string[]} keywords */
function findSection(sections, keywords) {
  for (const key of Object.keys(sections)) {
    if (keywords.some((kw) => key.includes(kw))) return sections[key];
  }
  return null;
}

/** @param {string | null} content */
function extractBullets(content) {
  if (!content) return [];
  return content
    .split("\n")
    .filter((l) => /^[-*•]\s+/.test(l.trim()))
    .map((l) => l.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

/** Extract development phases (### Phase X: Name) from a section body. */
function extractPhases(content) {
  if (!content) return [];
  const phases = [];
  let current = null;
  for (const line of content.split("\n")) {
    const m = line.match(/^###\s+Phase\s+\d+[:：]\s+(.+)$/i);
    if (m) {
      if (current) phases.push(current);
      current = { name: m[1].trim(), items: [] };
    } else if (current && /^[-*]\s+/.test(line.trim())) {
      current.items.push(line.replace(/^[-*]\s+/, "").trim());
    }
  }
  if (current) phases.push(current);
  return phases;
}

/** Count "## Task X:" headings in the full document. */
function countTasks(text) {
  return (text.match(/^##\s+Task\s+\d+/gm) ?? []).length;
}

// ─── Bob Output Extraction ────────────────────────────────────────────────────

/**
 * Layer 1: Try to extract and parse a machine-readable JSON block from Bob's reply.
 * @param {string} text
 * @returns {object | null}
 */
function tryParseJsonBlock(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw    = fenced
    ? fenced[1]
    : text.match(/\{[\s\S]*"(?:cost_drivers|risk_factors|features|project_summary)"[\s\S]*\}/)?.[0];
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Layer 2: Derive the best analysis text from the Bob output.
 * Prefers a parsed JSON block's structured fields; falls back to the full text.
 * @param {string} text
 * @param {object | null} jsonBlock
 */
function extractTextForAnalysis(text, jsonBlock) {
  if (!jsonBlock) return text;
  const parts = [];
  if (jsonBlock.project_summary) parts.push(jsonBlock.project_summary);
  if (Array.isArray(jsonBlock.features))     parts.push(jsonBlock.features.join(" "));
  if (Array.isArray(jsonBlock.cost_drivers)) parts.push(jsonBlock.cost_drivers.join(" "));
  if (Array.isArray(jsonBlock.risk_factors)) parts.push(jsonBlock.risk_factors.join(" "));
  if (Array.isArray(jsonBlock.assumptions))  parts.push(jsonBlock.assumptions.join(" "));
  return parts.length > 0 ? parts.join(" ") : text;
}

/** Extract open questions from the document or from Bob's free-text reply. */
function extractOpenQuestions(text, sections, jsonBlock) {
  if (jsonBlock?.open_questions && Array.isArray(jsonBlock.open_questions)) {
    return jsonBlock.open_questions;
  }

  const oqContent = findSection(sections, ["open question"]);
  if (oqContent) {
    const trimmed = oqContent.trim();
    if (/^none/i.test(trimmed)) return [];
    const bullets = extractBullets(oqContent);
    if (bullets.length > 0) return bullets;
  }

  return text
    .split("\n")
    .filter((l) => /\?\s*$/.test(l.trim()) || /clarif|unclear|assumption/i.test(l))
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
}

// ─── Analysis Functions ───────────────────────────────────────────────────────

function findKeywords(text) {
  const n = normalize(text);
  if (!n) return [];
  const found = new Set();
  if (/\badmin\b/.test(n))                                                                 found.add("admin");
  if (/\bapproval(s)?\b/.test(n))                                                          found.add("approval");
  if (/\blogin\b|\bsign[\s-]?in\b|\bauth(entication)?\b|\buser account/.test(n))          found.add("login");
  if (/\bcalendar\b|\bschedul(e|ing)\b/.test(n))                                           found.add("calendar");
  if (/\bemail\b|\be-?mail\b/.test(n))                                                     found.add("email");
  if (/\bsms\b|\btext message\b/.test(n))                                                  found.add("sms");
  if (/\bkiosk\b/.test(n))                                                                 found.add("kiosk");
  if (/real[\s-]?time\b|\bwebsocket(s)?\b|\blive updates?\b/.test(n))                     found.add("real-time");
  if (/\bdashboard\b/.test(n))                                                             found.add("dashboard");
  if (/\banalytics\b|\breport(s|ing)?\b/.test(n))                                         found.add("analytics");
  if (/\bpayment(s)?\b|\bcheckout\b|\bbilling\b|\bstripe\b/.test(n))                      found.add("payment");
  if (/multi[\s-]?location\b|\bmulti[\s-]?site\b/.test(n))                                found.add("multi-location");
  if (/\bmobile\b|\breact[\s-]?native\b|\bflutter\b|\bios\b.*\bandroid\b|\bandroid\b.*\bios\b/.test(n))
    found.add("mobile");
  if (/\bnotification(s)?\b|\bpush notification|\blocal notification|\bfcm\b|\bapns\b/.test(n))
    found.add("notification");
  if (/\boffline\b|\boffline[\s-]first\b|\basync[\s-]?storage\b|\blocal[\s-]?storage\b|\blocal persistence/.test(n))
    found.add("offline");
  if (/\bsearch\b|\bfull[\s-]?text search\b|\bfilter(ing)?\b/.test(n))
    found.add("search");
  if (/\bbackground task\b|\bbackground job\b|\bworkmanager\b|\bcron\b|\bscheduled task\b/.test(n))
    found.add("background");
  if (/\brest api\b|\bthird[\s-]?party\b|\bwebhook(s)?\b|\bapi key\b/.test(n))
    found.add("api");
  return [...found];
}

const FEATURE_LABELS = {
  login:            "User Authentication",
  admin:            "Admin Panel",
  approval:         "Approval Workflow",
  calendar:         "Calendar & Scheduling",
  email:            "Email Notifications",
  sms:              "SMS Notifications",
  kiosk:            "Kiosk Interface",
  "real-time":      "Real-time Features",
  dashboard:        "Dashboard",
  analytics:        "Analytics & Reporting",
  payment:          "Payment Processing",
  "multi-location": "Multi-location Support",
  mobile:           "Mobile App",
  notification:     "Push Notifications",
  offline:          "Offline Support",
  search:           "Search & Filters",
  background:       "Background Jobs",
  api:              "Third-party API Integration",
};

function runCostEstimate(text) {
  const keywords = findKeywords(text);
  const totals   = { ...BASE_HOURS };
  for (const k of keywords) {
    const row = KEYWORD_HOURS[k];
    if (row) {
      totals.optimistic  += row.optimistic;
      totals.likely      += row.likely;
      totals.pessimistic += row.pessimistic;
    }
  }
  const expected    = threePointExpected(totals);
  const confidence  = keywords.length >= 5 ? "high" : keywords.length >= 2 ? "medium" : "low";

  // Build per-feature line items
  const lineItems = [
    {
      key:              "base",
      label:            "Base setup & scaffolding",
      optimisticHours:  BASE_HOURS.optimistic,
      expectedHours:    threePointExpected(BASE_HOURS),
      pessimisticHours: BASE_HOURS.pessimistic,
      expectedCost:     Math.round(threePointExpected(BASE_HOURS) * HOURLY_RATE),
    },
  ];

  for (const k of keywords) {
    const row = KEYWORD_HOURS[k];
    if (!row) continue;
    const expectedH = threePointExpected(row);
    lineItems.push({
      key:              k,
      label:            FEATURE_LABELS[k] ?? k,
      optimisticHours:  row.optimistic,
      expectedHours:    expectedH,
      pessimisticHours: row.pessimistic,
      expectedCost:     Math.round(expectedH * HOURLY_RATE),
    });
  }

  const subtotalExpected = lineItems.reduce((s, i) => s + i.expectedCost, 0);
  lineItems.push({
    key:              "risk_buffer",
    label:            `Risk buffer (${RISK_BUFFER_PCT}%)`,
    optimisticHours:  null,
    expectedHours:    null,
    pessimisticHours: null,
    expectedCost:     Math.round(subtotalExpected * (RISK_BUFFER - 1)),
  });

  return {
    keywordsFound: keywords,
    confidence,
    hours: { optimistic: totals.optimistic, expected, pessimistic: totals.pessimistic },
    cost: {
      low:      Math.round(totals.optimistic  * HOURLY_RATE * RISK_BUFFER),
      expected: Math.round(expected           * HOURLY_RATE * RISK_BUFFER),
      high:     Math.round(totals.pessimistic * HOURLY_RATE * RISK_BUFFER),
    },
    hourlyRate: HOURLY_RATE,
    riskBufferPercent: RISK_BUFFER_PCT,
    lineItems,
  };
}

function runScopeAnalysis(text, sections) {
  const keywords      = findKeywords(text);
  const ordered       = BUILD_ORDER_PRIORITY.filter((k) => keywords.includes(k));
  const taskCount     = countTasks(text);

  const mvpFeatures   = ["Core application setup and database schema"];
  const fullFeatures  = ["Performance optimization and caching layer", "Automated test suite and CI/CD pipeline"];
  const expensive     = [];
  const riskWarnings  = [];
  const costSavingTips = [];

  for (const key of ordered) {
    const entry = FEATURE_MAP[key];
    if (!entry) continue;
    mvpFeatures.push(entry.mvp);
    fullFeatures.push(entry.full);
    if (entry.risk) riskWarnings.push(entry.risk);
    if (entry.tip)  costSavingTips.push(entry.tip);
    if (EXPENSIVE.has(key)) expensive.push(entry.mvp);
  }

  let parsedFromDocument = false;

  // Override full-version list with Bob's "Future Enhancements" section
  const futureBullets = extractBullets(findSection(sections, ["future enhancement", "future feature", "out of scope"]));
  if (futureBullets.length > 0) {
    parsedFromDocument = true;
    fullFeatures.length = 0;
    fullFeatures.push(...futureBullets);
  }

  // Add constraint-based risk warnings
  const constraintBullets = extractBullets(findSection(sections, ["assumption", "constraint"]));
  if (constraintBullets.length > 0) {
    parsedFromDocument = true;
    for (const c of constraintBullets) {
      if (/no\s|without\s|limited\s|single\s|must\s|cannot\s/i.test(c)) {
        riskWarnings.push({ level: "LOW", message: `Documented constraint: ${c}` });
      }
    }
  }

  // Build order from document phases, then keyword order, then generic fallback
  let suggestedBuildOrder;
  const phases = extractPhases(findSection(sections, ["development phase", "implementation phase", "phase"]));
  if (phases.length > 0) {
    parsedFromDocument = true;
    suggestedBuildOrder = phases.map(
      (p, i) => `Phase ${i + 1} — ${p.name}: ${p.items.slice(0, 3).join(", ")}${p.items.length > 3 ? "…" : ""}`
    );
  } else if (ordered.length > 0) {
    suggestedBuildOrder = ordered.map((k, i) => `${i + 1}. ${FEATURE_MAP[k]?.mvp ?? k}`);
  } else {
    suggestedBuildOrder = [
      "1. Define core data model and database schema",
      "2. Build basic UI and navigation",
      "3. Implement core business logic",
    ];
  }

  riskWarnings.sort((a, b) => RISK_SORT[a.level] - RISK_SORT[b.level]);

  return {
    mvpFeatures,
    fullVersionFeatures: fullFeatures,
    expensiveFeatures: expensive,
    riskWarnings,
    suggestedBuildOrder,
    costSavingTips,
    taskCount,
    parsedFromDocument,
  };
}

// ─── Report Builder ───────────────────────────────────────────────────────────

function buildReport(displayText, analysisText, cost, scope, openQuestions) {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const confidenceNote =
    cost.confidence === "high"   ? "The estimate is based on strong project signals and carries high confidence." :
    cost.confidence === "medium" ? "The estimate is moderately confident — further scoping may refine these numbers." :
                                   "The idea is broadly described. We recommend a discovery session before committing to a budget.";

  const taskNote   = scope.taskCount > 0 ? ` The Bob AI implementation plan identified ${scope.taskCount} development tasks.` : "";
  const sourceNote = scope.parsedFromDocument ? " Scope data was extracted directly from the Bob AI design document." : "";

  const L = [];
  const add = (...items) => L.push(...items);

  add(
    `# BobOps Project Analysis Report`,
    `*Generated: ${date} | Methodology: PMI Three-Point Estimation | Rate: BLS National Median*`,
    ``,
    `---`,
    ``,
    `## Executive Summary`,
    ``,
    `This project has an estimated development investment of ` +
    `${currency(cost.cost.low)}–${currency(cost.cost.high)} ` +
    `(${cost.hours.optimistic}–${cost.hours.pessimistic} hours at ${currency(cost.hourlyRate)}/hr, ` +
    `including a ${cost.riskBufferPercent}% risk buffer). ` +
    `${confidenceNote}${taskNote}${sourceNote} ` +
    `Build in phases — deliver the MVP first to validate the concept before committing to the full version.`,
    ``,
    `---`,
    ``,
    `## Project Idea`,
    ``,
    `> ${displayText.trim().slice(0, 600).replace(/\n/g, "\n> ")}${displayText.length > 600 ? "\n>\n> *(full document provided to analysis engine)*" : ""}`,
    ``,
    `---`,
    ``,
    `## Budget Estimate`,
    ``,
    `| | Value |`,
    `|---|---|`,
    `| Confidence Level  | **${cost.confidence.toUpperCase()}** (${cost.keywordsFound.length} scope signal(s) detected) |`,
    `| Optimistic Hours  | ${cost.hours.optimistic} hrs |`,
    `| Expected Hours    | ${cost.hours.expected} hrs |`,
    `| Pessimistic Hours | ${cost.hours.pessimistic} hrs |`,
    `| Low Estimate      | **${currency(cost.cost.low)}** |`,
    `| Expected Cost     | **${currency(cost.cost.expected)}** |`,
    `| High Estimate     | **${currency(cost.cost.high)}** |`,
    `| Hourly Rate       | ${currency(cost.hourlyRate)}/hr *(BLS national median for software developers)* |`,
    `| Risk Buffer       | +${cost.riskBufferPercent}% *(PMI PMBOK standard contingency)* |`,
    ``,
    `**Timeframe:** ${hoursToTimeframe(cost.hours.expected)}.`,
    ``,
    `**Scope signals detected:** ${cost.keywordsFound.length > 0 ? cost.keywordsFound.join(", ") : "none (base estimate only)"}`,
    ``,
    `---`,
    ``,
    `## Phase 1 — MVP (Build First)`,
    ``,
    `These are the minimum features needed to launch and validate the concept.`,
    ``,
    ...scope.mvpFeatures.map((f) => `- ${f}`),
    ``,
    `---`,
    ``,
    `## Phase 2 — Full Version (Add Later)`,
    ``,
    scope.parsedFromDocument
      ? `The following enhancements are listed as out-of-scope for V1 in the Bob AI design document.`
      : `Enhancements to build once the MVP is live and validated with real users.`,
    ``,
    ...scope.fullVersionFeatures.map((f) => `- ${f}`),
    ``
  );

  if (scope.expensiveFeatures.length > 0) {
    add(
      `---`, ``,
      `## High-Cost Features`, ``,
      `The following features drive the majority of the budget and should be scoped carefully.`, ``,
      ...scope.expensiveFeatures.map((f) => `- ${f}`), ``
    );
  }

  if (scope.riskWarnings.length > 0) {
    add(`---`, ``, `## Risk Warnings`, ``);
    for (const w of scope.riskWarnings) add(`**[${w.level} RISK]** ${w.message}`, ``);
  }

  if (scope.costSavingTips.length > 0) {
    add(`---`, ``, `## Cost-Saving Recommendations`, ``);
    scope.costSavingTips.forEach((tip, i) => add(`${i + 1}. ${tip}`));
    add(``);
  }

  add(
    `---`, ``,
    `## Suggested Build Order`, ``,
    scope.parsedFromDocument
      ? `Build order derived from the development phases in the Bob AI design document.`
      : `Build in this sequence to reduce risk and deliver value incrementally.`,
    ``,
    ...scope.suggestedBuildOrder,
    ``
  );

  if (openQuestions.length > 0) {
    add(
      `---`, ``,
      `## Open Questions`, ``,
      `The following items were flagged as requiring clarification before or during development.`, ``,
      ...openQuestions.map((q) => `- ${q}`),
      ``
    );
  }

  add(
    `---`, ``,
    `## Bob-Assisted Development Workflow`, ``,
    `This report was produced using the BobOps analysis pipeline, powered by IBM Watsonx.ai (Bob AI).`, ``,
    `| Stage | Tool | Output |`,
    `|---|---|---|`,
    `| Planning | IBM Bob AI (Watsonx.ai) | Design specification and implementation plan |`,
    `| Cost Analysis | BobOps estimateCost | Hour and budget estimates (PMI three-point methodology) |`,
    `| Scope Analysis | BobOps analyzeScope | MVP scope, risks, and build order |`,
    `| Report | BobOps generateReport | This document |`,
    ``,
    `---`, ``,
    `## Bob Session Evidence`, ``,
    `Detailed session logs documenting Bob AI's role in this project:`, ``,
    `- [Planning Session](../bob_sessions/planning-session.md)`,
    `- [Code Generation Session](../bob_sessions/code-generation-session.md)`,
    `- [Testing Session](../bob_sessions/testing-session.md)`,
    `- [Documentation Session](../bob_sessions/documentation-session.md)`,
    `- [Final Review Session](../bob_sessions/final-review-session.md)`,
    ``,
    `---`, ``,
    `*Analysis methodology: PMI three-point estimation. Rate basis: U.S. Bureau of Labor Statistics. Risk buffer: PMI PMBOK standard contingency (${cost.riskBufferPercent}%).*`
  );

  return L.join("\n");
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract the final Bob message from a transcript.
 * @param {Array<{ role: string, content: string }>} transcript
 * @returns {string}
 */
export function extractFinalPlan(transcript) {
  const bobMessages = (transcript ?? []).filter((m) => m.role === "bob");
  return bobMessages.at(-1)?.content ?? "";
}

/**
 * Analyze a BobPlannerPayload and return a full analysis result.
 *
 * The function uses a two-layer approach:
 *  1. Tries to extract a machine-readable JSON block from Bob's output.
 *  2. Falls back to parsing the structured markdown document sections.
 *  3. Runs keyword detection on the best available text.
 *
 * @param {{
 *   source: string,
 *   transcript: Array<{ role: string, content: string, created_at: string, initial?: boolean }>
 * }} payload
 *
 * @returns {{
 *   finalPlan: string,
 *   parsedFromJson: boolean,
 *   parsedFromDocument: boolean,
 *   jsonBlock: object | null,
 *   keywords: string[],
 *   costEstimate: object,
 *   scope: object,
 *   openQuestions: string[],
 *   taskCount: number,
 *   report: string,
 * }}
 */
export function analyzePlan(payload) {
  const finalPlan    = extractFinalPlan(payload?.transcript ?? []);
  const jsonBlock    = tryParseJsonBlock(finalPlan);
  const analysisText = extractTextForAnalysis(finalPlan, jsonBlock);
  const sections     = parseSections(finalPlan);

  const costEstimate    = runCostEstimate(analysisText);
  const scope           = runScopeAnalysis(analysisText, sections);
  const openQuestions   = extractOpenQuestions(finalPlan, sections, jsonBlock);
  const report          = buildReport(finalPlan || analysisText, analysisText, costEstimate, scope, openQuestions);

  return {
    finalPlan,
    parsedFromJson:     jsonBlock !== null,
    parsedFromDocument: scope.parsedFromDocument,
    jsonBlock,
    keywords:           costEstimate.keywordsFound,
    costEstimate,
    scope,
    openQuestions,
    taskCount:          scope.taskCount,
    report,
  };
}
