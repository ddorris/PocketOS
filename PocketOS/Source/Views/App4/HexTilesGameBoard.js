import HexTile from './HexTile.js';
import Hexagon from './Hexagon.js';
import { HEX_DIRECTIONS } from '../../Models/HexTilesModel.js';

export default class HexTilesGameBoard {
	constructor(model, isDebug = false) {
		this.originX = 0;
		this.originY = 0;
		this.radius = 30;
		this.paddingRatio = 0.01;
		this.cornerRadiusRatio = 0.2;
		this.slots = [];
		this.model = model;
		this._fitCache = null;
		this.backgroundHexagon = null;
		this.appDockHeight = 120; // for layout, matches App4
		this.isDebug = isDebug;

		// Build slots for the model's gridRadius
		this.setLayout({});
	}

	setLayout({ originX, originY, radius, paddingRatio }) {
		if (originX !== undefined) this.originX = originX;
		if (originY !== undefined) this.originY = originY;
		if (radius !== undefined) this.radius = radius;
		if (paddingRatio !== undefined) this.paddingRatio = paddingRatio;
		this.buildSlots();
	}

	axialToPixel(q, r) {
		// padding expands the spacing multiplier, creating gaps between tiles
		const padding = this.radius * this.paddingRatio;
		const spacingRadius = this.radius + padding;
		const x = this.originX + spacingRadius * (1.5 * q);
		const y = this.originY + spacingRadius * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
		return { x, y };
	}

	getStrokeWeight() {
		// Scale stroke weight with radius using paddingRatio for consistency
		return Math.max(1, this.radius * this.paddingRatio * 0.25);
	}

	buildSlots() {
		this.slots = [];
		const R = this.model.gridRadius;
		const cornerRadiusRatio = this.cornerRadiusRatio;
		for (let q = -R; q <= R; q++) {
			for (let r = -R; r <= R; r++) {
				const s = -q - r;
				if (Math.abs(s) <= R) {
					const { x, y } = this.axialToPixel(q, r);
					this.slots.push(
						new Hexagon({ x, y, radius: this.radius, fill: '#dddddd', cornerRadiusRatio })
					);
				}
			}
		}
	}

	// Helper: get axial coordinates for a slot index (matches createEmptyBoard order)
	getSlotAxialCoords(idx) {
		let count = 0;
		const R = this.model.gridRadius;
		for (let q = -R; q <= R; q++) {
			for (let r = -R; r <= R; r++) {
				const s = -q - r;
				if (Math.abs(s) <= R) {
					if (count === idx) return { q, r, s };
					count++;
				}
			}
		}
		return { q: 0, r: 0, s: 0 };
	}

	draw() {
		// Layout and background logic from App4
		if (typeof width !== 'undefined') {
			const marginX = 25;
			const maxBoardWidth = 500;
			const topOffset = 360; // px from top of page to top of board
			const bottomOffset = 100; // px from bottom of board to bottom of page (for reset button)
			const playableWidth = Math.min(width - marginX * 2, maxBoardWidth);
			const playableHeight = Math.max(0, height - topOffset - bottomOffset);
			const G = this.model.gridRadius;
			const paddingRatio = this.paddingRatio;

			// Background hexagon
			if (!this.backgroundHexagon) {
				this.backgroundHexagon = new Hexagon({
					x: width / 2,
					y: topOffset,
					radius: 1,
					fill: '#333',
					cornerRadiusRatio: this.cornerRadiusRatio,
					rotation: 30
				});
			}
			// Layout calculation and cache
			const key = `${playableWidth}x${playableHeight}|G${G}|k${paddingRatio.toFixed(4)}|rounded:${this.useRounded ? 1 : 0}`;
			if (!this._fitCache || this._fitCache !== key) {
				const sqrt3 = Math.sqrt(3);
				const spacingMultiplier = 1 + paddingRatio;
				const strokeRatio = this.useRounded ? 0 : (paddingRatio * 0.25);
				const widthCoeff = 3 * G * spacingMultiplier + 2 + strokeRatio;
				const heightCoeff = sqrt3 * (2 * G * spacingMultiplier + 1) + strokeRatio;
				const maxRadiusForWidth = playableWidth / widthCoeff;
				const maxRadiusForHeight = playableHeight / heightCoeff;
				const radius = Math.max(1, Math.min(maxRadiusForWidth, maxRadiusForHeight));
				const originX = width / 2;
				const originY = topOffset + radius * (1 + paddingRatio); // top of board at topOffset
				this.setLayout({ originX, originY, radius });
				this._fitCache = key;
				this.boardReady = true;
			}
			// Update background hexagon radius and position
			this.backgroundHexagon.x = width / 2;
			this.backgroundHexagon.y = topOffset + this.radius * (1 + paddingRatio);
			this.backgroundHexagon.radius = this.radius * (this.model.gridRadius * 2 + 1) * 1.06;
			// Draw background hexagon
			push();
			this.backgroundHexagon.draw();
			pop();
		}

		// Draw board slots and tiles
		push();
		const tiles = this.model.getTiles();
		this.slots.forEach((slot, idx) => {
			const coords = this.getSlotCoords(idx);
			slot.setPosition(coords.x, coords.y);
			slot.draw();
			// Find the tile for this slot (if any)
			const axial = this.getSlotAxialCoords(idx);
			let entry = null;
			if (tiles && tiles.length > 0) {
				entry = tiles.find(t => t && t.q === axial.q && t.r === axial.r);
			}
			// Draw tile if present
			if (entry && entry.present) {
				const { dir } = entry;
				const { x, y } = coords;
				const tile = new HexTile({ x, y, radius: this.radius, arrowDir: dir, cornerRadiusRatio: this.cornerRadiusRatio });
				tile.draw();
			}
			// Debug overlay for every slot
			if (this.isDebug) {
				push();
				textAlign(CENTER, CENTER);
				textSize(Math.max(10, this.radius * 0.3));
				noStroke();
				fill(255, 255, 255, 150);
				// Find q, r for this slot
				const q = axial.q, r = axial.r;
				const debugString = `${q},${r}`;
				text(debugString, coords.x, coords.y - 15);
				// Show target for present tile, or null
				let targetString = 'null';
				if (entry && entry.present) {
					const targetTile = this.model.getTile(q, r);
					if (targetTile) {
						const dirObj = HEX_DIRECTIONS.find(d => d.name === targetTile.dir);
						if (dirObj) {
							const pointedTile = this.model.getPointedTile(targetTile);
							targetString = (pointedTile) ? `${pointedTile.q},${pointedTile.r}` : 'null';
						}
					}
				}
				fill(255, 255, 0, 150);
				text(targetString, coords.x, coords.y + 17);
				pop();
			}
		});
		pop();
	}

	getSlotCoords(idx) {
		let count = 0;
		const R = this.model.gridRadius;
		for (let q = -R; q <= R; q++) {
			for (let r = -R; r <= R; r++) {
				const s = -q - r;
				if (Math.abs(s) <= R) {
					if (count === idx) return this.axialToPixel(q, r);
					count++;
				}
			}
		}
		return { x: 0, y: 0 };
	}

	getTileCoords(idx) {
		let count = 0;
		const R = this.model.gridRadius;
		for (let q = -R; q <= R; q++) {
			for (let r = -R; r <= R; r++) {
				const s = -q - r;
				if (Math.abs(s) <= R) {
					if (count === idx) return this.axialToPixel(q, r);
					count++;
				}
			}
		}
		return { x: 0, y: 0 };
	}

	// Returns the tile entry at (mx, my), or null if none
	getTileAtPixel(mx, my) {
		// Use model data for hit detection
		const tiles = this.model.getTiles();
		for (const entry of tiles) {
			if (entry && entry.present) {
				const { q, r } = entry;
				const { x, y } = this.axialToPixel(q, r);
				const dx = mx - x;
				const dy = my - y;
				if (Math.hypot(dx, dy) <= this.radius * 0.98) return entry;
			}
		}
		return null;
	}

	// Mark the tile at (mx, my) as empty if any
	handleClick(mx, my) {
		const entry = this.getTileAtPixel(mx, my);
		if (entry && entry.present) {
			const targetTile = this.model.getPointedTile(entry);
			if (targetTile && targetTile.present) {
				// Cannot remove if pointing to another present tile
				return false;
			}
			this.model.removeTile(entry.q, entry.r);
			return true;
		}
		return false;
	}
}
