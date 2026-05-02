import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  doublePrecision,
  pgEnum,
} from "drizzle-orm/pg-core";

export const farmStatusEnum = pgEnum("farm_status", [
  "pending",
  "live",
  "rejected",
]);

export const farmers = pgTable("farmers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailOtps = pgTable("email_otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
});

export const coordinators = pgTable("coordinators", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: uuid("farmer_id").references(() => farmers.id),
  coordinatorId: uuid("coordinator_id").references(() => coordinators.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const farms = pgTable("farms", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: uuid("farmer_id")
    .notNull()
    .references(() => farmers.id),
  status: farmStatusEnum("status").notNull().default("pending"),
  rejectReason: text("reject_reason"),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  story: text("story").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  dairy: boolean("dairy").notNull().default(false),
  crops: boolean("crops").notNull().default(false),
  poultry: boolean("poultry").notNull().default(false),
  organic: boolean("organic").notNull().default(false),
  schoolFriendly: boolean("school_friendly").notNull().default(false),
  primaryImageUrl: text("primary_image_url"),
  visitorNotes: text("visitor_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id),
  visitorName: text("visitor_name").notNull(),
  visitorEmail: text("visitor_email").notNull(),
  visitorPhone: text("visitor_phone"),
  visitorMessage: text("visitor_message").notNull(),
  isSchool: boolean("is_school").notNull().default(false),
  institutionName: text("institution_name"),
  studentCount: integer("student_count"),
  ageRange: text("age_range"),
  adultCount: integer("adult_count"),
  learningThemes: text("learning_themes"),
  preferredDates: text("preferred_dates"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
