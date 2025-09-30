export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type Suit = '♠' | '♥' | '♦' | '♣';
export type Card = { rank: Rank; suit: Suit; id: string };


const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

export function drawRandomCard(): Card {
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    return { rank, suit, id: `${rank}${suit}-${Math.random().toString(36).slice(2, 9)}` };
}

export function cardValue(rank: Rank): number[] {
    if (rank === 'A') return [1, 11];
    if (rank === 'J' || rank === 'Q' || rank === 'K') return [10];
    return [parseInt(rank, 10)];
}


export function bestHandValue(cards: Card[]): { value: number; isSoft: boolean } {
    let totals = [0];
    for (const c of cards) {
        const vals = cardValue(c.rank);
        const newTotals: number[] = [];
        for (const t of totals) {
            for (const v of vals) newTotals.push(t + v);
        }
        totals = Array.from(new Set(newTotals));
    }
    const under = totals.filter(t => t <= 21);
    if (under.length) {
        const best = Math.max(...under);
        const isSoft = totals.some(t => t - 10 === best);
        return { value: best, isSoft };
    }
    const minOver = Math.min(...totals);
    return { value: minOver, isSoft: false };
}


export function isBust(cards: Card[]) {
    return bestHandValue(cards).value > 21;
}


export function dealerPlay(initialDealerCards: Card[], drawFn = drawRandomCard): Card[] {
    const dealer = [...initialDealerCards];
    while (true) {
        const { value } = bestHandValue(dealer);
        if (value <= 16) {
            dealer.push(drawFn());
        } else {
            break;
        }
        if (dealer.length > 12) break;
    }
    return dealer;
}


export function compareHands(playerCards: Card[], dealerCards: Card[]) {
    const p = bestHandValue(playerCards).value;
    const d = bestHandValue(dealerCards).value;
    const playerBust = p > 21;
    const dealerBust = d > 21;
    if (playerBust) return { result: 'loss', player: p, dealer: d };
    if (dealerBust) return { result: 'win', player: p, dealer: d };
    if (p > d) return { result: 'win', player: p, dealer: d };
    if (p < d) return { result: 'loss', player: p, dealer: d };
    return { result: 'push', player: p, dealer: d };
}