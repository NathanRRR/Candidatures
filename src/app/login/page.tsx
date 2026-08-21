"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setErreur("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/");
  }

  return (
    <main className="login-card">
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {erreur && <p className="alert" role="alert">{erreur}</p>}
        <button className="btn" type="submit">Se connecter</button>
      </form>
    </main>
  );
}
