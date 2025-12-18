import HexTile from './HexTile.js';
import Hexagon from './Hexagon.js';

export default class HexTilesGameBoard {
	constructor(model) {
		this.originX = 0;
		this.originY = 0;
		this.radius = 30;
		this.paddingRatio = 0.01;
		this.cornerRadiusRatio = 0.2;
		this.gridRadius = 3;
		this.slots = [];
		this.model = model;
	}

	setLayout({ originX, originY, radius, paddingRatio, gridRadius }) {
		if (originX !== undefined) this.originX = originX;
		if (originY !== undefined) this.originY = originY;
		if (radius !== undefined) this.radius = radius;
		if (paddingRatio !== undefined) this.paddingRatio = paddingRatio;
		if (gridRadius !== undefined && gridRadius !== this.gridRadius) {
			this.gridRadius = gridRadius;
			// The model should be replaced by the app, not here
		}
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

	// No buildPieces; tile data comes from model

	buildBoard() {
		this.buildSlots();
		// No buildPieces; handled by model
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
		// Draw tiles (pieces) from model
		const tiles = this.model.getTiles();
		tiles.forEach((entry) => {
			if (entry && entry.present) {
				const { q, r, dir } = entry;
				const { x, y } = this.axialToPixel(q, r);
				// Create a HexTile on the fly for rendering
				const tile = new HexTile({ x, y, radius: this.radius, arrowDir: dir, cornerRadiusRatio: this.cornerRadiusRatio });
				tile.draw(ctx);
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
			this.model.removeTile(entry.q, entry.r);
			return true;
		}
		return false;
	}
}
