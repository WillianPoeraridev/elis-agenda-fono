import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const clinic = searchParams.get("clinic") || "Amar Saúde Tramandaí";

  if (!date) {
    return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });
  }

  const agendaDate = new Date(date + "T00:00:00.000Z");
  const agenda = await prisma.agenda.findFirst({
    where: { date: agendaDate, clinic },
    include: { appointments: true },
  });

  return NextResponse.json({
    exists: !!agenda,
    appointmentCount: agenda?.appointments.length || 0,
  });
}
