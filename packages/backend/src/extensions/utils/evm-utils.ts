import { ethers } from "ethers"

import { RPC_PROVIDERS } from "../../settings/platforms"
import { PlatformPrefix } from "../../settings/settings"

export const ETHEREUM_PLATFORM_ID = `${PlatformPrefix.Chain}ethereum`

/**
 * Creates an ethers JsonRpcProvider with fallback support for supported EVM chains.
 * Supports: Ethereum (1), Optimism (10), BSC (56), Polygon (137), Base (8453), Arbitrum (42161).
 */
export function createEvmRpcProvider(chainId: number): ethers.JsonRpcProvider {
  // Check if chain is supported
  const providers = RPC_PROVIDERS[chainId]
  if (!providers) {
    const supportedChains = Object.keys(RPC_PROVIDERS).join(", ")
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${supportedChains}`)
  }

  // Try providers in order
  for (const url of providers) {
    try {
      return new ethers.JsonRpcProvider(url, undefined, {
        staticNetwork: ethers.Network.from(chainId),
      })
    } catch (error) {
      console.warn(`Failed to create provider for ${url}:`, error)
      continue
    }
  }

  // Fallback to the last provider if all fail during creation
  const fallbackUrl = providers[providers.length - 1]
  return new ethers.JsonRpcProvider(fallbackUrl, undefined, {
    staticNetwork: ethers.Network.from(chainId),
  })
}

/**
 * Attempts to call an RPC method with multiple provider fallbacks.
 * Returns the result from the first successful provider.
 */
export async function callWithProviderFallback<T>(
  chainId: number,
  operation: (provider: ethers.JsonRpcProvider) => Promise<T>,
  timeoutMs = 8000
): Promise<T> {
  // Check if chain is supported
  const providersToTry = RPC_PROVIDERS[chainId]
  if (!providersToTry) {
    const supportedChains = Object.keys(RPC_PROVIDERS).join(", ")
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${supportedChains}`)
  }

  let lastError: Error | null = null

  for (const providerUrl of providersToTry) {
    try {
      const provider = new ethers.JsonRpcProvider(providerUrl, undefined, {
        staticNetwork: ethers.Network.from(chainId),
      })

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((resolve, reject) => {
        setTimeout(() => reject(new Error("RPC timeout")), timeoutMs)
      })

      const result = await Promise.race([operation(provider), timeoutPromise])
      return result
    } catch (error) {
      lastError = error as Error
      const isLastProvider = providerUrl === providersToTry[providersToTry.length - 1]

      if (isLastProvider) {
        throw lastError
      }
      // Continue to next provider
    }
  }

  throw lastError || new Error("All RPC providers failed")
}

/**
 * Standard ERC-20 ABI for basic token operations
 */
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

/**
 * Gets the balance of an ERC-20 token for a given wallet address.
 * Handles provider fallbacks automatically.
 */
export async function getErc20Balance(
  contractAddress: string,
  walletAddress: string,
  chainId: number
): Promise<{ balance: string; decimals: number }> {
  return callWithProviderFallback(chainId, async (provider) => {
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider)
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals().catch(() => 18), // Default to 18 decimals if call fails
    ])

    return {
      balance: ethers.formatUnits(balance, decimals),
      decimals: Number(decimals),
    }
  })
}

/**
 * Gets the native ETH balance for a given wallet address.
 * Handles provider fallbacks automatically.
 */
export async function getNativeBalance(walletAddress: string, chainId: number): Promise<string> {
  return callWithProviderFallback(chainId, async (provider) => {
    const balance = await provider.getBalance(walletAddress)
    return ethers.formatEther(balance)
  })
}
