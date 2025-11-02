// src/lib/auth.ts
import { auth } from "@/lib/firebaseAdmin";
import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

const SESSION_COOKIE_NAME = "session";
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSession(idToken: string, res: NextApiResponse) {
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
  const isProd = process.env.NODE_ENV === "production";

  const options = {
    httpOnly: true,
    maxAge: expiresIn / 1000,
    path: "/",
    sameSite: "Lax" as const,
    secure: isProd,
  };

  res.setHeader("Set-Cookie", serialize(SESSION_COOKIE_NAME, sessionCookie, options));
}

export async function verifySession(req: NextApiRequest) {
  const sessionCookie = req.cookies[SESSION_COOKIE_NAME] || "";
  if (!sessionCookie) {
    return null;
  }
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    return null;
  }
}

export function deleteSession(res: NextApiResponse) {
  const options = {
    maxAge: -1,
    path: "/",
  };
  res.setHeader("Set-Cookie", serialize(SESSION_COOKIE_NAME, "", options));
}
