import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractAgendaFromImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { image, date } = await request.json();

    if (!image || !date) {
      return NextResponse.json(
        { error: "Imagem e data são obrigatórios" },
        { status: 400 }
      );
    }

    // Extract agenda from image via Gemini
    const extracted = await extractAgendaFromImage(image);

    if (extracted.appointments.length === 0) {
      return NextResponse.json(
        { error: "Nenhum paciente encontrado na imagem" },
        { status: 422 }
      );
    }

    // Upsert agenda (if already exists for this date+clinic, replace appointments)
    const clinic = extracted.clinic || "Amar Saúde Tramandaí";
    const agendaDate = new Date(date + "T00:00:00.000Z");

    // Delete existing agenda for this date+clinic if any
    await prisma.agenda.deleteMany({
      where: { date: agendaDate, clinic },
    });

    // Create new agenda with appointments
    const agenda = await prisma.agenda.create({
      data: {
        date: agendaDate,
        clinic,
        appointments: {
          create: extracted.appointments.map((apt) => ({
            time: apt.time,
            patientName: apt.patientName,
          })),
        },
      },
      include: { appointments: { orderBy: { time: "asc" } } },
    });

    return NextResponse.json({ agenda, extracted });
  } catch (error) {
    console.error("Erro no upload da agenda:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Erro ao processar imagem" },
      { status: 500 }
    );
  }
}
