import { type User, type InsertUser, type Tracking, type InsertTracking, type UpdateTracking, trackings, users, statusRastreio, type InsertStatusRastreio, type StatusRastreio } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Tracking methods
  getAllTrackings(): Promise<Tracking[]>;
  getTrackingByCode(trackingCode: string): Promise<Tracking | undefined>;
  createTracking(tracking: InsertTracking): Promise<Tracking>;
  updateTracking(id: string, tracking: UpdateTracking): Promise<Tracking>;
  deleteTracking(id: string): Promise<void>;

  // StatusRastreio methods
  createStatusRastreio(status: InsertStatusRastreio): Promise<StatusRastreio>;
  getAllStatusRastreio(): Promise<StatusRastreio[]>;
  getStatusRastreioByTrackingCode(trackingCode: string): Promise<StatusRastreio[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.name);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllTrackings(): Promise<Tracking[]> {
    return await db.select().from(trackings).orderBy(desc(trackings.receivedAt));
  }

  async getTrackingByCode(trackingCode: string): Promise<Tracking | undefined> {
    const [tracking] = await db.select().from(trackings).where(eq(trackings.trackingCode, trackingCode));
    return tracking || undefined;
  }

  async createTracking(insertTracking: InsertTracking): Promise<Tracking> {
    const [tracking] = await db
      .insert(trackings)
      .values(insertTracking)
      .returning();

    // Create status_rastreio entry if statusTipo is provided
    if (insertTracking.statusTipo) {
      await this.createStatusRastreio({
        trackingCode: tracking.trackingCode,
        statusTipo: insertTracking.statusTipo,
        user: tracking.user || null,
      });
    }

    return tracking;
  }

  async updateTracking(id: string, updateTracking: UpdateTracking): Promise<Tracking> {
    const updateData: any = { ...updateTracking };

    // Auto-fill completion date when status is changed to something other than PENDENTE
    if (updateTracking.status && updateTracking.status !== "PENDENTE") {
      updateData.completedAt = new Date();
    } else if (updateTracking.status === "PENDENTE") {
      updateData.completedAt = null;
    }

    const [tracking] = await db
      .update(trackings)
      .set(updateData)
      .where(eq(trackings.id, id))
      .returning();

    // Update status_rastreio entry if status is changed
    if (updateTracking.status && tracking.status !== updateTracking.status) {
      await this.createStatusRastreio({
        trackingId: id,
        status: updateTracking.status,
        createdAt: new Date(),
      });
    }

    return tracking;
  }

  async deleteTracking(id: string): Promise<void> {
    await db.delete(trackings).where(eq(trackings.id, id));
  }

  async createStatusRastreio(insertStatusRastreio: InsertStatusRastreio): Promise<StatusRastreio> {
    const [statusRastreioEntry] = await db
      .insert(statusRastreio)
      .values(insertStatusRastreio)
      .returning();
    return statusRastreioEntry;
  }

  async getAllStatusRastreio(): Promise<StatusRastreio[]> {
    return await db.select().from(statusRastreio).orderBy(desc(statusRastreio.registradoEm));
  }

  async getStatusRastreioByTrackingCode(trackingCode: string): Promise<StatusRastreio[]> {
    return await db.select().from(statusRastreio).where(eq(statusRastreio.trackingCode, trackingCode));
  }
}

export const storage = new DatabaseStorage();