import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTrackingSchema, updateTrackingSchema } from "@shared/schema";
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
      
      // Check if tracking code already exists
      const existingTracking = await storage.getTrackingByCode(validatedData.trackingCode);
      if (existingTracking) {
        return res.status(400).json({ message: "Código de rastreio já existe" });
      }

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

  const httpServer = createServer(app);
  return httpServer;
}
