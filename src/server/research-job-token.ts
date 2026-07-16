import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import type { ResearchRequest } from "@/lib/schemas";

const TOKEN_VERSION = "v1";
const TOKEN_PURPOSE = "steppi-research-background-job";
const AUTH_TAG_BYTES = 16;

export type ResearchJobToken = {
  responseId: string;
  contextDigest: string;
  dateChecked: string;
  createdAt: number;
  cancelRequested: boolean;
};

function encryptionKey(secret: string) {
  return createHash("sha256").update(TOKEN_PURPOSE).update("\0").update(secret).digest();
}

function validJobToken(value: unknown): value is ResearchJobToken {
  if (typeof value !== "object" || value === null) return false;
  const token = value as Record<string, unknown>;
  return (
    typeof token.responseId === "string" &&
    /^resp_[a-zA-Z0-9_-]{1,200}$/.test(token.responseId) &&
    typeof token.contextDigest === "string" &&
    /^[a-f0-9]{64}$/.test(token.contextDigest) &&
    typeof token.dateChecked === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(token.dateChecked) &&
    typeof token.createdAt === "number" &&
    Number.isSafeInteger(token.createdAt) &&
    typeof token.cancelRequested === "boolean"
  );
}

export function researchContextDigest(input: ResearchRequest) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function sealResearchJobToken(job: ResearchJobToken, secret: string) {
  if (!secret.trim()) throw new Error("research_job_secret_missing");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  cipher.setAAD(Buffer.from(TOKEN_PURPOSE));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(job), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    TOKEN_VERSION,
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    authTag.toString("base64url"),
  ].join(".");
}

export function openResearchJobToken(token: string, secret: string) {
  if (!secret.trim()) return null;
  const [version, ivValue, encryptedValue, authTagValue, extra] = token.split(".");
  if (version !== TOKEN_VERSION || !ivValue || !encryptedValue || !authTagValue || extra) {
    return null;
  }

  try {
    const iv = Buffer.from(ivValue, "base64url");
    const encrypted = Buffer.from(encryptedValue, "base64url");
    const authTag = Buffer.from(authTagValue, "base64url");
    if (iv.length !== 12 || authTag.length !== AUTH_TAG_BYTES) return null;

    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), iv);
    decipher.setAAD(Buffer.from(TOKEN_PURPOSE));
    decipher.setAuthTag(authTag);
    const decoded = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
    const parsed: unknown = JSON.parse(decoded);
    return validJobToken(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function researchContextMatches(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
