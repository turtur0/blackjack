import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveGameHistory, GameResult } from '../lib/gameUtils';

export function useGameHistory() {
  const [isSaving, setIsSaving] = useState(false);
  const { user, token } = useAuth();

  const saveGame = async (gameData: GameResult) => {
    if (!user || !token) {
      console.warn('Cannot save game: User not authenticated');
      return { success: false };
    }

    setIsSaving(true);
    const result = await saveGameHistory(
      gameData, 
      token, 
      user.username,
      (user as any).id
    );
    
    setIsSaving(false);
    return result;
  };

  return {
    saveGame,
    isSaving,
  };
}