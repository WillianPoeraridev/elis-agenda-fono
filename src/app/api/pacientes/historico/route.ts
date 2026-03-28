import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const month = searchParams.get("month");

    if (!name) {
      return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
    }

    const dateFilter: { gte?: Date; lt?: Date } = {};
    if (month) {
      const [year, m] = month.split("-").map(Number);
      dateFilter.gte = new Date(`${year}-${String(m).padStart(2, "0")}-01T00:00:00.000Z`);
      dateFilter.lt = new Date(
        m === 12
          ? `${year + 1}-01-01T00:00:00.000Z`
          : `${year}-${String(m + 1).padStart(2, "0")}-01T00:00:00.000Z`
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientName: { equals: name, mode: "insensitive" as const },
        ...(month ? { agenda: { date: dateFilter } } : {}),
      },
      include: {
        agenda: { select: { date: true, clinic: true } },
      },
      orderBy: [{ agenda: { date: "desc" } }, { time: "asc" }],
    });

    const historico = appointments.map((apt) => ({
      date: apt.agenda.date.toISOString().split("T")[0],
      time: apt.time,
      clinic: apt.agenda.clinic,
      attended: apt.attended,
      notes: apt.notes,
    }));

    return NextResponse.json({ historico, total: historico.length });
  } catch (error) {
    console.error("Erro ao buscar histórico do paciente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
