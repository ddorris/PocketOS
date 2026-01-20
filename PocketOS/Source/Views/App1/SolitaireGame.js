import View from '../../Core/View.js';
import SolitairePile from './SolitairePile.js';
import SolitaireCard from './SolitaireCard.js';
import Button from '../Button.js';

export default class SolitaireGame extends View {
	constructor({ model, spriteSheetSystem, isEnabled, isDebug = false, appDockHeight = 120 }) {
		super();
		this.model = model;
		this.spriteSheetSystem = spriteSheetSystem;
		this.isEnabled = isEnabled || (() => true);
		this.isDebug = isDebug;
		
		// Layout constants
		this.appDockHeight = appDockHeight;
		this.padding = 8;
		this.cardGap = 3;
		this.cardWidth = 71;
		this.cardHeight = 96;
		this.topPadding = 30;        // Extra space at top before foundation/stock row
		this.tableauTopPadding = 15; // Extra space before tableau piles
		this.bottomBarHeight = 70;   // Height of bottom button bar
		this.bottomBarColor = '#1e6b1e'; // Darker green for bottom bar
		this.bottomBarY = 0;         // Will be set in calculateLayout
		
		// Piles (view representations)
		this.tableau = [];      // 7 tableau piles
		this.foundations = [];  // 4 foundation piles
		this.stock = null;      // Stock pile
		this.waste = null;      // Waste pile
		
		// Drag state
		this.dragSource = null; // { pile, pileType, pileIndex, cards, cardIndex, startX, startY }
		this.dragOffset = { x: 0, y: 0 };
		this.dragCurrentPos = { x: 0, y: 0 };
		this.hoverTarget = null; // Currently hovered pile during drag
		this.selectedCards = []; // Cards highlighted at their origin while dragging
		// Optional override for tableau cascade spacing; if null, uses pile or responsive default
		this.tableauCascadeOffset = 25;
		
		// Double-click detection
		this.lastClickTime = 0;
		this.lastClickCard = null;
		this.doubleClickDelay = 300; // ms
		
		// Auto-complete state
		this.isAutoCompleting = false;
		this.autoCompleteDelay = 150; // ms between moves
		this.lastAutoMoveTime = 0;
		
		// UI Controls
		this.newGameButton = null;
		this.undoButton = null;
		
		this.createButtons();
		this.syncPilesWithModel();
	}
	
	createButtons() {
		this.newGameButton = new Button({
			label: 'Reset',
			x: 0,
			y: 0,
			width: 80,
			height: 40,
			bgColor: '#4caf50',      // Lighter green
			hoverColor: '#66bb6a',   // Even lighter green on hover
			textColor: '#ffffff',
			strokeColor: '#2e7d32',  // Darker green border
			fontSize: 14,
			onClick: () => this.newGame()
		});
		
		this.undoButton = new Button({
			label: 'Undo',
			x: 0,
			y: 0,
			width: 70,
			height: 40,
			bgColor: '#4caf50',      // Lighter green
			hoverColor: '#66bb6a',   // Even lighter green on hover
			textColor: '#ffffff',
			strokeColor: '#2e7d32',  // Darker green border
			fontSize: 14,
			onClick: () => this.undo()
		});
		
		this.autoCompleteButton = new Button({
			label: 'Auto',
			x: 0,
			y: 0,
			width: 70,
			height: 40,
			bgColor: '#4caf50',      // Lighter green
			hoverColor: '#66bb6a',   // Even lighter green on hover
			textColor: '#ffffff',
			strokeColor: '#2e7d32',  // Darker green border
			fontSize: 14,
			onClick: () => this.startAutoComplete()
		});
	}
	
	syncPilesWithModel() {
		// Create view pile objects from model state
		// Preserve existing card view instances to maintain animation state
		
		// Create a map of existing cards by suit+rank for reuse
		const existingCards = new Map();
		const allPiles = [...this.tableau, ...this.foundations, this.stock, this.waste];
		for (const pile of allPiles) {
			if (pile && pile.cards) {
				for (const card of pile.cards) {
					const key = `${card.suit}-${card.rank}`;
					existingCards.set(key, card);
				}
			}
		}
		
		// Tableau piles
		this.tableau = this.model.tableau.map((cards, i) => {
			const cardViews = cards.map((c, idx) => {
				const key = `${c.suit}-${c.rank}`;
				let cardView = existingCards.get(key);
				
				if (cardView) {
					// Reuse existing card, check if it just flipped
					if (c.faceUp && !cardView.faceUp && !cardView.isFlipping) {
						cardView.startFlip();
					}
					cardView.faceUp = c.faceUp;
				} else {
					// Create new card - if it should be face up, start it face down and flip
					if (c.faceUp) {
						cardView = new SolitaireCard({ ...c, faceUp: false, isDebug: this.isDebug });
						cardView.startFlip();
					} else {
						cardView = new SolitaireCard({ ...c, isDebug: this.isDebug });
					}
				}
				
				return cardView;
			});
			return new SolitairePile({
				type: 'tableau',
				pileIndex: i,
				cards: cardViews
			});
		});
		
		// Foundation piles
		this.foundations = this.model.foundations.map((cards, i) => {
			const cardViews = cards.map(c => {
				const key = `${c.suit}-${c.rank}`;
				let cardView = existingCards.get(key);
				if (!cardView) {
					cardView = new SolitaireCard({ ...c, isDebug: this.isDebug });
				}
				cardView.faceUp = c.faceUp;
				return cardView;
			});
			return new SolitairePile({
				type: 'foundation',
				pileIndex: i,
				cards: cardViews
			});
		});
		
		// Stock
		const stockCards = this.model.stock.map(c => new SolitaireCard({ ...c, isDebug: this.isDebug }));
		this.stock = new SolitairePile({
			type: 'stock',
			pileIndex: 0,
			cards: stockCards
		});
		
		// Waste
		const wasteCards = this.model.waste.map(c => new SolitaireCard({ ...c, isDebug: this.isDebug }));
		this.waste = new SolitairePile({
			type: 'waste',
			pileIndex: 0,
			cards: wasteCards
		});
	}
	
	calculateLayout() {
		const w = width;
		const h = height - this.appDockHeight;
		
		// Calculate card size to fit tableau (7 cards) with gaps
		const availableWidth = w - (this.padding * 2);
		const maxCardWidth = (availableWidth - (this.cardGap * 6)) / 7;
		
		// Constrain card size to reasonable bounds (increased max to 100)
		this.cardWidth = Math.min(100, Math.max(45, maxCardWidth));
		this.cardHeight = this.cardWidth * (96 / 71); // Match sprite aspect ratio (71x96 classic Windows Solitaire)
		
		// Calculate total tableau width
		const tableauWidth = this.cardWidth * 7 + this.cardGap * 6;
		const tableauStartX = (w - tableauWidth) / 2; // Center tableau
		
		// Top row Y position (with extra space at top)
		const topRowY = this.appDockHeight + this.topPadding;
		
		// Foundation piles (top left, aligned with tableau)
		this.foundations.forEach((pile, i) => {
			pile.x = tableauStartX + i * (this.cardWidth + this.cardGap);
			pile.y = topRowY;
			pile.cascadeOffset = 0; // No cascade for foundation (stack)
		});
		
		// Stock and Waste (top right of centered layout)
		const stockStartX = tableauStartX + tableauWidth - (this.cardWidth * 2 + this.cardGap);
		this.waste.x = stockStartX;
		this.waste.y = topRowY;
		this.waste.cascadeOffset = 0; // No cascade for waste (only one card visible)
		this.stock.x = stockStartX + this.cardWidth + this.cardGap;
		this.stock.y = topRowY;
		this.stock.cascadeOffset = 0; // No cascade for stock
		
		// Tableau row (below stock/foundation row, centered, with extra space)
		const tableauY = topRowY + this.cardHeight + this.padding + this.tableauTopPadding;
		const defaultCascade = Math.min(20, this.cardHeight * 0.2); // Responsive cascade spacing
		this.tableau.forEach((pile, i) => {
			pile.x = tableauStartX + i * (this.cardWidth + this.cardGap);
			pile.y = tableauY;
			// Respect explicit game-level override first, then existing pile setting, else responsive default
			pile.cascadeOffset = (this.tableauCascadeOffset ?? pile.cascadeOffset ?? defaultCascade);
		});
		
		// Bottom bar and buttons (centered in bottom bar)
		this.bottomBarY = h - this.bottomBarHeight + this.appDockHeight;
		const buttonY = this.bottomBarY + (this.bottomBarHeight - this.newGameButton.height) / 2;
		const totalButtonWidth = this.newGameButton.width + 10 + this.undoButton.width;
		const buttonsStartX = (w - totalButtonWidth) / 2;
		
		this.newGameButton.x = buttonsStartX;
		this.newGameButton.y = buttonY;
		this.undoButton.x = buttonsStartX + this.newGameButton.width + 10;
		this.undoButton.y = buttonY;
		this.autoCompleteButton.x = buttonsStartX + this.newGameButton.width + 10 + this.undoButton.width + 10;
		this.autoCompleteButton.y = buttonY;
	}
	
	draw() {
		if (!this.isEnabled()) return;
		
		// Background (classic solitaire green felt)
		push();
		noStroke();
		fill(34, 139, 34); // Hex #228B22
		rect(0, this.appDockHeight, width, height - this.appDockHeight);
		pop();
		
		this.calculateLayout();
		
		// Draw config for all piles
		const drawConfig = {
			spriteSheetSystem: this.spriteSheetSystem,
			cardWidth: this.cardWidth,
			cardHeight: this.cardHeight
		};
		
		// Draw piles (highlight hover target)
		this.tableau.forEach((pile, i) => {
			if (this.dragSource && this.hoverTarget?.pile === pile) {
				this.drawPileHighlight(pile, this.hoverTarget.valid);
			}
			pile.draw(drawConfig);
		});
		this.foundations.forEach((pile, i) => {
			if (this.dragSource && this.hoverTarget?.pile === pile) {
				this.drawPileHighlight(pile, this.hoverTarget.valid);
			}
			pile.draw(drawConfig);
		});
		this.stock.draw(drawConfig);
		this.waste.draw(drawConfig);
		
		// Draw drag preview on top
		if (this.dragSource) {
			this.drawDragPreview();
		}
		
		// Draw bottom bar
		push();
		noStroke();
		fill(this.bottomBarColor);
		rect(0, this.bottomBarY, width, this.bottomBarHeight);
		pop();
		
		// Draw buttons (only Reset button on victory screen)
		if (this.model.isGameWon()) {
			this.newGameButton.draw();
		} else {
			this.newGameButton.draw();
			this.undoButton.draw();
		}
		
		// Check for win condition
		if (this.model.isGameWon()) {
			this.drawVictoryMessage();
		} else if (!this.model.hasValidMoves() && !this.model.canAutoComplete()) {
			this.drawDeadEndMessage();
		}
	}
	
	drawDragPreview() {
		const { cards } = this.dragSource;
		const { x, y } = this.dragCurrentPos;
		
		push();
		// Semi-transparent cards being dragged
			cards.forEach((card, i) => {
				const offsetY = i * Math.min(25, this.cardHeight * 0.25);
				// Draw with slight transparency
				const wasHighlighted = card.highlighted;
				card.setHighlight(false); // Let preview color reflect drag validity instead of selection highlight
				tint(255, 220);
				card.draw({
					spriteSheetSystem: this.spriteSheetSystem,
					x: x,
					y: y + offsetY,
					width: this.cardWidth,
					height: this.cardHeight
				});
				card.setHighlight(wasHighlighted);
			});
		noTint();
		pop();
	}
	
	drawVictoryMessage() {
		push();
		// Semi-transparent overlay (don't cover bottom bar)
		const overlayHeight = this.bottomBarY - this.appDockHeight;
		fill(0, 0, 0, 150);
		rect(0, this.appDockHeight, width, overlayHeight);
		
		fill(255, 215, 0);
		textAlign(CENTER, CENTER);
		textSize(48);
		textStyle(BOLD);
		text('YOU WIN!', width / 2, height / 2 - 60);
		
		textSize(24);
		textStyle(NORMAL);
		fill(255);
		text('Click "Reset" to play again', width / 2, height / 2);
		
		pop();
	}
	
	drawDeadEndMessage() {
		push();
		// Semi-transparent overlay (don't cover bottom bar)
		const overlayHeight = this.bottomBarY - this.appDockHeight;
		fill(0, 0, 0, 150);
		rect(0, this.appDockHeight, width, overlayHeight);
		
		fill(204, 85, 0); // Orange color for stuck state
		textAlign(CENTER, CENTER);
		textSize(36);
		textStyle(BOLD);
		text('No Valid Moves!', width / 2, height / 2 - 60);
		
		textSize(20);
		textStyle(NORMAL);
		fill(255);
		text('Try using Undo or Reset', width / 2, height / 2);
		
		pop();
	}
	
	drawPileHighlight(pile, isValid) {
		push();
		noFill();
		strokeWeight(3);
		stroke(isValid ? color(0, 204, 102) : color(204, 0, 0));
		
		// For tableau piles, highlight includes the full cascade area
		if (pile.type === 'tableau' && pile.cards.length > 0) {
			const topCardY = pile.y + (pile.cards.length - 1) * pile.cascadeOffset;
			const highlightHeight = topCardY + this.cardHeight - pile.y;
			rect(pile.x - 2, pile.y - 2, this.cardWidth + 4, highlightHeight + 4, 6);
		} else {
			// For other piles, just the card slot
			rect(pile.x - 2, pile.y - 2, this.cardWidth + 4, this.cardHeight + 4, 6);
		}
		
		pop();
	}

	setSelectedCards(cards) {
		this.clearSelectedCards();
		this.selectedCards = cards;
		this.selectedCards.forEach(c => c.setHighlight(true));
	}

	clearSelectedCards() {
		if (this.selectedCards && this.selectedCards.length > 0) {
			this.selectedCards.forEach(c => c.setHighlight(false));
		}
		this.selectedCards = [];
	}

	updateDragPreviewValidity(isValid) {
		if (this.dragSource && this.dragSource.cards) {
			this.dragSource.cards.forEach(c => c.setDragValid(isValid));
		}
	}
	
	mousePressed(mx, my) {
		if (!this.isEnabled()) return false;
		
		// Check buttons first
		if (this.newGameButton.checkClick(mx, my)) { this.clearSelectedCards(); return true; }
		if (this.undoButton.checkClick(mx, my)) { this.clearSelectedCards(); return true; }
		if (this.model.canAutoComplete() && !this.model.isGameWon() && this.autoCompleteButton.checkClick(mx, my)) { this.clearSelectedCards(); return true; }
		
		// Check stock click - draw card (don't auto-play yet)
		if (this.stock.containsPoint(mx, my)) {
			this.handleStockClick(false); // Don't auto-play on press
			this.clearSelectedCards();
			return true;
		}
		
		// Track the card pressed for potential auto-play on release
		const hitInfo = this.findCardUnderCursor(mx, my);
		this.pressedHit = hitInfo;
		this.pressedCard = hitInfo ? hitInfo.card : null;
		this.pressedPos = { x: mx, y: my };
		
		if (hitInfo) {
			const count = hitInfo.cardCount || 1;
			this.setSelectedCards(hitInfo.pile.cards.slice(hitInfo.cardIndex, hitInfo.cardIndex + count));
			return true;
		}
		
		this.clearSelectedCards();
		return false;
	}
	
	mouseDragged(mx, my) {
		if (!this.isEnabled()) return false;
		
		// Start drag on first movement (if we have a pressed card)
		if (this.pressedCard && !this.dragSource) {
			this.startDrag(mx, my);
		}
		
		if (this.dragSource) {
			this.dragCurrentPos = {
				x: mx - this.dragOffset.x,
				y: my - this.dragOffset.y
			};
			
			// Update hover target for visual feedback
			const targetInfo = this.findPileUnderCursor(mx, my);
			if (targetInfo && targetInfo.pile !== this.dragSource.pile) {
				const { type: targetType, index: targetIndex } = targetInfo;
				const cards = this.dragSource.cards;
				let isValid = false;
				
				if (targetType === 'tableau') {
					isValid = this.model.canMoveToTableau(cards.map(c => ({ suit: c.suit, rank: c.rank })), targetIndex);
				} else if (targetType === 'foundation' && cards.length === 1) {
					isValid = this.model.canMoveToFoundation({ suit: cards[0].suit, rank: cards[0].rank }, targetIndex);
				}
				
				this.hoverTarget = { ...targetInfo, valid: isValid };
				this.updateDragPreviewValidity(isValid);
			} else {
				this.hoverTarget = null;
				this.updateDragPreviewValidity(false);
			}
			
			return true;
		}
		return false;
	}
	
	mouseReleased(mx, my) {
		if (!this.isEnabled()) return false;
		
		// If dragging, complete the drag
		if (this.dragSource) {
			this.completeDrag(mx, my);
			this.hoverTarget = null;
			this.pressedCard = null;
			return true;
		}
		
		// If released without dragging, try auto-play
		// Only if we pressed on a card and didn't move far
		if (this.pressedCard && !this.dragSource) {
			const dragDistance = Math.hypot(
				mx - this.pressedPos.x,
				my - this.pressedPos.y
			);
			
			// If user barely moved (within 15 pixels), consider it a click and try auto-play
			if (dragDistance < 15) {
				const wasMoved = this.tryAutoPlay(this.pressedHit);
				this.pressedCard = null;
				this.clearSelectedCards();
				this.pressedHit = null;
				return wasMoved;
			}
		}
		
		this.pressedCard = null;
		this.pressedHit = null;
		this.clearSelectedCards();
		return false;
	}
	
	startDrag(mx, my) {
		// Check all piles for hit (waste, tableau, and foundations can be dragged)
		const draggablePiles = [
			{ pile: this.waste, type: 'waste', index: 0 },
			...this.tableau.map((pile, i) => ({ pile, type: 'tableau', index: i })),
			...this.foundations.map((pile, i) => ({ pile, type: 'foundation', index: i }))
		];
		
		for (const { pile, type, index } of draggablePiles) {
			const hit = pile.hitTest(mx, my);
			if (hit) {
				const { card, cardIndex, cardCount } = hit;
				
				// Get cards to drag (cardCount cards from cardIndex)
				const cardCountToDrag = cardCount || 1;
				const cards = pile.cards.slice(cardIndex, cardIndex + cardCountToDrag);
				
				// Mark cards as dragging
				cards.forEach(c => c.setDragging(true));
				
				this.dragSource = {
					pile,
					pileType: type,
					pileIndex: index,
					cards,
					cardIndex,
					startX: pile.x,
					startY: pile.y + (cardIndex * pile.cascadeOffset)
				};
				
				this.dragOffset = {
					x: mx - this.dragSource.startX,
					y: my - this.dragSource.startY
				};
				
				this.dragCurrentPos = { 
					x: this.dragSource.startX, 
					y: this.dragSource.startY 
				};
				this.updateDragPreviewValidity(false);
				
				break;
			}
		}
	}
	
	completeDrag(mx, my) {
		const { pile: sourcePile, pileType: sourceType, pileIndex: sourceIndex, cards, cardIndex } = this.dragSource;
		
		// Find target pile under cursor
		const targetInfo = this.findPileUnderCursor(mx, my);
		
		let moveSuccess = false;
		
		if (targetInfo && targetInfo.pile !== sourcePile) {
			const { pile: targetPile, type: targetType, index: targetIndex } = targetInfo;
			
			// Validate move with model
			if (targetType === 'tableau') {
				if (this.model.canMoveToTableau(cards.map(c => ({ suit: c.suit, rank: c.rank })), targetIndex)) {
					// Execute move in model
					this.model.moveCards(sourceType, sourceIndex, targetType, targetIndex, cards.length);
					moveSuccess = true;
				}
			} else if (targetType === 'foundation' && cards.length === 1) {
				const card = cards[0];
				if (this.model.canMoveToFoundation({ suit: card.suit, rank: card.rank }, targetIndex)) {
					// Execute move in model
					this.model.moveCards(sourceType, sourceIndex, targetType, targetIndex, 1);
					moveSuccess = true;
				}
			}
		}
		
		if (moveSuccess) {
			// Re-sync view with model
			this.syncPilesWithModel();
		}
		
		// Clear drag state
		cards.forEach(c => c.setDragging(false));
		this.clearSelectedCards();
		this.pressedHit = null;
		this.pressedCard = null;
		this.dragSource = null;
	}
	
	findPileUnderCursor(mx, my) {
		// Check tableau piles
		for (let i = 0; i < this.tableau.length; i++) {
			if (this.tableau[i].containsPoint(mx, my)) {
				return { pile: this.tableau[i], type: 'tableau', index: i };
			}
		}
		
		// Check foundation piles
		for (let i = 0; i < this.foundations.length; i++) {
			if (this.foundations[i].containsPoint(mx, my)) {
				return { pile: this.foundations[i], type: 'foundation', index: i };
			}
		}
		
		return null;
	}
	
	newGame() {
		// Clear existing piles to force all cards to be recreated with flip animations
		this.tableau = [];
		this.foundations = [];
		this.stock = null;
		this.waste = null;
		
		this.model.initializeGame();
		this.syncPilesWithModel();
	}
	
	undo() {
		this.model.undo();
		this.syncPilesWithModel();
	}
	
	findCardUnderCursor(mx, my) {
		// Check waste, tableau, and foundation piles for card under cursor
		const draggablePiles = [
			{ pile: this.waste, type: 'waste', index: 0 },
			...this.tableau.map((pile, i) => ({ pile, type: 'tableau', index: i })),
			...this.foundations.map((pile, i) => ({ pile, type: 'foundation', index: i }))
		];
		
		for (const { pile, type, index } of draggablePiles) {
			const hit = pile.hitTest(mx, my);
			if (hit) {
				return { card: hit.card, pile, type, index, cardIndex: hit.cardIndex, cardCount: hit.cardCount };
			}
		}
		return null;
	}
	
	startAutoComplete() {
		if (this.model.canAutoComplete() && !this.isAutoCompleting) {
			this.isAutoCompleting = true;
			this.lastAutoMoveTime = millis();
		}
	}
	
	processAutoComplete() {
		// Automatically move all remaining cards to foundations
		const now = millis();
		
		if (now - this.lastAutoMoveTime < this.autoCompleteDelay) {
			return; // Wait for delay
		}
		
		// Try to find a card that can move to foundation
		let moveMade = false;
		
		// Check waste pile first
		if (this.model.waste.length > 0) {
			const card = this.model.waste[this.model.waste.length - 1];
			if (this.model.canMoveToFoundation(card, card.suit)) {
				this.model.moveCards('waste', 0, 'foundation', card.suit, 1);
				this.syncPilesWithModel();
				this.lastAutoMoveTime = now;
				moveMade = true;
			}
		}
		
		// Check tableau piles
		if (!moveMade) {
			for (let i = 0; i < 7; i++) {
				if (this.model.tableau[i].length > 0) {
					const card = this.model.tableau[i][this.model.tableau[i].length - 1];
					if (card.faceUp && this.model.canMoveToFoundation(card, card.suit)) {
						this.model.moveCards('tableau', i, 'foundation', card.suit, 1);
						this.syncPilesWithModel();
						this.lastAutoMoveTime = now;
						moveMade = true;
						break;
					}
				}
			}
		}
		
		// Stop auto-complete if no more moves or game won
		if (!moveMade || this.model.isGameWon()) {
			this.isAutoCompleting = false;
		}
	}
	
	tryAutoPlay(clickedCard) {
		// Try to auto-play a card: foundation first, then valid tableau pile (rightmost)
		if (!clickedCard || !clickedCard.card || !clickedCard.pile) return false;
		const card = clickedCard.card;
		
		// Only top cards can auto-play
		const pile = clickedCard.pile;
		if (pile.cards.length === 0 || pile.cards[pile.cards.length - 1] !== card) {
			return false; // Not the top card
		}
		
		// Try foundations - check all foundations (they're not pre-assigned to suits)
		// For Aces, use first available foundation from left
		if (card.rank === 0) {
			// Find first empty foundation
			for (let i = 0; i < 4; i++) {
				if (this.model.foundations[i].length === 0) {
					this.model.moveCards(clickedCard.type, clickedCard.index, 'foundation', i, 1);
					this.syncPilesWithModel();
					return true;
				}
			}
		} else {
			// For non-Aces, try to find matching foundation
			for (let i = 0; i < 4; i++) {
				if (this.model.canMoveToFoundation(card, i)) {
					this.model.moveCards(clickedCard.type, clickedCard.index, 'foundation', i, 1);
					this.syncPilesWithModel();
					return true;
				}
			}
		}
		
		// Try tableau piles (for waste or tableau cards)
		// Try from rightmost to leftmost to prefer right piles
		for (let i = 6; i >= 0; i--) {
			if (clickedCard.type === 'tableau' && i === clickedCard.index) {
				continue; // Skip source pile
			}
			if (this.model.canMoveToTableau([card], i)) {
				this.model.moveCards(clickedCard.type, clickedCard.index, 'tableau', i, 1);
				this.syncPilesWithModel();
				return true;
			}
		}
		
		return false; // No valid auto-play found
	}
	
	handleStockClick(shouldAutoPlay = true) {
		// Draw card from stock and optionally attempt auto-play
		if (this.model.canDrawFromStock()) {
			this.model.drawFromStock();
			this.syncPilesWithModel();
			
			// Auto-play the drawn card if enabled
			if (shouldAutoPlay && this.model.waste.length > 0) {
				const drawnCard = this.model.waste[this.model.waste.length - 1];
				const wasteInfo = {
					card: drawnCard,
					pile: this.waste,
					type: 'waste',
					index: 0,
					cardIndex: this.model.waste.length - 1
				};
				this.tryAutoPlay(wasteInfo);
			}
		} else if (this.model.waste.length > 0) {
			// Recycle waste
			this.model.recycleWaste();
			this.syncPilesWithModel();
		}
	}
}
