import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { attended } = await request.json();

    // attended can be true, false, or null (reset to pending)
    if (attended !== true && attended !== false && attended !== null) {
      return NextResponse.json(
        { error: "attended deve ser true, false ou null" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { attended },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Erro ao atualizar presença:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
