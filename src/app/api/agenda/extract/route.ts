import { NextRequest, NextResponse } from "next/server";
import { extractAgendaFromImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    if (body.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Imagem muito grande. Tente enviar uma foto menor." },
        { status: 413 }
      );
    }
    const { image, date } = JSON.parse(body);

    if (!image || !date) {
      return NextResponse.json(
        { error: "Imagem e data são obrigatórios" },
        { status: 400 }
      );
    }

    const extracted = await extractAgendaFromImage(image);

    if (extracted.appointments.length === 0) {
      return NextResponse.json(
        { error: "Nenhum paciente encontrado na imagem" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      clinic: extracted.clinic || "Amar Saúde Tramandaí",
      appointments: extracted.appointments,
    });
  } catch (error) {
    console.error("Erro na extração:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Erro ao processar imagem" },
      { status: 500 }
    );
  }
}
