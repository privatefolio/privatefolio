import * as fsPromises from "fs/promises"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  AuthSecrets,
  handleLoginRequest,
  handleSetupRequest,
  handleStatusRequest,
  handleVerifyAuthRequest,
  hashPasswordAndGenerateSecrets,
  isAuthSetupComplete,
  readSecrets,
  storeSecrets,
  verifyPassword,
} from "../../src/api/auth-http-api"
import { extractJwt, generateJwt, verifyJwt } from "../../src/utils/jwt-utils"

// Mock the fs/promises module
vi.mock("fs/promises", () => ({
  access: vi.fn(),
  mkdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))

describe("JWT utils", () => {
  it("should generate a valid JWT", async () => {
    const secret = Buffer.from("test-secret-key")
    const token = await generateJwt(secret)

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")
    expect(token.split(".").length).toBe(3) // JWT has three parts
  })

  it("should verify a valid JWT", async () => {
    const secret = Buffer.from("test-secret-key")
    const token = await generateJwt(secret)

    const payload = await verifyJwt(token, secret)
    expect(payload).not.toBeNull()
    expect(payload?.iss).toBe("Privatefolio")
  })

  it("should reject an invalid JWT", async () => {
    const secret = Buffer.from("test-secret-key")
    const wrongSecret = Buffer.from("wrong-secret-key")
    const token = await generateJwt(secret)

    const payload = await verifyJwt(token, wrongSecret)
    expect(payload).toBeNull()
  })

  it("should extract JWT from Authorization header", () => {
    const token = "test.jwt.token"
    const request = new Request("https://example.com", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(extractJwt(request)).toBe(token)
  })

  it("should extract JWT from query parameter", () => {
    const token = "test.jwt.token"
    const request = new Request(`https://example.com?jwt=${token}`)

    expect(extractJwt(request)).toBe(token)
  })
})

describe("Auth functions", () => {
  it("should hash password and generate secrets", async () => {
    const password = "test-password"
    const secrets = await hashPasswordAndGenerateSecrets(password)

    expect(secrets.salt).toBeInstanceOf(Buffer)
    expect(secrets.hash).toBeInstanceOf(Buffer)
    expect(secrets.jwtSecret).toBeInstanceOf(Buffer)
    expect(secrets.salt.length).toBe(16)
    expect(secrets.hash.length).toBe(64)
    expect(secrets.jwtSecret.length).toBe(32)
  })

  it("should verify correct password", async () => {
    const password = "test-password"
    const { salt, hash } = await hashPasswordAndGenerateSecrets(password)

    const isValid = await verifyPassword(password, salt, hash)
    expect(isValid).toBe(true)
  })

  it("should reject incorrect password", async () => {
    const password = "test-password"
    const wrongPassword = "wrong-password"
    const { salt, hash } = await hashPasswordAndGenerateSecrets(password)

    const isValid = await verifyPassword(wrongPassword, salt, hash)
    expect(isValid).toBe(false)
  })

  it("should check if setup is complete", async () => {
    // Mock setup is not complete
    vi.mocked(fsPromises.access).mockRejectedValueOnce(new Error("ENOENT"))

    const isComplete = await isAuthSetupComplete()
    expect(isComplete).toBe(false)

    // Mock setup is complete
    vi.mocked(fsPromises.access).mockResolvedValue(undefined)

    const isComplete2 = await isAuthSetupComplete()
    expect(isComplete2).toBe(true)
  })

  it("should store secrets", async () => {
    const salt = Buffer.from("salt")
    const hash = Buffer.from("hash")
    const jwtSecret = Buffer.from("secret")

    vi.mocked(fsPromises.access).mockResolvedValue(undefined)
    vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined)

    await storeSecrets(salt, hash, jwtSecret)

    expect(fsPromises.writeFile).toHaveBeenCalledTimes(3)
  })

  it("should read secrets", async () => {
    const salt = Buffer.from("salt")
    const hash = Buffer.from("hash")
    const jwtSecret = Buffer.from("secret")

    vi.mocked(fsPromises.readFile)
      .mockResolvedValueOnce(salt)
      .mockResolvedValueOnce(hash)
      .mockResolvedValueOnce(jwtSecret)

    const secrets = await readSecrets()

    expect(secrets).not.toBeNull()
    expect(secrets?.salt).toEqual(salt)
    expect(secrets?.hash).toEqual(hash)
    expect(secrets?.jwtSecret).toEqual(jwtSecret)
  })
})

describe("Auth HTTP handlers", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("should handle status request when setup is not complete", async () => {
    vi.mocked(fsPromises.access).mockRejectedValueOnce(new Error("ENOENT"))

    const response = await handleStatusRequest()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.needsSetup).toBe(true)
  })

  it("should handle status request when setup is complete", async () => {
    vi.mocked(fsPromises.access).mockResolvedValue(undefined)

    const response = await handleStatusRequest()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.needsSetup).toBe(false)
  })

  it("should handle setup request", async () => {
    vi.mocked(fsPromises.access).mockRejectedValueOnce(new Error("ENOENT"))
    vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined)
    vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined)

    const request = new Request("https://example.com", {
      body: JSON.stringify({ password: "secure-password" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    const response = await handleSetupRequest(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.success).toBe(true)
    expect(fsPromises.writeFile).toHaveBeenCalledTimes(3)
  })

  it.todo("should handle login request with correct password", async () => {
    const testSecrets: AuthSecrets = {
      hash: Buffer.from("hash"),
      jwtSecret: Buffer.from("secret"),
      salt: Buffer.from("salt"),
    }

    // Mock that setup is complete
    vi.mocked(fsPromises.access).mockResolvedValue(undefined)

    // Mock the verification to return true
    const verifyPasswordSpy = vi.spyOn({ verifyPassword }, "verifyPassword")
    verifyPasswordSpy.mockResolvedValue(true)

    // Mock reading the secrets
    vi.mocked(fsPromises.readFile)
      .mockResolvedValueOnce(testSecrets.salt)
      .mockResolvedValueOnce(testSecrets.hash)
      .mockResolvedValueOnce(testSecrets.jwtSecret)

    const request = new Request("https://example.com", {
      body: JSON.stringify({ password: "secure-password" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    const response = await handleLoginRequest(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.token).toBeDefined()
  })

  it("should verify auth with valid token", async () => {
    const testSecrets: AuthSecrets = {
      hash: Buffer.from("hash"),
      jwtSecret: Buffer.from("secret"),
      salt: Buffer.from("salt"),
    }

    // Mock that setup is complete
    vi.mocked(fsPromises.access).mockResolvedValue(undefined)

    // Generate a valid JWT
    const token = await generateJwt(testSecrets.jwtSecret)

    // Mock reading the secrets
    vi.mocked(fsPromises.readFile)
      .mockResolvedValueOnce(testSecrets.salt)
      .mockResolvedValueOnce(testSecrets.hash)
      .mockResolvedValueOnce(testSecrets.jwtSecret)

    const request = new Request("https://example.com", {
      headers: { Authorization: `Bearer ${token}` },
    })

    const response = await handleVerifyAuthRequest(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.valid).toBe(true)
  })
})
