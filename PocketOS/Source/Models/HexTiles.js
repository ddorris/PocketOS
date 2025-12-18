// HexTiles.js - Game model for Hex Tiles

// Direction angles (flat-top hexes, 0° is up)
export const DIR_ANGLES = {
	up: 0,
	upRight: 60,
	downRight: 120,
	down: 180,
	downLeft: 240,
	upLeft: 300,
};

// Face color for the hex based on direction
export const DIR_COLORS = {
	up: '#e53935', // red
	upLeft: '#fb8c00', // orange
	upRight: '#1e88e5', // blue
	down: '#fdd835', // yellow
	downLeft: '#8e24aa', // purple
	downRight: '#43a047', // green
};

// Main game model class
export default class HexTilesModel {
	constructor({ gridRadius = 3 } = {}) {
		this.gridRadius = gridRadius;
		this.tiles = [];
		this.initTiles();
	}

	// Initialize the board with random directions
	initTiles() {
		this.tiles = [];
		const directions = Object.keys(DIR_ANGLES);
		const R = this.gridRadius;
		for (let q = -R; q <= R; q++) {
			for (let r = -R; r <= R; r++) {
				const s = -q - r;
				if (Math.abs(s) <= R) {
					const dir = directions[Math.floor(Math.random() * directions.length)];
					this.tiles.push({ q, r, s, dir, present: true });
				} else {
					this.tiles.push(null);
				}
			}
		}
	}

	// Get all tile objects (with q, r, s, dir, present)
	getTiles() {
		return this.tiles;
	}

	// Remove a tile at (q, r)
	removeTile(q, r) {
		for (const entry of this.tiles) {
			if (entry && entry.q === q && entry.r === r && entry.present) {
				entry.present = false;
				return true;
			}
		}
		return false;
	}

	// Reset the board
	reset() {
		this.initTiles();
	}
}
