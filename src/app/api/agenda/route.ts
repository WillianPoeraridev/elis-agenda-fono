import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });
    }

    const agendaDate = new Date(date + "T00:00:00.000Z");

    const agendas = await prisma.agenda.findMany({
      where: { date: agendaDate },
      include: {
        appointments: { orderBy: { time: "asc" } },
      },
    });

    return NextResponse.json({ agendas });
  } catch (error) {
    console.error("Erro ao buscar agenda:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });
    }

    const agendaDate = new Date(date + "T00:00:00.000Z");
    const { count } = await prisma.agenda.deleteMany({
      where: { date: agendaDate },
    });

    return NextResponse.json({ deleted: count });
  } catch (error) {
    console.error("Erro ao deletar agenda:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
