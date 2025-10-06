import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveGameHistory, GameResult } from '../lib/gameUtils';

interface SaveGameResult {
  success: boolean;
  chipsAfter?: number;
}

export function useGameHistory() {
  const [isSaving, setIsSaving] = useState(false);
  const { user, token } = useAuth();

  const saveGame = async (gameData: GameResult): Promise<SaveGameResult> => {
    if (!user || !token) {
      console.warn('Cannot save game: User not authenticated');
      return { success: false };
    }

    setIsSaving(true);

    try {
      const result = await saveGameHistory(
        gameData,
        token,
        user.username,
        (user as any).id
      );
      return result;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveGame,
    isSaving,
  };
}