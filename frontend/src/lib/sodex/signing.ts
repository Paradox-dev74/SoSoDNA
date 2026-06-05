import { privateKeyToAccount } from 'viem/accounts'

export interface SodexSigningPayload {
  signing_domain: Record<string, unknown>
  signing_types: Record<string, { name: string; type: string }[]>
  signing_message: Record<string, unknown>
}

export async function signSodexPerpsOrder(
  apiKeyPrivateKey: `0x${string}`,
  payload: SodexSigningPayload,
): Promise<string> {
  const account = privateKeyToAccount(apiKeyPrivateKey)
  const signature = await account.signTypedData({
    domain: payload.signing_domain as {
      name: string
      chainId: number
      verifyingContract: `0x${string}`
    },
    types: payload.signing_types as {
      ExchangeAction: { name: string; type: string }[]
    },
    primaryType: 'ExchangeAction',
    message: {
      payloadHash: payload.signing_message.payloadHash as `0x${string}`,
      nonce: BigInt(payload.signing_message.nonce as string | number),
    },
  })
  return `0x01${signature.slice(2)}`
}

const CREDENTIALS_KEY = 'sodex_api_credentials_session'

export interface SodexApiCredentials {
  apiKeyName: string
  apiKeyPrivateKey: string
}

export function storeSodexCredentials(credentials: SodexApiCredentials): void {
  sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
}

export function getSodexCredentials(): SodexApiCredentials | null {
  const raw = sessionStorage.getItem(CREDENTIALS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SodexApiCredentials
  } catch {
    return null
  }
}

export function clearSodexCredentials(): void {
  sessionStorage.removeItem(CREDENTIALS_KEY)
}
