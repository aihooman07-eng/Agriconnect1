import { createHash, randomBytes } from "crypto";

export function randomSixDigitCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

export function hashOtp(code: string, pepper: string): string {
  return createHash("sha256")
    .update(`${code}::${pepper}`, "utf8")
    .digest("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
