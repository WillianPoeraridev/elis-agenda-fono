import { NextRequest, NextResponse } from "next/server";
import { verifyPin, createSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    console.log("PIN recebido:", pin);
    console.log("HASH do env:", process.env.APP_PIN_HASH);

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN obrigatório" }, { status: 400 });
    }

    const valid = await verifyPin(pin);
    console.log("Resultado compare:", valid);

    if (!valid) {
      return NextResponse.json({ error: "PIN incorreto" }, { status: 401 });
    }

    const token = await createSession();

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
