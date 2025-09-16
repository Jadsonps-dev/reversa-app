import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTrackingSchema, updateTrackingSchema, insertUserSchema, loginSchema, adminLoginSchema, insertNameSchema } from "@shared/schema";
import { setupAuth, hashPassword } from "./auth";
import passport from "passport";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all trackings (filtered by company if user is authenticated)
  app.get("/api/trackings", async (req, res) => {
    try {
      let trackings = await storage.getAllTrackings();
      
      // Filter by company if user is authenticated
      if (req.isAuthenticated() && req.user) {
        trackings = trackings.filter(tracking => tracking.empresa === req.user.empresa);
      }
      
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
      
      // Set empresa from authenticated user if available
      if (req.isAuthenticated() && req.user) {
        validatedData.empresa = req.user.empresa;
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
      
      // Check if user login already exists
      const existingUser = await storage.getUserByLogin(validatedData.login);
      if (existingUser) {
        return res.status(400).json({ message: "Login já existe" });
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(validatedData.password);
      const userToCreate = {
        ...validatedData,
        password: hashedPassword
      };

      const user = await storage.createUser(userToCreate);
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get all names
  app.get("/api/names", async (req, res) => {
    try {
      const names = await storage.getAllNames();
      res.json(names);
    } catch (error) {
      console.error("Error fetching names:", error);
      res.status(500).json({ message: "Failed to fetch names" });
    }
  });

  // Create new name
  app.post("/api/names", async (req, res) => {
    try {
      const validatedData = insertNameSchema.parse(req.body);
      const name = await storage.createName(validatedData);
      res.status(201).json(name);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating name:", error);
      res.status(500).json({ message: "Failed to create name" });
    }
  });

  // Delete name
  app.delete("/api/names/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteName(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting name:", error);
      res.status(500).json({ message: "Failed to delete name" });
    }
  });

  // Admin login endpoint
  app.post("/api/admin-login", (req, res, next) => {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: "Login ou senha inválidos" });
        }
        
        // Verificar se é super admin
        if (user.login !== 'admin') {
          return res.status(403).json({ message: "Acesso negado. Apenas administradores podem acessar." });
        }
        
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          // Don't send password in response
          const { password, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error in admin login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: "Login ou senha inválidos" });
        }
        
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          // Don't send password in response
          const { password, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error in login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    // Don't send password in response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  const httpServer = createServer(app);
  return httpServer;
}
