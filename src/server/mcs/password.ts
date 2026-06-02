import { createHash, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto"

const PASSWORD_ITERATIONS = 160_000
const KEY_LENGTH = 32
const DIGEST = "sha256"

export type PasswordCredential = {
  hash: string
  salt: string
  iterations: number
}

export type SignedSessionPayload = {
  userId: string
  sessionId: string
  iat: number
  exp: number
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): PasswordCredential {
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, KEY_LENGTH, DIGEST).toString("hex")

  return {
    hash,
    salt,
    iterations: PASSWORD_ITERATIONS,
  }
}

export function verifyPassword(
  password: string,
  credential: Pick<PasswordCredential, "hash" | "salt" | "iterations">
) {
  const actual = Buffer.from(credential.hash, "hex")
  const expected = pbkdf2Sync(password, credential.salt, credential.iterations, KEY_LENGTH, DIGEST)

  if (actual.length !== expected.length) {
    return false
  }

  return timingSafeEqual(actual, expected)
}

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url")
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createSignedSessionToken(payload: SignedSessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = signSessionPayload(encodedPayload)

  return `v1.${encodedPayload}.${signature}`
}

export function verifySignedSessionToken(token: string): SignedSessionPayload | undefined {
  const [version, encodedPayload, signature] = token.split(".")

  if (version !== "v1" || !encodedPayload || !signature) {
    return undefined
  }

  const expected = signSessionPayload(encodedPayload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return undefined
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SignedSessionPayload>

    if (
      typeof payload.userId === "string" &&
      typeof payload.sessionId === "string" &&
      typeof payload.iat === "number" &&
      typeof payload.exp === "number"
    ) {
      return payload as SignedSessionPayload
    }
  } catch {
    return undefined
  }

  return undefined
}

export function createId(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`
}

function signSessionPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url")
}

function getSessionSecret() {
  return process.env.MCS_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "mcs-dashboard-development-session-secret"
}
