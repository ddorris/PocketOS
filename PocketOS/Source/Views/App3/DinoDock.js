// DinoDock - Manages clicked DinoTile instances and tracks game state
import View from '../../Core/View.js';
import DinoTile from './DinoTile.js';

export default class DinoDock extends View {
	constructor() {
		super();
		this.maxDockTiles = 8;
		this.tiles = []; // Array of DinoTile instances
		this.gameState = 'playing'; // 'playing', 'won', 'lost'
		this.dockHeight = 80;
		this.dockY = 0; // Will be set in windowResized or based on height
		this.padding = 10;
		this.slotWidth = 34;
		this.slotHeight = 44;
		this.tileSpacing = 40;
		this.spriteSheetSystem = null;
	}

	setSpriteSheetSystem(system) {
		this.spriteSheetSystem = system;
	}

	updateLayout(screenWidth, screenHeight) {
		this.dockY = screenHeight - this.dockHeight;
		this.layoutTiles();
	}

	addTile(dinoTile) {
		if (this.gameState !== 'playing') return false;

		// Create a new tile for the dock with fixed slot dimensions
		const dockTile = new DinoTile({
			sheetKey: dinoTile.sheetKey,
			tileIndex: dinoTile.tileIndex,
			dx: 0, // Will be positioned during layout
			dy: this.dockY,
			dw: this.slotWidth,
			dh: this.slotHeight
		});

		this.tiles.push(dockTile);
		this.layoutTiles();
		this.checkForMatches();

		// Check if dock is full after checking for matches
		if (this.tiles.length >= this.maxDockTiles) {
			this.gameState = 'lost';
			return false;
		}

		return true;
	}

	checkForMatches() {
		let foundMatch = true;
		while (foundMatch) {
			foundMatch = false;
			// Count frequency of each tileIndex
			const tileFreq = {};
			for (const tile of this.tiles) {
				tileFreq[tile.tileIndex] = (tileFreq[tile.tileIndex] || 0) + 1;
			}

			// Find first tileIndex with 3 or more occurrences
			for (const tileIndex in tileFreq) {
				if (tileFreq[tileIndex] >= 3) {
					// Remove 3 tiles with this index (any 3)
					let removed = 0;
					for (let i = this.tiles.length - 1; i >= 0 && removed < 3; i--) {
						if (this.tiles[i].tileIndex === parseInt(tileIndex)) {
							this.tiles.splice(i, 1);
							removed++;
						}
					}
					this.layoutTiles();
					foundMatch = true;
					break;
				}
			}
		}
		// Note: Win state is checked by App3 when both board and dock are empty
	}

	layoutTiles() {
		for (let i = 0; i < this.tiles.length; i++) {
			const tile = this.tiles[i];
			tile.dx = this.padding + i * this.tileSpacing;
			tile.dy = this.dockY + (this.dockHeight - this.slotHeight) / 2;
		}
	}

	draw(spriteSheetSystem) {
		if (!spriteSheetSystem) return;

		// Draw dock background
		noStroke();
		// dfb37d
		fill(0xDF, 0xB3, 0x7D);
		rect(0, this.dockY, width, this.dockHeight);
		// f6ddb9
		stroke(0xF6, 0xDD, 0xB9);
		strokeWeight(1);
		line(0, this.dockY, width, this.dockY);
		line(0, this.dockY + this.dockHeight - 1, width, this.dockY + this.dockHeight - 1);

		// Draw empty tile slots to show max capacity
		this.drawEmptySlots();

		// Draw tiles
		for (const tile of this.tiles) {
			tile.display(spriteSheetSystem);
		}

		// Draw game state overlay if won or lost
		if (this.gameState === 'won') {
			// 618b4b
			this.drawOverlay('YOU WIN!', color(97, 139, 75), color(56, 69, 44));
		} else if (this.gameState === 'lost') {
			// color2 is 880928
			this.drawOverlay('GAME OVER', color(200, 0, 0), color(136, 9, 40));
		}
	}

	drawEmptySlots() {
		push();
		const inset = 4;
		for (let i = 0; i < this.maxDockTiles; i++) {
			const x = this.padding + i * this.tileSpacing;
			const y = this.dockY + (this.dockHeight - this.slotHeight) / 2;

			// Draw empty slot outline
			noFill();
			stroke(0xEF, 0xD0, 0xA4);
			strokeWeight(2);
			rect(x + inset, y + inset, this.slotWidth - inset * 2, this.slotHeight - inset * 2, 3);
		}
		pop();
	}

	drawOverlay(overlayText, overlayColor, overlayColor2) {
		push();
		noStroke();
		fill(overlayColor);
		rect(0, this.dockY + 1, width, this.dockHeight);
		// Draw text on top with stroke for visibility
		fill(255);
		stroke(overlayColor2);
		strokeWeight(6);
		strokeJoin(ROUND);
		textAlign(CENTER, CENTER);
		textSize(32);
		text(overlayText, 0, this.dockY, width, this.dockHeight);
		pop();
	}

	reset() {
		this.tiles = [];
		this.gameState = 'playing';
		this.updateLayout(typeof width !== 'undefined' ? width : 0, typeof height !== 'undefined' ? height : 0);
	}

	isGameOver() {
		return this.gameState === 'won' || this.gameState === 'lost';
	}

	getTileCount() {
		return this.tiles.length;
	}

	updateGameState(isBoardWon) {
		if (this.gameState !== 'playing') return;

		// Win if board is empty and dock is empty
		if (isBoardWon && this.tiles.length === 0) {
			this.gameState = 'won';
		}
	}
}
