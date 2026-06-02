import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  primaryKey,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const medications = pgTable("medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  scheduleTimes: jsonb("schedule_times").$type<string[]>().notNull().default([]),
  foodTiming: text("food_timing")
    .$type<"before_meal" | "after_meal" | "empty_stomach" | "any">()
    .notNull()
    .default("any"),
  contraindications: text("contraindications"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const medLogs = pgTable("med_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  medicationId: uuid("medication_id")
    .notNull()
    .references(() => medications.id, { onDelete: "cascade" }),
  takenAt: timestamp("taken_at", { mode: "date" }).notNull(),
});

export const hydrationSettings = pgTable(
  "hydration_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dailyGoalMl: integer("daily_goal_ml").notNull().default(2000),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("hydration_settings_user_idx").on(t.userId)]
);

export const hydrationLogs = pgTable("hydration_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amountMl: integer("amount_ml").notNull(),
  loggedAt: timestamp("logged_at", { mode: "date" }).notNull(),
});

export const foodPresets = pgTable("food_presets", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameJa: text("name_ja").notNull(),
  calories: integer("calories").notNull(),
  category: text("category"),
});

export const userFoodItems = pgTable("user_food_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nameJa: text("name_ja").notNull(),
  calories: integer("calories").notNull(),
  kind: text("kind").$type<"food" | "drink">().notNull().default("food"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const mealLogs = pgTable("meal_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  presetId: uuid("preset_id").references(() => foodPresets.id, {
    onDelete: "set null",
  }),
  userFoodItemId: uuid("user_food_item_id").references(() => userFoodItems.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  loggedAt: timestamp("logged_at", { mode: "date" }).notNull(),
});

export const aiReports = pgTable(
  "ai_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportDate: date("report_date", { mode: "string" }).notNull(),
    result: jsonb("result").$type<AiReportResult>().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("ai_reports_user_date_idx").on(t.userId, t.reportDate)]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("password_reset_tokens_hash_idx").on(t.tokenHash)]
);

export const aiPeriodReports = pgTable(
  "ai_period_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodType: text("period_type").$type<"week" | "month">().notNull(),
    periodEndDate: date("period_end_date", { mode: "string" }).notNull(),
    result: jsonb("result").$type<AiPeriodReportResult>().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("ai_period_reports_user_period_idx").on(
      t.userId,
      t.periodType,
      t.periodEndDate
    ),
  ]
);

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export type AiReportResult = {
  supplements: { title: string; detail: string }[];
  limits: { title: string; detail: string }[];
  medicationSafety: { title: string; detail: string }[];
};

export type AiPeriodReportResult = AiReportResult & {
  hydrationInsights?: { title: string; detail: string }[];
  dietInsights?: { title: string; detail: string }[];
};

export type FoodItemKind = "food" | "drink";

export type FoodTiming = "before_meal" | "after_meal" | "empty_stomach" | "any";
