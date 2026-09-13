import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
export const accounts = pgTable("loupe_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();
export const sessions = pgTable("loupe_sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}).enableRLS();
export type Finding = {
  file: string;
  line: number;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  source: "static" | "ai";
};
export type ScanResult = {
  description: string;
  branch: string;
  sha: string;
  language: string;
  stars: number;
  filesTotal: number;
  filesScanned: number;
  findings: Finding[];
  warnings: string[];
  ai: boolean;
  duration: number;
  pullNumber?: number;
};
export const scans = pgTable(
  "loupe_scans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id").notNull(),
    repository: text("repository").notNull(),
    status: text("status").notNull().default("running"),
    result: jsonb("result").$type<ScanResult>(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("scans_owner_idx").on(t.ownerId)],
).enableRLS();
export const rateLimits = pgTable("loupe_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
}).enableRLS();
