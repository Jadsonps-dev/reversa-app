import { type User, type InsertUser, type Tracking, type InsertTracking, type UpdateTracking, type Name, type InsertName, trackings, users, name } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  getUserByLogin(login: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Tracking methods
  getAllTrackings(): Promise<Tracking[]>;
  getTrackingByCode(trackingCode: string): Promise<Tracking | undefined>;
  createTracking(tracking: InsertTracking): Promise<Tracking>;
  updateTracking(id: string, tracking: UpdateTracking): Promise<Tracking>;
  deleteTracking(id: string): Promise<void>;

  // Name methods
  getAllNames(): Promise<Name[]>;
  createName(nameData: InsertName): Promise<Name>;
  deleteName(id: string): Promise<void>;
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

  async getUserByLogin(login: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.login, login));
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
    const trackingData = {
      ...insertTracking,
      empresa: insertTracking.empresa || "DEFAULT",
      statusRastreio: insertTracking.statusRastreio || "normal"
    };
    
    const [tracking] = await db
      .insert(trackings)
      .values(trackingData)
      .returning();

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

    // Note: status_rastreio entries are created when trackings are created with statusTipo
    // Status changes here are for workflow status (PENDENTE, TC_FINALIZADO, etc.), 
    // not for reversa/insucesso tracking

    return tracking;
  }

  async deleteTracking(id: string): Promise<void> {
    await db.delete(trackings).where(eq(trackings.id, id));
  }

  async getAllNames(): Promise<Name[]> {
    return await db.select().from(name).orderBy(name.users);
  }

  async createName(insertName: InsertName): Promise<Name> {
    const [nameRecord] = await db
      .insert(name)
      .values(insertName)
      .returning();
    return nameRecord;
  }

  async deleteName(id: string): Promise<void> {
    await db.delete(name).where(eq(name.id, id));
  }
}

export const storage = new DatabaseStorage();