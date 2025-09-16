
import { hashPassword } from "./auth";
import { storage } from "./storage";

async function createSuperAdmin() {
  try {
    // Check if super admin user already exists
    const existingSuperAdmin = await storage.getUserByLogin("admin");
    if (existingSuperAdmin) {
      console.log("Super admin user already exists");
      return;
    }

    // Create super admin user
    const hashedPassword = await hashPassword("superadmin123");
    const superAdminUser = await storage.createUser({
      name: "Super Administrador",
      login: "admin",
      password: hashedPassword,
      empresa: "luft_logistics"
    });

    console.log("Super admin user created successfully:");
    console.log("Login: admin");
    console.log("Password: superadmin123");
    console.log("User details:", {
      id: superAdminUser.id,
      name: superAdminUser.name,
      login: superAdminUser.login,
      empresa: superAdminUser.empresa
    });
  } catch (error) {
    console.error("Error creating super admin user:", error);
  }
}

createSuperAdmin();
