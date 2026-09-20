import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
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

function encryptionKey() {
  return createHash("sha256").update(secret()).digest();
}

export function encryptBoothCode(code: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptBoothCode(value: string | null | undefined) {
  if (!value) return null;
  try {
    const [ivText, tagText, encryptedText] = value.split(".");
    if (!ivText || !tagText || !encryptedText) return null;
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
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
