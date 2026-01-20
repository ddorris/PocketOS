import View from '../../Core/View.js';
import SolitaireCard from './SolitaireCard.js';

export default class SolitairePile extends View {
	constructor({ type, pileIndex = 0, cards = [] }) {
		super();
		this.type = type; // 'tableau' | 'foundation' | 'stock' | 'waste'
		this.pileIndex = pileIndex; // Index within its type
		this.cards = cards; // Array of SolitaireCard view objects
		this.x = 0;
		this.y = 0;
		this.cardWidth = 0;
		this.cardHeight = 0;
		this.cascadeOffset = 25; // Vertical offset for tableau cascade
	}
	
	calculateCardPositions() {
		// Calculate positions based on pile type
		const positions = [];
		
		if (this.type === 'tableau') {
			// Cascade vertically
			this.cards.forEach((card, i) => {
				positions.push({
					x: this.x,
					y: this.y + (i * this.cascadeOffset),
					card
				});
			});
		} else {
			// Stack (only show top card)
			if (this.cards.length > 0) {
				positions.push({
					x: this.x,
					y: this.y,
					card: this.cards[this.cards.length - 1]
				});
			}
		}
		
		return positions;
	}
	
	draw({ spriteSheetSystem, cardWidth, cardHeight }) {
		this.cardWidth = cardWidth;
		this.cardHeight = cardHeight;
		
		if (this.cards.length === 0) {
			this.drawEmptySlot();
			return;
		}
		
		const positions = this.calculateCardPositions();
		
		positions.forEach(({ x, y, card }) => {
			card.draw({
				spriteSheetSystem,
				x,
				y,
				width: cardWidth,
				height: cardHeight
			});
		});
	}
	
	drawEmptySlot() {
		push();
		noFill();
		stroke(100, 100, 100, 100);
		strokeWeight(2);
		strokeJoin(ROUND);
		rect(this.x, this.y, this.cardWidth, this.cardHeight, 4);
		
		// Draw pile type indicator for foundations
		if (this.type === 'foundation') {
			fill(150, 150, 150, 80);
			noStroke();
			textAlign(CENTER, CENTER);
			textSize(32);
			// Always show an Ace placeholder for empty foundations
			text('A', 
			     this.x + this.cardWidth / 2, 
			     this.y + this.cardHeight / 2);
		}
		pop();
	}
	
	hitTest(mx, my) {
		// Return card and index under cursor
		if (this.type === 'tableau') {
			const positions = this.calculateCardPositions();
			// Check from bottom to top (reverse order for proper z-index)
			// This allows selecting any face-up card in the cascade
			for (let i = positions.length - 1; i >= 0; i--) {
				const { card, x, y } = positions[i];
				// Only face-up cards are selectable
				if (card.faceUp && 
				    mx >= x && mx <= x + this.cardWidth &&
				    my >= y && my <= y + this.cardHeight) {
					// Return all cards from this point to the end (the sequence)
					return { card, cardIndex: i, cardCount: positions.length - i };
				}
			}
		} else {
			// For other piles, only top card is interactive
			const topCard = this.getTopCard();
			if (topCard && topCard.faceUp) {
				if (mx >= this.x && mx <= this.x + this.cardWidth &&
				    my >= this.y && my <= this.y + this.cardHeight) {
					return { card: topCard, cardIndex: this.cards.length - 1, cardCount: 1 };
				}
			}
		}
		
		return null;
	}
	
	getTopCard() {
		return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
	}
	
	addCard(card) {
		this.cards.push(card);
	}
	
	addCards(cards) {
		this.cards.push(...cards);
	}
	
	removeCards(count) {
		return this.cards.splice(this.cards.length - count, count);
	}
	
	// Check if pile contains point (for drop targeting)
	containsPoint(mx, my) {
		if (this.type === 'tableau' && this.cards.length > 0) {
			// For tableau, include the full cascade area (top card position)
			const topCardY = this.y + (this.cards.length - 1) * this.cascadeOffset;
			return mx >= this.x && mx <= this.x + this.cardWidth &&
			       my >= this.y && my <= topCardY + this.cardHeight;
		} else {
			// For other piles, just the card slot area
			return mx >= this.x && mx <= this.x + this.cardWidth &&
			       my >= this.y && my <= this.y + this.cardHeight;
		}
	}
}
