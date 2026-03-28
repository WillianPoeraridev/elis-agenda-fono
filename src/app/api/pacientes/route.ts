import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface PatientStats {
  name: string;
  totalConsultas: number;
  presencas: number;
  faltas: number;
  pendentes: number;
  taxaPresenca: number;
  ultimaConsulta: string;
  clinicas: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const search = searchParams.get("search");

    // Build date filter
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
        ...(month ? { agenda: { date: dateFilter } } : {}),
        ...(search
          ? { patientName: { contains: search, mode: "insensitive" as const } }
          : {}),
      },
      include: {
        agenda: { select: { date: true, clinic: true } },
      },
    });

    // Group by normalized name
    const grouped = new Map<string, {
      originalName: string;
      presencas: number;
      faltas: number;
      pendentes: number;
      dates: string[];
      clinicas: Set<string>;
    }>();

    for (const apt of appointments) {
      const key = apt.patientName.trim().toLowerCase();
      let entry = grouped.get(key);
      if (!entry) {
        entry = {
          originalName: apt.patientName.trim(),
          presencas: 0,
          faltas: 0,
          pendentes: 0,
          dates: [],
          clinicas: new Set(),
        };
        grouped.set(key, entry);
      }

      if (apt.attended === true) entry.presencas++;
      else if (apt.attended === false) entry.faltas++;
      else entry.pendentes++;

      entry.dates.push(apt.agenda.date.toISOString());
      entry.clinicas.add(apt.agenda.clinic);
    }

    const pacientes: PatientStats[] = Array.from(grouped.values()).map((entry) => {
      const totalConsultas = entry.presencas + entry.faltas + entry.pendentes;
      const denominador = entry.presencas + entry.faltas;
      const taxaPresenca = denominador > 0 ? Math.round((entry.presencas / denominador) * 100) : 0;
      const ultimaConsulta = entry.dates.sort().reverse()[0] || "";

      return {
        name: entry.originalName,
        totalConsultas,
        presencas: entry.presencas,
        faltas: entry.faltas,
        pendentes: entry.pendentes,
        taxaPresenca,
        ultimaConsulta,
        clinicas: Array.from(entry.clinicas),
      };
    });

    pacientes.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return NextResponse.json({ pacientes, total: pacientes.length });
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
