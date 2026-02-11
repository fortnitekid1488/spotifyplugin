import { createContext } from 'react';
import type { SpotifyUser } from '../types/spotify.ts';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: SpotifyUser | null;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  handleCallback: (code: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
