
import { hashPassword } from "./auth";
import { storage } from "./storage";

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByLogin("admin");
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword("admin");
    const adminUser = await storage.createUser({
      name: "Administrador",
      login: "admin",
      password: hashedPassword,
      empresa: "insider"
    });

    console.log("Admin user created successfully:", {
      id: adminUser.id,
      name: adminUser.name,
      login: adminUser.login,
      empresa: adminUser.empresa
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

createAdminUser();
