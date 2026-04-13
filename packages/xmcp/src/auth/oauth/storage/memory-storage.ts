import { OAuthStorage, TokenStorage, AccessToken } from "../types";

const tokensMap = new Map<string, AccessToken>();

export class MemoryTokenStorage implements TokenStorage {
  async getToken(token: string): Promise<AccessToken | null> {
    const accessToken = tokensMap.get(token);

    if (
      accessToken &&
      accessToken.expiresAt &&
      accessToken.expiresAt < new Date()
    ) {
      tokensMap.delete(token);
      return null;
    }

    return accessToken || null;
  }

  async saveToken(token: AccessToken): Promise<void> {
    tokensMap.set(token.token, token);
  }

  async deleteToken(token: string): Promise<void> {
    tokensMap.delete(token);
  }

  async deleteTokensByClient(clientId: string): Promise<void> {
    for (const [tokenValue, tokenData] of tokensMap.entries()) {
      if (tokenData.clientId === clientId) {
        tokensMap.delete(tokenValue);
      }
    }
  }
}

export class MemoryOAuthStorage implements OAuthStorage {
  public tokens: TokenStorage;

  constructor() {
    this.tokens = new MemoryTokenStorage();
  }
}
