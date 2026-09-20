import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ARIMORI_booth_session";
const SESSION_SECONDS = 12 * 60 * 60;

function secret() {
  const value = process.env.ARIMORI_SUPABASE_SECRET_KEY;
  if (!value) throw new Error("부스 로그인을 위한 서버 환경변수가 필요합니다.");
  return value;
}

export function hashBoothCode(code: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyBoothCode(code: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(code, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createBoothSession(boothId: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${boothId}.${expires}`;
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${signature(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
}

export async function hasBoothSession(boothId: string) {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const [storedBoothId, expiresText, storedSignature] = raw.split(".");
  if (storedBoothId !== boothId || !expiresText || !storedSignature) return false;
  const expires = Number(expiresText);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;
  const payload = `${storedBoothId}.${expiresText}`;
  const expected = signature(payload);
  const a = Buffer.from(storedSignature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function clearBoothSession() {
  (await cookies()).delete(COOKIE_NAME);
}
