// Mock data based on the BobOps analysis structure
export const mockAnalysisResult = {
  report: `# QuoteKeeper App Analysis Report

## Executive Summary
This mobile application for saving and organizing quotes presents a moderate complexity build with cross-platform requirements.

## Technical Assessment
The application requires offline-first architecture with sync capabilities, push notifications, and social sharing features.`,

  costEstimate: {
    cost: {
      low: 13440,
      expected: 28476,
      high: 51072,
    },
    hours: {
      optimistic: 160,
      expected: 339,
      pessimistic: 608,
    },
    confidence: "medium" as const,
    keywordsFound: [
      "mobile",
      "notification",
      "offline",
      "sync",
      "authentication",
      "database",
      "social-sharing",
    ],
    hourlyRate: 70,
    riskBufferPercent: 20,
  },

  scope: {
    mvpFeatures: [
      "User authentication and profiles",
      "Quote creation and editing",
      "Basic categorization with tags",
      "Local storage with offline access",
      "Simple search functionality",
    ],
    fullVersionFeatures: [
      "Cloud sync across devices",
      "Social sharing to platforms",
      "Push notification reminders",
      "Advanced search with filters",
      "Quote of the day widget",
      "Export to PDF/image",
    ],
    expensiveFeatures: [
      "Cross-platform mobile (iOS + Android)",
      "Real-time cloud synchronization",
      "Push notification infrastructure",
      "Offline-first architecture with conflict resolution",
    ],
    suggestedBuildOrder: [
      "Phase 1: Core authentication and database setup",
      "Phase 2: Quote CRUD operations with local storage",
      "Phase 3: Categorization and search features",
      "Phase 4: Cloud sync implementation",
      "Phase 5: Push notifications and widgets",
      "Phase 6: Social sharing and export features",
    ],
    costSavingTips: [
      "Consider starting with web-only PWA to validate market fit",
      "Use Firebase for auth and sync to reduce backend complexity",
      "Implement offline mode in phase 2 rather than phase 1",
      "Use pre-built UI component library to speed up development",
      "Consider single platform (iOS) for MVP launch",
    ],
    riskWarnings: [
      {
        level: "HIGH" as const,
        message:
          "Cross-platform mobile requires real device testing infrastructure and may double QA effort",
      },
      {
        level: "HIGH" as const,
        message:
          "Offline-first sync with conflict resolution is architecturally complex",
      },
      {
        level: "MEDIUM" as const,
        message:
          "Push notifications require separate iOS/Android configuration and ongoing maintenance",
      },
      {
        level: "MEDIUM" as const,
        message:
          "Social sharing APIs change frequently and may require updates",
      },
      {
        level: "LOW" as const,
        message:
          "Quote of the day widget needs platform-specific implementation",
      },
    ],
  },

  openQuestions: [
    "What is the expected user base size for the first year?",
    "Is there a preference between React Native and Flutter for cross-platform?",
    "Should quotes support rich text formatting or plain text only?",
    "Is monetization planned? If so, what model (ads, subscription, one-time)?",
  ],

  taskCount: 24,
  parsedFromDocument: true,
};

export type AnalysisResult = typeof mockAnalysisResult;
export type RiskWarning = (typeof mockAnalysisResult.scope.riskWarnings)[number];
export type ConfidenceLevel = "high" | "medium" | "low";
