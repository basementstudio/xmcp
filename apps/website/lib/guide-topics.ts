export const GUIDE_TOPIC_LABELS = {
  concepts: "Concepts",
  building: "Building",
  apps: "Apps",
  security: "Auth & security",
  payments: "Payments",
  production: "Deploy & debug",
  comparisons: "Comparisons",
} as const;

export type GuideTopic = keyof typeof GUIDE_TOPIC_LABELS;

export const GUIDE_TOPICS = Object.keys(GUIDE_TOPIC_LABELS) as [
  GuideTopic,
  ...GuideTopic[],
];

export function isGuideTopic(value: unknown): value is GuideTopic {
  return typeof value === "string" && value in GUIDE_TOPIC_LABELS;
}
