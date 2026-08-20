import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyCredentials } from "@/lib/auth";

beforeAll(async () => {
  await prisma.user.deleteMany();
  await prisma.user.create({
    data: {
      email: "nathan@example.com",
      passwordHash: await bcrypt.hash("bonMotDePasse", 10),
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany();
});

describe("verifyCredentials", () => {
  it("returns the user when email and password match", async () => {
    const user = await verifyCredentials("nathan@example.com", "bonMotDePasse");
    expect(user).toEqual({ id: expect.any(String), email: "nathan@example.com" });
  });

  it("returns null when the password is wrong", async () => {
    const user = await verifyCredentials("nathan@example.com", "mauvaisMotDePasse");
    expect(user).toBeNull();
  });

  it("returns null when the email is unknown", async () => {
    const user = await verifyCredentials("inconnu@example.com", "peuImporte");
    expect(user).toBeNull();
  });
});
