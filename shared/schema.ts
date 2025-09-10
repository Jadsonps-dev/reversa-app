import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const trackings = pgTable("trackings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingCode: text("tracking_code").notNull().unique(),
  receivedAt: timestamp("received_at").notNull().default(sql`now()`),
  status: text("status", { enum: ["PENDENTE", "TC_FINALIZADO", "CANCELADO", "DIVERGENCIA"] }).default("PENDENTE"),
  completedAt: timestamp("completed_at"),
  quantity: integer("quantity").default(0),
  user: text("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTrackingSchema = createInsertSchema(trackings).pick({
  trackingCode: true,
});

export const updateTrackingSchema = createInsertSchema(trackings).pick({
  status: true,
  quantity: true,
  user: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTracking = z.infer<typeof insertTrackingSchema>;
export type UpdateTracking = z.infer<typeof updateTrackingSchema>;
export type Tracking = typeof trackings.$inferSelect;
