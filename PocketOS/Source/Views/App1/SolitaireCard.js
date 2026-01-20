import View from '../../Core/View.js';

export default class SolitaireCard extends View {
	constructor({ suit, rank, faceUp = false, sheetKey = 'cards', isDebug = false }) {
		super();
		this.suit = suit;       // 0-3 (Spades, Hearts, Clubs, Diamonds)
		this.rank = rank;       // 0-12 (Ace, 2-10, Jack, Queen, King)
		this.faceUp = faceUp;
		this.sheetKey = sheetKey;
		this.isDebug = isDebug;
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
		this.highlighted = false;
		this.dragging = false;
		this.dragValid = true; // Track whether current drag preview is valid for coloring
		
		// Flip animation state
		this.isFlipping = false;
		this.flipProgress = 0; // 0 to 1
		this.flipDuration = 200; // ms
		this.flipStartTime = 0;
	}
	
	getCardIndex() {
		// Map card to sprite sheet index: rank + (suit * 13)
		return this.rank + (this.suit * 13);
	}
	
	getBackIndex() {
		// Card back sprite index (row 5, column 0)
		return 52; // Index of first card back
	}
	
	startFlip() {
		if (!this.isFlipping) {
			this.isFlipping = true;
			this.flipProgress = 0;
			this.flipStartTime = millis();
			this.flipStartFaceUp = this.faceUp; // Remember starting state
		}
	}
	
	draw({ spriteSheetSystem, x, y, width, height }) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		
		// Update flip animation
		if (this.isFlipping) {
			const elapsed = millis() - this.flipStartTime;
			this.flipProgress = Math.min(1, elapsed / this.flipDuration);
			if (this.flipProgress >= 1) {
				this.isFlipping = false;
				this.faceUp = !this.flipStartFaceUp; // Toggle to opposite of start state
			}
		}
		
		const index = this.faceUp ? this.getCardIndex() : this.getBackIndex();
		
		push();
		
		// Apply flip animation (scale X)
		if (this.isFlipping) {
			const centerX = x + width / 2;
			const centerY = y + height / 2;
			
			// Scale from 1 -> 0 -> 1 (horizontal squeeze)
			const scaleX = Math.abs(Math.cos(this.flipProgress * Math.PI));
			
			translate(centerX, centerY);
			scale(scaleX, 1);
			translate(-centerX, -centerY);
			
			// Switch face at halfway point
			const showFace = this.flipProgress > 0.5;
			const displayIndex = showFace !== this.flipStartFaceUp 
				? this.getCardIndex() 
				: this.getBackIndex();
			
			// Draw card sprite with flip transform
			spriteSheetSystem.drawTile({
				sheetKey: this.sheetKey,
				tileIndex: displayIndex,
				dx: x,
				dy: y,
				dw: width,
				dh: height
			});
		} else {
			// Normal draw without animation
			spriteSheetSystem.drawTile({
				sheetKey: this.sheetKey,
				tileIndex: index,
				dx: x,
				dy: y,
				dw: width,
				dh: height
			});
		}
		
		pop();
		
		// Subtle edge/shadow border for visual separation
		this.drawBorder();
		
		// Draw highlight/drag overlay
		if (this.highlighted || this.dragging) {
			this.drawOverlay();
		}
		
		// Debug text
		if (this.isDebug) {
			this.drawDebugText();
		}
	}
	
	drawOverlay() {
		push();
		noFill();
		strokeWeight(3);
		// Green for selection/valid drag, red when drag target is invalid (only for preview)
		let strokeColor = color(0, 204, 102);
		if (this.dragging && !this.highlighted) {
			strokeColor = this.dragValid ? color(0, 204, 102) : color(204, 0, 0);
		} else if (this.highlighted) {
			strokeColor = color(0, 204, 102);
		}
		stroke(strokeColor);
		rect(this.x, this.y, this.width, this.height, 4);
		pop();
	}

	// Draw a subtle outline to give cards a bit of edge/shadow
	drawBorder() {
		push();
		noFill();
		// Very subtle dark stroke as a soft shadow
		stroke(0, 0, 0, 50);
		strokeWeight(1.5);
		rect(this.x, this.y, this.width, this.height, 4);
		pop();
	}
	
	containsPoint(mx, my) {
		return mx >= this.x && mx <= this.x + this.width &&
		       my >= this.y && my <= this.y + this.height;
	}
	
	setHighlight(enabled) {
		this.highlighted = enabled;
	}
	
	setDragging(enabled) {
		this.dragging = enabled;
		if (!enabled) {
			this.dragValid = true;
		}
	}

	setDragValid(isValid) {
		this.dragValid = isValid;
	}
	
	// Helper methods for card properties
	getColor() {
		// Hearts(1) and Diamonds(3) are red; Spades(0) and Clubs(2) are black
		return (this.suit === 1 || this.suit === 3) ? 'red' : 'black';
	}
	
	isRed() {
		return this.suit === 1 || this.suit === 3;
	}
	
	isBlack() {
		return this.suit === 0 || this.suit === 2;
	}
	
	drawDebugText() {
		const suitNames = ['S', 'H', 'C', 'D']; // Spades, Hearts, Clubs, Diamonds
		const rankNames = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
		const label = `${rankNames[this.rank]}${suitNames[this.suit]}`;
		
		push();
		textAlign(CENTER, CENTER);
		textSize(Math.max(16, this.height * 0.12));
		strokeWeight(2.5);
		stroke(0);
		fill(255);
		text(label, this.x + this.width / 2, this.y + this.height / 2);
		pop();
	}
}
