import { vi } from "vitest";

// Server actions now call requireSession() (see src/lib/auth.ts), which uses
// next-auth's getServerSession(authOptions). That function relies on
// next/headers' request-scoped AsyncLocalStorage, which only exists inside
// an actual Next.js request — calling it from a bare Vitest test throws
// "`headers` was called outside a request scope." Integration tests invoke
// server actions directly (not through a real HTTP request), so we mock
// next-auth's getServerSession to resolve to a fixed session, letting these
// tests keep exercising real business logic as an authenticated user.
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { email: "test@example.com" } }),
}));

// Same story for revalidatePath (see fix #5): it relies on Next's request-
// scoped static generation store, which doesn't exist when a server action
// is called directly from a Vitest test. Mock it to a no-op.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
