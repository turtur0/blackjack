export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type Suit = '♠' | '♥' | '♦' | '♣';
export type Card = { rank: Rank; suit: Suit; id: string };

const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

const DEALER_HIT_THRESHOLD = 16;
const DEALER_MAX_CARDS = 12; // Safety limit

/**
 * Draws a random card from a standard deck
 */
export function drawRandomCard(): Card {
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const id = `${rank}${suit}-${Math.random().toString(36).slice(2, 9)}`;
    return { rank, suit, id };
}

/**
 * Returns possible values for a card rank
 * Aces return [1, 11], face cards return [10], others return their numeric value
 */
export function cardValue(rank: Rank): number[] {
    if (rank === 'A') return [1, 11];
    if (rank === 'J' || rank === 'Q' || rank === 'K') return [10];
    return [parseInt(rank, 10)];
}

/**
 * Calculates the best hand value (closest to 21 without busting)
 * Returns the value and whether it's a "soft" hand (has an ace counted as 11)
 */
export function bestHandValue(cards: Card[]): { value: number; isSoft: boolean } {
    let totals = [0];

    // Calculate all possible totals
    for (const card of cards) {
        const values = cardValue(card.rank);
        const newTotals: number[] = [];

        for (const total of totals) {
            for (const value of values) {
                newTotals.push(total + value);
            }
        }

        totals = Array.from(new Set(newTotals));
    }

    // Find best total under or equal to 21
    const validTotals = totals.filter(t => t <= 21);

    if (validTotals.length > 0) {
        const best = Math.max(...validTotals);
        const isSoft = totals.some(t => t - 10 === best);
        return { value: best, isSoft };
    }

    // All totals bust - return minimum
    const minOver = Math.min(...totals);
    return { value: minOver, isSoft: false };
}

/**
 * Checks if a hand is busted (over 21)
 */
export function isBust(cards: Card[]): boolean {
    return bestHandValue(cards).value > 21;
}

/**
 * Simulates dealer play according to standard rules
 * Dealer hits on 16 or less, stands on 17 or more
 */
export function dealerPlay(
    initialDealerCards: Card[],
    drawFn: () => Card = drawRandomCard
): Card[] {
    const dealer = [...initialDealerCards];

    while (dealer.length < DEALER_MAX_CARDS) {
        const { value } = bestHandValue(dealer);

        if (value <= DEALER_HIT_THRESHOLD) {
            dealer.push(drawFn());
        } else {
            break;
        }
    }

    return dealer;
}

/**
 * Compares player and dealer hands to determine the result
 */
export function compareHands(playerCards: Card[], dealerCards: Card[]) {
    const playerValue = bestHandValue(playerCards).value;
    const dealerValue = bestHandValue(dealerCards).value;

    const playerBust = playerValue > 21;
    const dealerBust = dealerValue > 21;

    if (playerBust) {
        return { result: 'loss' as const, player: playerValue, dealer: dealerValue };
    }

    if (dealerBust) {
        return { result: 'win' as const, player: playerValue, dealer: dealerValue };
    }

    if (playerValue > dealerValue) {
        return { result: 'win' as const, player: playerValue, dealer: dealerValue };
    }

    if (playerValue < dealerValue) {
        return { result: 'loss' as const, player: playerValue, dealer: dealerValue };
    }

    return { result: 'push' as const, player: playerValue, dealer: dealerValue };
}