// HexTiles.js - Game model for Hex Tiles

// Canonical directions for flat-top hexes
export const HEX_DIRECTIONS = [
	{ name: 'up', angle: 0, color: '#e53935' }, // red
	{ name: 'upRight', angle: 60, color: '#1e88e5' }, // blue
	{ name: 'downRight', angle: 120, color: '#43a047' }, // green
	{ name: 'down', angle: 180, color: '#fdd835' }, // yellow
	{ name: 'downLeft', angle: 240, color: '#8e24aa' }, // purple
	{ name: 'upLeft', angle: 300, color: '#fb8c00' }, // orange
];

// Main game model class
export default class HexTilesModel {
	constructor({ gridRadius = 3 } = {}) {
		this.gridRadius = gridRadius;
		this.tiles = [];
		this.initTiles();
	}

	// Set a new gridRadius and regenerate tiles
	setGridRadius(newRadius) {
		if (typeof newRadius === 'number') {
			this.gridRadius = newRadius;
			this.initTiles();
		}
	}

	// Helper: create array of all valid tile positions
	createEmptyBoard() {
		const R = this.gridRadius;
		const positions = [];
		for (let q = -R; q <= R; q++) {
			for (let r = -R; r <= R; r++) {
				const s = -q - r;
				if (Math.abs(s) <= R) {
					positions.push({ q, r, s });
				}
			}
		}
		return positions;
	}

	// Helper: Fisher-Yates shuffle
	shuffle(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	// Helper: check if the current board is winnable (greedy removal)
	isBoardWinnable(tiles) {
		// Copy present state
		const present = new Set();
		for (const t of tiles) if (t && t.present) present.add(`${t.q},${t.r}`);
		const N = present.size;
		let removed = 0;
		// Shallow copy of tiles
		const board = tiles.map(t => t ? { ...t } : null);
		while (removed < N) {
			let found = false;
			for (const tile of board) {
				if (!tile || !tile.present) continue;
				// Can remove if the tile it points to is absent or off board
				const pointed = this.getPointedTileForBoard(tile, board);
				if (!pointed || !pointed.present) {
					tile.present = false;
					found = true;
					removed++;
				}
			}
			if (!found) return false;
		}
		return true;
	}

	// Helper: getPointedTile for a custom board
	getPointedTileForBoard(tile, board) {
		if (!tile || !tile.present) return null;
		const dirObj = HEX_DIRECTIONS.find(d => d.name === tile.dir);
		if (!dirObj) return null;
		const dirVectors = {
			'up': { dq: 0, dr: -1 },
			'upRight': { dq: 1, dr: -1 },
			'downRight': { dq: 1, dr: 0 },
			'down': { dq: 0, dr: 1 },
			'downLeft': { dq: -1, dr: 1 },
			'upLeft': { dq: -1, dr: 0 },
		};
		const vec = dirVectors[tile.dir];
		let currentQ = tile.q + vec.dq;
		let currentR = tile.r + vec.dr;
		const visited = new Set();
		while (true) {
			const key = `${currentQ},${currentR}`;
			if (visited.has(key)) return null; // loop detected
			visited.add(key);
			const nextTile = board.find(t => t && t.q === currentQ && t.r === currentR);
			if (!nextTile) return null;
			if (nextTile.present) return nextTile;
			currentQ += vec.dq;
			currentR += vec.dr;
		}
	}

	// Main generator: parameterized diversity and swap exhaustion
	initTiles() {
		const positions = this.createEmptyBoard();
		const directions = HEX_DIRECTIONS;

		// Diversity level: higher means more cycles and swap attempts
		const diversityLevel = 4; // More cycles for higher diversity
		const swapExhaustionLimit = 40 * positions.length; // More failed swaps allowed

		// 1. Start with all tiles pointing in a single random direction (guaranteed winnable)
		const startDir = directions[Math.floor(Math.random() * directions.length)].name;
		let tiles = positions.map(pos => ({ ...pos, dir: startDir, present: true }));

		// 2. For each tile, try all other directions in random order, many times, for maximum diversity
		for (let cycle = 0; cycle < diversityLevel; cycle++) {
			const indices = this.shuffle([...Array(tiles.length).keys()]);
			for (const idx of indices) {
				const tile = tiles[idx];
				if (!tile) continue;
				// Try all other directions in random order
				const dirOrder = this.shuffle(directions.map(d => d.name).filter(name => name !== tile.dir));
				let failedSwaps = 0;
				for (const dirName of dirOrder) {
					if (failedSwaps >= swapExhaustionLimit) break;
					const oldDir = tile.dir;
					tile.dir = dirName;
					if (!this.isBoardWinnable(tiles)) {
						tile.dir = oldDir;
						failedSwaps++;
					}
				}
			}
		}
		// Final check: only accept the puzzle if the final state is winnable
		if (this.isBoardWinnable(tiles)) {
			this.tiles = tiles;
		} else {
			// Fallback: all tiles in startDir (guaranteed winnable)
			this.tiles = positions.map(pos => ({ ...pos, dir: startDir, present: true }));
		}
	}

	// Get all tile objects (with q, r, s, dir, present) for the current gridRadius
	getTiles() {
		// Always return a tile object for every valid (q, r, s) in the current gridRadius
		const R = this.gridRadius;
		const tileMap = new Map();
		if (this.tiles && this.tiles.length > 0) {
			for (const t of this.tiles) {
				if (t) tileMap.set(`${t.q},${t.r}`, t);
			}
		}
		const result = [];
		for (let q = -R; q <= R; q++) {
			for (let r = -R; r <= R; r++) {
				const s = -q - r;
				if (Math.abs(s) <= R) {
					const key = `${q},${r}`;
					result.push(tileMap.get(key) || { q, r, s, present: false });
				}
			}
		}
		return result;
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
			'up': { dq: 0, dr: -1 },
			'upRight': { dq: 1, dr: -1 },
			'downRight': { dq: 1, dr: 0 },
			'down': { dq: 0, dr: 1 },
			'downLeft': { dq: -1, dr: 1 },
			'upLeft': { dq: -1, dr: 0 },
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
