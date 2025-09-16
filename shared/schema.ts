import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
});

export const trackings = pgTable("trackings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingCode: text("tracking_code").notNull(),
  receivedAt: timestamp("received_at").notNull().default(sql`now()`),
  status: text("status", { enum: ["PENDENTE", "TC_FINALIZADO", "CANCELADO", "DIVERGENCIA"] }).default("PENDENTE"),
  completedAt: timestamp("completed_at"),
  quantity: integer("quantity").default(0),
  user: text("user"),
  empresa: text("empresa").notNull().default("DEFAULT"),
  statusRastreio: text("status_rastreio", { enum: ["normal", "insucesso"] }).default("normal"),
});

export const statusRastreio = pgTable("status_rastreio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingCode: text("tracking_code").notNull(),
  statusTipo: text("status_tipo", { enum: ["REVERSA", "INSUCESSO"] }).notNull(),
  registradoEm: timestamp("registrado_em").notNull().default(sql`now()`),
  user: text("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
});

export const insertTrackingSchema = createInsertSchema(trackings).pick({
  trackingCode: true,
  user: true,
  statusRastreio: true,
}).extend({
  statusTipo: z.enum(["REVERSA", "INSUCESSO"]).optional(),
  empresa: z.string().default("DEFAULT").optional(),
});

export const insertStatusRastreioSchema = createInsertSchema(statusRastreio).pick({
  trackingCode: true,
  statusTipo: true,
  user: true,
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
export type InsertStatusRastreio = z.infer<typeof insertStatusRastreioSchema>;
export type StatusRastreio = typeof statusRastreio.$inferSelect;
