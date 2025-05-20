import * as jose from "jose"
import { TextEncoder } from "util" // Node.js util for encoding secret

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
