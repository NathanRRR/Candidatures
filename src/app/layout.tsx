import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Suivi candidatures",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header style={{ padding: 12, background: "#1a1a2e", color: "white" }}>
          <Link href="/" style={{ color: "white", marginRight: 16 }}>
            Candidatures
          </Link>
          <Link href="/dashboard" style={{ color: "white" }}>
            Tableau de bord
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
