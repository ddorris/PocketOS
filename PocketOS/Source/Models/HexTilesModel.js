// HexTiles.js - Game model for Hex Tiles

// Canonical directions for flat-top hexes
export const HEX_DIRECTIONS = [
  { name: 'up',        angle: 0,   color: '#e53935' }, // red
  { name: 'upRight',   angle: 60,  color: '#1e88e5' }, // blue
  { name: 'downRight', angle: 120, color: '#43a047' }, // green
  { name: 'down',      angle: 180, color: '#fdd835' }, // yellow
  { name: 'downLeft',  angle: 240, color: '#8e24aa' }, // purple
  { name: 'upLeft',    angle: 300, color: '#fb8c00' }, // orange
];

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
		const directions = HEX_DIRECTIONS;
		const R = this.gridRadius;
		for (let q = -R; q <= R; q++) {
			for (let r = -R; r <= R; r++) {
				const s = -q - r;
				if (Math.abs(s) <= R) {
					const dirObj = directions[Math.floor(Math.random() * directions.length)];
					this.tiles.push({ q, r, s, dir: dirObj.name, present: true });
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

	// Get tile at (q, r)
	getTile(q, r) {
		for (const entry of this.tiles) {
			if (entry && entry.q === q && entry.r === r) {
				return entry;
			}
		}
		return null;
	}

	// Get the tile that a given tile points to
	getPointedTile(tile) {
		if (!tile || !tile.present) return null;
		const dirObj = HEX_DIRECTIONS.find(d => d.name === tile.dir);
		if (!dirObj) return null;
		const dirVectors = {
			'up':        { dq: 0,  dr: -1 },
			'upRight':   { dq: 1,  dr: -1 },
			'downRight': { dq: 1,  dr: 0  },
			'down':      { dq: 0,  dr: 1  },
			'downLeft':  { dq: -1, dr: 1  },
			'upLeft':    { dq: -1, dr: 0  },
		};
		const vec = dirVectors[tile.dir];
		let currentQ = tile.q + vec.dq;
		let currentR = tile.r + vec.dr;
		const visited = new Set();
		while (true) {
			const key = `${currentQ},${currentR}`;
			if (visited.has(key)) return null; // loop detected
			visited.add(key);
			const nextTile = this.getTile(currentQ, currentR);
			if (!nextTile) return null;
			if (nextTile.present) return nextTile;
			currentQ += vec.dq;
			currentR += vec.dr;
		}
	}
}
