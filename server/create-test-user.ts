
import { hashPassword } from "./auth";
import { storage } from "./storage";

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await storage.getUserByLogin("teste");
    if (existingUser) {
      console.log("Test user already exists");
      console.log("Login credentials:");
      console.log("Empresa: insider");
      console.log("Login: teste");
      console.log("Senha: 123");
      return;
    }

    // Create test user
    const hashedPassword = await hashPassword("123");
    const testUser = await storage.createUser({
      name: "Usuário Teste",
      login: "teste",
      password: hashedPassword,
      empresa: "insider"
    });

    console.log("Test user created successfully!");
    console.log("Login credentials:");
    console.log("Empresa: insider");
    console.log("Login: teste");
    console.log("Senha: 123");
    
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

createTestUser();
