import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext.ts';
import type { AuthContextType } from '../auth/AuthContext.ts';

/**
 * Hook to access the Spotify authentication context.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
