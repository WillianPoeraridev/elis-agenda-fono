import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface AppointmentInput {
  time: string;
  patientName: string;
}

export async function POST(request: NextRequest) {
  try {
    const { date, clinic, appointments } = await request.json();

    if (!date || !clinic || !appointments?.length) {
      return NextResponse.json(
        { error: "Data, clínica e pacientes são obrigatórios" },
        { status: 400 }
      );
    }

    const agendaDate = new Date(date + "T00:00:00.000Z");

    // Check for existing agenda
    const existing = await prisma.agenda.findFirst({
      where: { date: agendaDate, clinic },
      include: { appointments: { orderBy: { time: "asc" } } },
    });

    if (!existing) {
      // No existing agenda — create fresh
      const agenda = await prisma.agenda.create({
        data: {
          date: agendaDate,
          clinic,
          appointments: {
            create: (appointments as AppointmentInput[]).map((apt) => ({
              time: apt.time.trim(),
              patientName: apt.patientName.trim(),
            })),
          },
        },
        include: { appointments: { orderBy: { time: "asc" } } },
      });

      return NextResponse.json({
        agenda,
        summary: { mantidos: 0, novos: appointments.length, total: appointments.length },
      });
    }

    // Smart merge with existing agenda
    const newAppts = appointments as AppointmentInput[];
    let mantidos = 0;
    const novosParaCriar: { agendaId: string; time: string; patientName: string }[] = [];

    for (const incoming of newAppts) {
      const timeTrimmed = incoming.time.trim();
      const nameTrimmed = incoming.patientName.trim().toLowerCase();

      const match = existing.appointments.find(
        (ex) =>
          ex.time.trim() === timeTrimmed &&
          ex.patientName.trim().toLowerCase() === nameTrimmed
      );

      if (match) {
        mantidos++;
      } else {
        novosParaCriar.push({
          agendaId: existing.id,
          time: timeTrimmed,
          patientName: incoming.patientName.trim(),
        });
      }
    }

    if (novosParaCriar.length > 0) {
      await prisma.appointment.createMany({ data: novosParaCriar });
    }

    const agenda = await prisma.agenda.findUnique({
      where: { id: existing.id },
      include: { appointments: { orderBy: { time: "asc" } } },
    });

    const novos = novosParaCriar.length;

    return NextResponse.json({
      agenda,
      summary: { mantidos, novos, total: agenda?.appointments.length || 0 },
    });
  } catch (error) {
    console.error("Erro ao salvar agenda:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Erro ao salvar agenda" },
      { status: 500 }
    );
  }
}
