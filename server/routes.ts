import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTrackingSchema, updateTrackingSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all trackings
  app.get("/api/trackings", async (req, res) => {
    try {
      const trackings = await storage.getAllTrackings();
      res.json(trackings);
    } catch (error) {
      console.error("Error fetching trackings:", error);
      res.status(500).json({ message: "Failed to fetch trackings" });
    }
  });

  // Create new tracking
  app.post("/api/trackings", async (req, res) => {
    try {
      const validatedData = insertTrackingSchema.parse(req.body);
      
      // Permitir códigos duplicados - removida validação de unicidade

      const tracking = await storage.createTracking(validatedData);
      res.status(201).json(tracking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating tracking:", error);
      res.status(500).json({ message: "Failed to create tracking" });
    }
  });

  // Update tracking
  app.patch("/api/trackings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateTrackingSchema.parse(req.body);
      
      const tracking = await storage.updateTracking(id, validatedData);
      res.json(tracking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error updating tracking:", error);
      res.status(500).json({ message: "Failed to update tracking" });
    }
  });

  // Delete tracking
  app.delete("/api/trackings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTracking(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tracking:", error);
      res.status(500).json({ message: "Failed to delete tracking" });
    }
  });

  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user
  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user name already exists
      const existingUser = await storage.getUserByName(validatedData.name);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
