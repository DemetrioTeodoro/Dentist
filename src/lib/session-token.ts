import { SignJWT, jwtVerify } from "jose";

// Separado de session.ts porque também roda no middleware (Edge runtime)
export const SESSION_COOKIE = "session";

export type SessionPayload = {
  userId: string;
  name: string;
  role: "ADMIN" | "DENTIST" | "RECEPTION";
};

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key());
}

export async function verifySession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, key());
    return payload;
  } catch {
    return null;
  }
}
