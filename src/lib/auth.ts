import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { SessionRequiredError } from "./errors";
import { clearFailedLoginAttempts, getClientKey, isLoginBlocked, registerFailedLoginAttempt } from "./loginThrottle";

export async function verifyCredentials(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return { id: user.id, email: user.email };
  } catch (error) {
    console.error("verifyCredentials: erreur lors de la vérification des identifiants", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const clientKey = getClientKey(req?.headers);
        if (isLoginBlocked(clientKey)) return null;

        const user = await verifyCredentials(credentials.email, credentials.password);
        if (!user) {
          registerFailedLoginAttempt(clientKey);
          return null;
        }

        clearFailedLoginAttempts(clientKey);
        return user;
      },
    }),
  ],
};

// Mutating Server Actions are public RPC endpoints: the middleware matcher
// gates page navigation, not action invocation. Call this as the first line
// of every mutating action so authentication doesn't rely solely on that
// chain of invariants.
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new SessionRequiredError("Vous devez être connecté pour effectuer cette action.");
  }
  return session;
}
