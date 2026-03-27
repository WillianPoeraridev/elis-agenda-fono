import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM

    if (!month) {
      return NextResponse.json({ error: "Mês obrigatório (YYYY-MM)" }, { status: 400 });
    }

    const [year, m] = month.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, m - 1, 1));
    const endDate = new Date(Date.UTC(year, m, 0)); // Last day of month

    const agendas = await prisma.agenda.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: {
        appointments: { orderBy: { time: "asc" } },
      },
      orderBy: { date: "asc" },
    });

    // Compute stats per agenda
    const stats = agendas.map((agenda) => {
      const total = agenda.appointments.length;
      const presentes = agenda.appointments.filter((a) => a.attended === true).length;
      const faltas = agenda.appointments.filter((a) => a.attended === false).length;
      const pendentes = agenda.appointments.filter((a) => a.attended === null).length;

      return {
        ...agenda,
        stats: { total, presentes, faltas, pendentes },
      };
    });

    return NextResponse.json({ agendas: stats });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
