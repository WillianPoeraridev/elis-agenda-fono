import bcryptjs from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-dev-secret");
const COOKIE_NAME = "elis-session";

export async function verifyPin(pin: string): Promise<boolean> {
  const hash = process.env.APP_PIN_HASH;
  if (!hash) return false;
  return bcryptjs.compare(pin, hash);
}

export async function createSession(): Promise<string> {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);
  return token;
}

export async function validateSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
