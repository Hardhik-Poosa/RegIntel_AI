export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
  getUser?(): Promise<any | null>;
  setUser?(user: any): Promise<void>;
}

export class WebTokenStorage implements TokenStorage {
  async getToken(): Promise<string | null> {
    return localStorage.getItem('rg_token');
  }

  async setToken(token: string): Promise<void> {
    localStorage.setItem('rg_token', token);
  }

  async clearToken(): Promise<void> {
    localStorage.removeItem('rg_token');
    localStorage.removeItem('rg_user');
  }

  async getUser(): Promise<any | null> {
    const raw = localStorage.getItem('rg_user');
    return raw ? JSON.parse(raw) : null;
  }

  async setUser(user: any): Promise<void> {
    localStorage.setItem('rg_user', JSON.stringify(user));
  }
}

export const defaultWebStorage = new WebTokenStorage();
