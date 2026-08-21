import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Suivi candidatures",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="app-header">
          <Link href="/" className="brand">
            Suivi candidatures
          </Link>
          <nav>
            <Link href="/">Candidatures</Link>
            <Link href="/dashboard">Tableau de bord</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
