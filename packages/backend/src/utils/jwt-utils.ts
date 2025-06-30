import { createCipheriv, createDecipheriv, randomBytes } from "crypto"
import * as jose from "jose"
import { TextEncoder } from "util" // Node.js util for encoding secret

import { isTestEnvironment } from "./environment-utils"

// TODO7 move these to settings.ts
const JWT_EXPIRATION = "30d" // Token expires in 30 days
const JWT_ISSUER = "Privatefolio"
const JWT_ALG = "HS256" // Algorithm (using HMAC with SHA-256)

type PrivatefolioJwtPayload = jose.JWTPayload

/**
 * Prepares the secret key for jose (expects Uint8Array).
 * @param secret The secret as a Buffer or string.
 * @returns The secret as a Uint8Array.
 */
function prepareSecret(secret: Buffer | string): Uint8Array {
  if (Buffer.isBuffer(secret)) {
    // If it's already a Buffer, convert directly
    return new Uint8Array(secret.buffer, secret.byteOffset, secret.byteLength)
  } else {
    // If it's a string, encode it as UTF-8
    return new TextEncoder().encode(secret)
  }
}

/**
 * Generates a JWT for authentication using the provided secret.
 * @param jwtSecret The secret key (Buffer or string) to sign the token.
 * @returns A Promise resolving to the generated JWT string.
 */
export async function generateJwt(jwtSecret: Buffer | string): Promise<string> {
  const secretKey = prepareSecret(jwtSecret)

  const token = await new jose.SignJWT({})
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(JWT_EXPIRATION)
    // Add any other custom claims here using .setPayloadClaim()
    .sign(secretKey)

  return token
}

/**
 * Verifies a JWT using the provided secret.
 * @param token The JWT string to verify.
 * @param jwtSecret The secret key (Buffer or string) used for signing.
 * @returns A Promise resolving to the decoded payload if the token is valid and not expired, otherwise null.
 */
export async function verifyJwt(
  token: string,
  jwtSecret: Buffer | string
): Promise<PrivatefolioJwtPayload | null> {
  const secretKey = prepareSecret(jwtSecret)

  try {
    const { payload } = await jose.jwtVerify(token, secretKey, {
      // Verify the issuer claim
      algorithms: [JWT_ALG],
      issuer: JWT_ISSUER, // Specify allowed algorithms
    })
    return payload as PrivatefolioJwtPayload
  } catch (error) {
    if (isTestEnvironment) return null
    // Log specific JOSE errors if needed
    if (error instanceof jose.errors.JWTExpired) {
      console.warn("JWT Verification failed: Token expired")
    } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
      console.warn(
        `JWT Verification failed: Claim validation failed (${error.claim} = ${error.reason})`
      )
    } else if (error instanceof jose.errors.JOSEError) {
      console.warn(`JWT Verification failed: ${error.code || error.message}`)
    } else {
      console.warn("JWT Verification failed:", error)
    }
    return null
  }
}

/**
 * Extracts a JWT from a request, either from the Authorization header or query parameter.
 */
export function extractJwt(request: Request): string | null {
  let bearerToken: string | null = null

  // Check Authorization header for JWT
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    bearerToken = authHeader.substring(7)
  }

  // If no JWT in header, check query parameter
  if (!bearerToken) {
    const url = new URL(request.url)
    bearerToken = url.searchParams.get("jwt")
  }

  return bearerToken
}

/**
 * Encrypts a string value using AES-256-GCM with the JWT secret as the base key.
 * @param value The string value to encrypt.
 * @param jwtSecret The JWT secret to derive the encryption key from.
 * @returns A Promise resolving to the encrypted value as a base64 string in format: iv:authTag:encryptedData
 */
export async function encryptValue(value: string, jwtSecret: Buffer | string): Promise<string> {
  const secretKey = prepareSecret(jwtSecret)

  // Derive a 32-byte key from the JWT secret using the first 32 bytes
  const key = secretKey.slice(0, 32)

  // Generate a random IV for each encryption
  const iv = randomBytes(12) // 12 bytes for GCM

  const cipher = createCipheriv("aes-256-gcm", key, iv)

  let encrypted = cipher.update(value, "utf8", "base64")
  encrypted += cipher.final("base64")

  const authTag = cipher.getAuthTag()

  // Return format: iv:authTag:encryptedData (all base64 encoded)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`
}

/**
 * Decrypts a string value that was encrypted with encryptValue.
 * @param encryptedValue The encrypted value as a base64 string in format: iv:authTag:encryptedData
 * @param jwtSecret The JWT secret to derive the decryption key from.
 * @returns A Promise resolving to the decrypted string value, or null if decryption fails.
 */
export async function decryptValue(
  encryptedValue: string,
  jwtSecret: Buffer | string
): Promise<string | null> {
  try {
    const secretKey = prepareSecret(jwtSecret)

    // Derive the same 32-byte key
    const key = secretKey.slice(0, 32)

    // Parse the encrypted value format: iv:authTag:encryptedData
    const parts = encryptedValue.split(":")
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted value format")
    }

    const iv = Buffer.from(parts[0], "base64")
    const authTag = Buffer.from(parts[1], "base64")
    const encrypted = parts[2]

    const decipher = createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, "base64", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    if (!isTestEnvironment) {
      console.warn("Decryption failed:", error)
    }
    return null
  }
}
