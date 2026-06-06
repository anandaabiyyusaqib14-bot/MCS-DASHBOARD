import type { UserRole } from "@/server/mcs/types"

type ProxySessionPayload = {
  exp: number
  iat: number
  role?: UserRole
  sessionId: string
  userId: string
}

const SESSION_TOKEN_VERSION = "v1"

export async function verifyProxySessionToken(token?: string): Promise<ProxySessionPayload | undefined> {
  if (!token) {
    return undefined
  }

  const [version, encodedPayload, signature] = token.split(".")

  if (version !== SESSION_TOKEN_VERSION || !encodedPayload || !signature) {
    return undefined
  }

  const expected = await signSessionPayload(encodedPayload)

  if (signature !== expected) {
    return undefined
  }

  const payload = parsePayload(encodedPayload)

  if (
    !payload ||
    payload.exp <= Math.floor(Date.now() / 1000) ||
    typeof payload.userId !== "string" ||
    typeof payload.sessionId !== "string"
  ) {
    return undefined
  }

  return payload
}

async function signSessionPayload(encodedPayload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload))

  return base64UrlEncode(new Uint8Array(signature))
}

function parsePayload(encodedPayload: string): ProxySessionPayload | undefined {
  try {
    const payload = JSON.parse(Buffer.from(toBase64(encodedPayload), "base64").toString("utf8")) as Partial<ProxySessionPayload>

    if (
      typeof payload.exp === "number" &&
      typeof payload.iat === "number" &&
      typeof payload.sessionId === "string" &&
      typeof payload.userId === "string"
    ) {
      return payload as ProxySessionPayload
    }
  } catch {
    return undefined
  }

  return undefined
}

function toBase64(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = base64.length % 4

  return padding ? `${base64}${"=".repeat(4 - padding)}` : base64
}

function base64UrlEncode(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url")
}

function getSessionSecret() {
  return process.env.MCS_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "mcs-dashboard-development-session-secret"
}
