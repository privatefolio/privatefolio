import { randomBytes, scrypt, timingSafeEqual } from "crypto"
import { access, mkdir, readFile, writeFile } from "fs/promises"
import { isTestEnvironment } from "src/utils/environment-utils"
import { promisify } from "util"

import {
  AUTH_DATA_DIR,
  corsHeaders,
  HASH_FILE,
  JWT_SECRET_FILE,
  SALT_FILE,
} from "../settings/settings"
import { extractJwt, generateJwt, verifyJwt } from "../utils/jwt-utils"

const scryptAsync = promisify(scrypt)
const KEY_LEN = 64

export interface AuthSecrets {
  hash: Buffer
  jwtSecret: Buffer
  salt: Buffer
}

/**
 * Hashes a password and generates a JWT secret.
 * @param password The password to hash.
 * @returns A promise that resolves with salt, hash, and a new JWT secret.
 */
export async function hashPasswordAndGenerateSecrets(password: string): Promise<AuthSecrets> {
  const salt = randomBytes(16)
  const hash = (await scryptAsync(password, salt, KEY_LEN)) as Buffer
  const jwtSecret = randomBytes(32) // Generate a 256-bit secret
  return { hash, jwtSecret, salt }
}

/**
 * Verifies a password against a stored salt and hash.
 * @param password The password to verify.
 * @param salt The salt used during hashing.
 * @param storedHash The stored hash to compare against.
 * @returns A promise that resolves with true if the password is valid, false otherwise.
 */
export async function verifyPassword(
  password: string,
  salt: Buffer,
  storedHash: Buffer
): Promise<boolean> {
  const derivedKey = (await scryptAsync(password, salt, KEY_LEN)) as Buffer
  if (derivedKey.length !== storedHash.length) {
    return false // Should not happen with fixed KEY_LEN, but safety check
  }
  return timingSafeEqual(derivedKey, storedHash)
}

/**
 * Stores the salt, hash, and JWT secret to disk.
 * @param salt The salt buffer.
 * @param hash The hash buffer.
 * @param jwtSecret The JWT secret buffer.
 */
export async function storeSecrets(salt: Buffer, hash: Buffer, jwtSecret: Buffer): Promise<void> {
  try {
    await access(AUTH_DATA_DIR)
  } catch {
    await mkdir(AUTH_DATA_DIR, { recursive: true })
  }
  await writeFile(SALT_FILE, salt)
  await writeFile(HASH_FILE, hash)
  await writeFile(JWT_SECRET_FILE, jwtSecret)
  if (!isTestEnvironment) console.log("⚠️ Stored salt, hash, and JWT secret.")
}

/**
 * Reads the salt, hash, and JWT secret from disk.
 * @returns A promise that resolves with the credentials, or null if any file doesn't exist.
 */
export async function readSecrets(): Promise<AuthSecrets | null> {
  try {
    const [salt, hash, jwtSecret] = await Promise.all([
      readFile(SALT_FILE),
      readFile(HASH_FILE),
      readFile(JWT_SECRET_FILE),
    ])
    return { hash, jwtSecret, salt }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null
    }
    console.error("Error reading secrets:", error)
    throw error
  }
}

/**
 * Checks if the setup has been completed (all secret files exist).
 * @returns True if setup is complete, false otherwise.
 */
export async function isAuthSetupComplete(): Promise<boolean> {
  try {
    await Promise.all([access(SALT_FILE), access(HASH_FILE), access(JWT_SECRET_FILE)])
    return true
  } catch {
    return false
  }
}

/**
 * Handler for GET /api/setup-status
 */
export async function handleStatusRequest(): Promise<Response> {
  const needsSetup = !(await isAuthSetupComplete())
  return new Response(JSON.stringify({ needsSetup }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status: 200,
  })
}

/**
 * Handler for POST /api/setup
 */
export async function handleSetupRequest(request: Request): Promise<Response> {
  if (await isAuthSetupComplete()) {
    return new Response(JSON.stringify({ error: "Setup already complete." }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 409,
    })
  }
  try {
    const { password } = (await request.json()) as { password?: string }
    if (!password || typeof password !== "string" || password.length < 4) {
      return new Response(
        JSON.stringify({
          error: "Password is required and must be at least 4 characters long.",
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      )
    }
    const { salt, hash, jwtSecret } = await hashPasswordAndGenerateSecrets(password)
    await storeSecrets(salt, hash, jwtSecret)
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 201,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return new Response(JSON.stringify({ error: "Failed to complete setup." }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    })
  }
}

/**
 * Handler for POST /api/login
 */
export async function handleLoginRequest(request: Request): Promise<Response> {
  if (!(await isAuthSetupComplete())) {
    return new Response(JSON.stringify({ error: "Setup not complete." }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 400, // Bad Request or specific code?
    })
  }
  try {
    const { password } = (await request.json()) as { password?: string }
    if (!password) {
      return new Response(JSON.stringify({ error: "Password required." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      })
    }
    const secrets = await readSecrets()
    if (!secrets) {
      return new Response(JSON.stringify({ error: "Secrets not found." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      })
    }
    const isValid = await verifyPassword(password, secrets.salt, secrets.hash)
    if (isValid) {
      const token = await generateJwt(secrets.jwtSecret)
      return new Response(JSON.stringify({ token }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      })
    } else {
      return new Response(JSON.stringify({ error: "Incorrect password." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401, // Unauthorized
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    return new Response(JSON.stringify({ error: "Login failed." }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    })
  }
}

/**
 * Handler for GET /api/verify-auth
 * Verifies if a token is valid and not expired
 */
export async function handleVerifyAuthRequest(request: Request): Promise<Response> {
  if (!(await isAuthSetupComplete())) {
    return new Response(
      JSON.stringify({ error: "Authentication setup not complete.", valid: false }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      }
    )
  }

  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No authentication token provided.", valid: false }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 401,
        }
      )
    }

    const jwt = extractJwt(request)
    const secrets = await readSecrets()

    if (!secrets) {
      return new Response(
        JSON.stringify({ error: "Authentication secrets not found.", valid: false }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 500,
        }
      )
    }

    const payload = await verifyJwt(jwt, secrets.jwtSecret)
    if (payload) {
      return new Response(JSON.stringify({ valid: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      })
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token.", valid: false }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 401,
        }
      )
    }
  } catch (error) {
    console.error("Auth verification error:", error)
    return new Response(
      JSON.stringify({ error: "Authentication verification failed.", valid: false }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    )
  }
}
