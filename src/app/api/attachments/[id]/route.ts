import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const piece = await prisma.pieceJointe.findUnique({ where: { id: params.id } });
  if (!piece) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const uploadRoot = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
  const buffer = await readFile(path.join(uploadRoot, piece.cheminFichier));

  return new NextResponse(buffer, {
    headers: { "Content-Disposition": `attachment; filename="${piece.nomFichier}"` },
  });
}
