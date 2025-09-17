import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      login: string;
      password: string;
      empresa: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes(".")) {
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  // Verificar se a SESSION_SECRET está definida em produção
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET é obrigatória em produção');
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "development-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: "user_sessions"
    }),
    cookie: {
      secure: isProduction, // true em produção para HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'strict' : 'lax', // Proteção CSRF em produção
    },
    name: 'trackingSession', // Nome customizado da sessão
  };

  // Trust proxy em produção (para load balancers/nginx)
  if (isProduction) {
    app.set("trust proxy", 1);
  }
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "login",
        passwordField: "senha"
      },
      async (login, password, done) => {
        try {
          const user = await storage.getUserByLogin(login);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}