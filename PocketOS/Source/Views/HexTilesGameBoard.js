import HexTile from './HexTile.js';
import Hexagon from './Hexagon.js';

export default class HexTilesGameBoard {
	constructor() {
		this.originX = 0;
		this.originY = 0;
		this.radius = 30;
		this.paddingRatio = 0.01; // padding as ratio of radius (creates gaps between tiles)
		this.cornerRadiusRatio = 0.2; // 0 = sharp corners, >0 = rounded corners (fraction of radius)
		this.gridRadius = 3; // how many rings from center (1 = flower, 2 = flower + ring)
		this.slots = []; // background empty cells
		this.tiles = []; // active game pieces
	}

	setLayout({ originX, originY, radius, paddingRatio, gridRadius }) {
		if (originX !== undefined) this.originX = originX;
		if (originY !== undefined) this.originY = originY;
		if (radius !== undefined) this.radius = radius;
		if (paddingRatio !== undefined) this.paddingRatio = paddingRatio;
		if (gridRadius !== undefined) this.gridRadius = gridRadius;
		this.buildBoard();
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
		const R = this.gridRadius;
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

	buildPieces() {
		// Build a 2D array of tiles indexed by axial (q, r), or null for empty
		this.tiles = [];
		const directions = ['up', 'upRight', 'downRight', 'down', 'downLeft', 'upLeft'];
		const R = this.gridRadius;
		const cornerRadiusRatio = this.cornerRadiusRatio;
		for (let q = -R; q <= R; q++) {
			for (let r = -R; r <= R; r++) {
				const s = -q - r;
				if (Math.abs(s) <= R) {
					const p = this.axialToPixel(q, r);
					const dir = directions[Math.floor(Math.random() * directions.length)];
					this.tiles.push({
						q, r, s,
						tile: new HexTile({ x: p.x, y: p.y, radius: this.radius, arrowDir: dir, cornerRadiusRatio })
					});
				} else {
					this.tiles.push(null);
				}
			}
		}
	}

	buildBoard() {
		this.buildSlots();
		this.buildPieces();
	}

	draw(p) {
		const ctx = p || window;
		ctx.push();
		// Draw slots (backgrounds)
		this.slots.forEach((slot, idx) => {
			const coords = this.getSlotCoords(idx);
			slot.setPosition(coords.x, coords.y);
			slot.draw(ctx);
		});
		// Draw tiles (pieces) if present
		this.tiles.forEach((entry) => {
			if (entry && entry.tile) {
				// Use the stored q, r for position
				const { x, y } = this.axialToPixel(entry.q, entry.r);
				entry.tile.setPosition(x, y);
				entry.tile.draw(ctx);
			}
		});
		ctx.pop();
	}

	getSlotCoords(idx) {
		let count = 0;
		const R = this.gridRadius;
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
		const R = this.gridRadius;
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
		for (const entry of this.tiles) {
			if (entry && entry.tile) {
				const dx = mx - entry.tile.hex.x;
				const dy = my - entry.tile.hex.y;
				if (Math.hypot(dx, dy) <= this.radius * 0.98) return entry;
			}
		}
		return null;
	}

	// Mark the tile at (mx, my) as empty if any
	handleClick(mx, my) {
		const entry = this.getTileAtPixel(mx, my);
		if (entry && entry.tile) {
			entry.tile = null;
			return true;
		}
		return false;
	}
}
