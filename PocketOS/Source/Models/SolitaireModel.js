// SolitaireModel - Game model for Solitaire
import Model from '../Core/Model.js';

export default class SolitaireModel extends Model {
	constructor() {
		super();
		
		// 7 tableau piles (main play area, cascading cards)
		this.tableau = [[], [], [], [], [], [], []];
		
		// 4 foundation piles (build up by suit A-K)
		this.foundations = [[], [], [], []];
		
		// Track which suit is assigned to each foundation (null = unassigned)
		this.foundationSuits = [null, null, null, null];
		
		// Stock pile (face-down cards to draw)
		this.stock = [];
		
		// Waste pile (face-up drawn cards)
		this.waste = [];
		
		// Move history for undo
		this.moveHistory = [];
	}
	
	// Card representation: { suit: 0-3, rank: 0-12, faceUp: boolean }
	// Suits: 0=Spades, 1=Hearts, 2=Clubs, 3=Diamonds
	// Ranks: 0=Ace, 1=2, 2=3, ..., 9=10, 10=Jack, 11=Queen, 12=King
	
	createCard(suit, rank, faceUp = false) {
		return { suit, rank, faceUp };
	}
	
	getCardColor(card) {
		// Hearts(1) and Diamonds(3) are red; Spades(0) and Clubs(2) are black
		return (card.suit === 1 || card.suit === 3) ? 'red' : 'black';
	}
	
	isRed(card) {
		return card.suit === 1 || card.suit === 3;
	}
	
	isBlack(card) {
		return card.suit === 0 || card.suit === 2;
	}
	
	// Game initialization methods
	
	createDeck() {
		const deck = [];
		for (let suit = 0; suit < 4; suit++) {
			for (let rank = 0; rank < 13; rank++) {
				deck.push(this.createCard(suit, rank, false));
			}
		}
		return deck;
	}
	
	shuffle(deck) {
		// Fisher-Yates shuffle
		for (let i = deck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[deck[i], deck[j]] = [deck[j], deck[i]];
		}
		return deck;
	}
	
	initializeGame() {
		// Create and shuffle deck
		let deck = this.createDeck();
		deck = this.shuffle(deck);
		
		// TODO: Future enhancement - implement winnability check
		// Use a solver algorithm to reject unwinnable deals and regenerate
		// This would require implementing a recursive backtracking solver
		// or using heuristics to estimate winnability
		
		// Reset all piles
		this.tableau = [[], [], [], [], [], [], []];
		this.foundations = [[], [], [], []];
		this.foundationSuits = [null, null, null, null];
		this.stock = [];
		this.waste = [];
		this.moveHistory = [];
		
		// Deal to tableau: 1 card to pile 0, 2 to pile 1, ..., 7 to pile 7
		let cardIndex = 0;
		for (let pileIndex = 0; pileIndex < 7; pileIndex++) {
			for (let cardCount = 0; cardCount <= pileIndex; cardCount++) {
				const card = deck[cardIndex++];
				// Flip the top card (last in pile) face-up
				if (cardCount === pileIndex) {
					card.faceUp = true;
				}
				this.tableau[pileIndex].push(card);
			}
		}
		
		// Remaining 24 cards go to stock (face-down)
		this.stock = deck.slice(cardIndex);
	}
	
	// Move validation methods
	
	canMoveToTableau(cards, targetPileIndex) {
		if (!cards || cards.length === 0) return false;
		
		const targetPile = this.tableau[targetPileIndex];
		const movingCard = cards[0]; // The card that will be placed on target
		
		// Empty tableau accepts King only
		if (targetPile.length === 0) {
			return movingCard.rank === 12; // King
		}
		
		// Get the top card of target pile
		const targetCard = targetPile[targetPile.length - 1];
		
		// Must be face-up
		if (!targetCard.faceUp) return false;
		
		// Must alternate colors
		if (this.getCardColor(movingCard) === this.getCardColor(targetCard)) {
			return false;
		}
		
		// Must be descending rank (moving card rank = target rank - 1)
		if (movingCard.rank !== targetCard.rank - 1) {
			return false;
		}
		
		return true;
	}
	
	canMoveToFoundation(card, foundationIndex) {
		if (!card) return false;
		
		const foundation = this.foundations[foundationIndex];
		const assignedSuit = this.foundationSuits[foundationIndex];
		
		// If foundation is empty, only accept Ace (and it can be any suit)
		if (foundation.length === 0) {
			return card.rank === 0; // Ace
		}
		
		// If foundation has cards, must match the assigned suit
		if (assignedSuit !== null && card.suit !== assignedSuit) {
			return false;
		}
		
		// Get top card of foundation
		const topCard = foundation[foundation.length - 1];
		
		// Must be next rank in sequence (ascending)
		if (card.rank !== topCard.rank + 1) {
			return false;
		}
		
		return true;
	}
	
	canDrawFromStock() {
		return this.stock.length > 0;
	}
	
	// Move execution methods
	
	drawFromStock() {
		if (!this.canDrawFromStock()) {
			// Try to recycle waste
			if (this.waste.length > 0) {
				this.recycleWaste();
			}
			return false;
		}
		
		const card = this.stock.pop();
		card.faceUp = true;
		this.waste.push(card);
		
		// Record move for undo
		this.moveHistory.push({
			type: 'draw',
			from: 'stock',
			to: 'waste'
		});
		
		return true;
	}
	
	recycleWaste() {
		// Move all waste cards back to stock (face-down)
		while (this.waste.length > 0) {
			const card = this.waste.pop();
			card.faceUp = false;
			this.stock.push(card);
		}
		
		this.moveHistory.push({
			type: 'recycle',
			from: 'waste',
			to: 'stock'
		});
	}
	
	moveCards(fromPile, fromPileIndex, toPile, toPileIndex, cardCount) {
		// Get source pile
		let source;
		if (fromPile === 'tableau') source = this.tableau[fromPileIndex];
		else if (fromPile === 'waste') source = this.waste;
		else if (fromPile === 'foundation') source = this.foundations[fromPileIndex];
		
		// Get target pile
		let target;
		if (toPile === 'tableau') target = this.tableau[toPileIndex];
		else if (toPile === 'foundation') target = this.foundations[toPileIndex];
		
		// Check if we'll flip a card after this move
		let flippedCard = false;
		if (fromPile === 'tableau' && source.length > cardCount) {
			const willBeTopCard = source[source.length - cardCount - 1];
			if (!willBeTopCard.faceUp) {
				flippedCard = true;
			}
		}
		
		// Record move for undo
		this.moveHistory.push({
			type: 'move',
			sourceType: fromPile,
			sourceIndex: fromPileIndex,
			targetType: toPile,
			targetIndex: toPileIndex,
			count: cardCount,
			flippedCard: flippedCard
		});
		
		// Move cards
		const cards = source.splice(source.length - cardCount, cardCount);
		target.push(...cards);
		
		// If moving to an empty foundation, assign the suit
		if (toPile === 'foundation' && target.length === cardCount) {
			this.foundationSuits[toPileIndex] = cards[0].suit;
		}
		
		// If source was tableau, flip top card face-up
		if (fromPile === 'tableau' && source.length > 0) {
			const topCard = source[source.length - 1];
			if (!topCard.faceUp) {
				topCard.faceUp = true;
			}
		}
		
		return true;
	}
	
	// Game state management methods
	
	isGameWon() {
		// Check if all 4 foundations are complete (13 cards each, King on top)
		for (let i = 0; i < 4; i++) {
			const foundation = this.foundations[i];
			if (foundation.length !== 13) return false;
			const topCard = foundation[foundation.length - 1];
			if (topCard.rank !== 12) return false; // Must have King on top
		}
		return true;
	}
	
	hasValidMoves() {
		// Check if any legal moves exist
		
		// Check if can draw from stock
		if (this.canDrawFromStock()) return true;
		
		// Check if can recycle waste
		if (this.stock.length === 0 && this.waste.length > 0) return true;
		
		// Check waste to tableau/foundation
		if (this.waste.length > 0) {
			const wasteTop = this.waste[this.waste.length - 1];
			// Check foundations
			for (let i = 0; i < 4; i++) {
				if (this.canMoveToFoundation(wasteTop, i)) return true;
			}
			// Check tableau
			for (let i = 0; i < 7; i++) {
				if (this.canMoveToTableau([wasteTop], i)) return true;
			}
		}
		
		// Check tableau to tableau/foundation
		for (let sourceIdx = 0; sourceIdx < 7; sourceIdx++) {
			const source = this.tableau[sourceIdx];
			if (source.length === 0) continue;
			
			// Find first face-up card in pile
			let firstFaceUpIdx = -1;
			for (let i = 0; i < source.length; i++) {
				if (source[i].faceUp) {
					firstFaceUpIdx = i;
					break;
				}
			}
			
			if (firstFaceUpIdx === -1) continue;
			
			// Check each possible subsequence
			for (let cardIdx = firstFaceUpIdx; cardIdx < source.length; cardIdx++) {
				const cards = source.slice(cardIdx);
				const topCard = cards[0];
				
				// Check foundation (only single cards)
				if (cards.length === 1) {
					for (let foundIdx = 0; foundIdx < 4; foundIdx++) {
						if (this.canMoveToFoundation(topCard, foundIdx)) return true;
					}
				}
				
				// Check other tableau piles
				for (let targetIdx = 0; targetIdx < 7; targetIdx++) {
					if (targetIdx === sourceIdx) continue;
					if (this.canMoveToTableau(cards, targetIdx)) return true;
				}
			}
		}
		
		return false;
	}
	
	canAutoComplete() {
		// Determine if all remaining moves are guaranteed wins
		// (All face-down cards are flipped, only foundation moves remain)
		
		// Check if any tableau cards are face-down
		for (let i = 0; i < 7; i++) {
			for (const card of this.tableau[i]) {
				if (!card.faceUp) return false;
			}
		}
		
		// Check if stock has cards
		if (this.stock.length > 0) return false;
		
		// All cards are face-up and accessible - can auto-complete
		return true;
	}
	
	undo() {
		// Revert last move from history
		if (this.moveHistory.length === 0) return false;
		
		const lastMove = this.moveHistory.pop();
		
		// Restore previous state based on move type
		switch (lastMove.type) {
			case 'move':
				// Move cards back from target to source
				const targetPile = this.getPile(lastMove.targetType, lastMove.targetIndex);
				const cards = targetPile.splice(-lastMove.count, lastMove.count);
				this.getPile(lastMove.sourceType, lastMove.sourceIndex).push(...cards);
				
				// If target foundation is now empty, clear its suit assignment
				if (lastMove.targetType === 'foundation' && targetPile.length === 0) {
					this.foundationSuits[lastMove.targetIndex] = null;
				}
				
				// If a card was flipped face-up during the original move, flip it back face-down
				if (lastMove.flippedCard) {
					const sourcePile = this.getPile(lastMove.sourceType, lastMove.sourceIndex);
					// The card that was flipped is now at index (length - count - 1)
					const flippedCardIndex = sourcePile.length - lastMove.count - 1;
					if (flippedCardIndex >= 0 && flippedCardIndex < sourcePile.length) {
						sourcePile[flippedCardIndex].faceUp = false;
					}
				}
				break;
				
			case 'draw':
				// Move card back from waste to stock
				const drawnCard = this.waste.pop();
				if (drawnCard) {
					drawnCard.faceUp = false;
					this.stock.push(drawnCard);
				}
				break;
				
			case 'recycle':
				// Move all cards back from stock to waste
				while (this.stock.length > 0) {
					const card = this.stock.pop();
					card.faceUp = true;
					this.waste.push(card);
				}
				break;
		}
		
		return true;
	}
	
	getPile(type, index) {
		switch (type) {
			case 'tableau': return this.tableau[index];
			case 'foundation': return this.foundations[index];
			case 'stock': return this.stock;
			case 'waste': return this.waste;
			default: return [];
		}
	}
}
