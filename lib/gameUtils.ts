export type GameResultType = 'win' | 'loss' | 'push' | 'blackjack';

export interface GameResult {
  bet: number;
  playerScore: number;
  dealerScore: number;
  result: GameResultType;
  chipsWon: number;
  chipsAfter?: number;
}

/**
 * Saves game history to the database
 */
export async function saveGameHistory(
  gameData: GameResult,
  token: string,
  username: string,
  userId: string
): Promise<{ success: boolean; chipsAfter?: number }> {
  try {
    const response = await fetch('/api/game/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...gameData,
        username,
        userId,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Failed to save game:', data.error);
      return { success: false };
    }

    const data = await response.json();
    return { success: true, chipsAfter: data.game.chipsAfter };
  } catch (error) {
    console.error('Error saving game:', error);
    return { success: false };
  }
}

/**
 * Calculates chips won/lost based on game result
 * Returns positive for wins, negative for losses, zero for pushes
 */
export function calculateChipsWon(bet: number, result: GameResultType): number {
  switch (result) {
    case 'blackjack':
      return Math.floor(bet * 1.5); // Blackjack pays 3:2
    case 'win':
      return bet; // Regular win pays 1:1
    case 'push':
      return 0; // Push returns the bet (no net change)
    case 'loss':
      return -bet; // Loss loses the bet
    default:
      return 0;
  }
}

/**
 * Determines the game result based on scores and conditions
 */
export function determineGameResult(
  playerScore: number,
  dealerScore: number,
  playerBlackjack: boolean,
  dealerBlackjack: boolean,
  playerBusted: boolean,
  dealerBusted: boolean
): GameResultType {
  // Both have blackjack
  if (playerBlackjack && dealerBlackjack) {
    return 'push';
  }

  // Player has blackjack
  if (playerBlackjack) {
    return 'blackjack';
  }

  // Dealer has blackjack
  if (dealerBlackjack) {
    return 'loss';
  }

  // Player busted
  if (playerBusted) {
    return 'loss';
  }

  // Dealer busted
  if (dealerBusted) {
    return 'win';
  }

  // Compare scores
  if (playerScore > dealerScore) {
    return 'win';
  } else if (playerScore < dealerScore) {
    return 'loss';
  } else {
    return 'push';
  }
}