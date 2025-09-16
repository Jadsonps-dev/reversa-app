import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  login: text("login").notNull().unique(),
  password: text("password").notNull(),
  empresa: text("empresa", { enum: ["insider", "alcance_jeans", "modab"] }).notNull(),
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

export const name = pgTable("name", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  users: text("users").notNull(),
});


export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  login: true,
  password: true,
  empresa: true,
});

export const loginSchema = z.object({
  empresa: z.enum(["insider", "alcance_jeans", "modab"]),
  login: z.string().min(1, "Login é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export const insertTrackingSchema = createInsertSchema(trackings).pick({
  trackingCode: true,
  user: true,
  statusRastreio: true,
  empresa: true,
});

export const updateTrackingSchema = createInsertSchema(trackings).pick({
  status: true,
  quantity: true,
  user: true,
  statusRastreio: true,
}).partial();

export const insertNameSchema = createInsertSchema(name).pick({
  users: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTracking = z.infer<typeof insertTrackingSchema>;
export type UpdateTracking = z.infer<typeof updateTrackingSchema>;
export type Tracking = typeof trackings.$inferSelect;
export type InsertName = z.infer<typeof insertNameSchema>;
export type Name = typeof name.$inferSelect;
