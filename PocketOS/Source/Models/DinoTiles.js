// DinoTiles - Game model for stacked tile matching
export default class DinoTiles {
	constructor() {
		this.tiles = [];
	}

	initializeGame(layout, deckConfigs) {
		const deck = this.buildTripletDeck(layout.slots.length, deckConfigs);
		
		// Build tile records with spatial data
		this.tiles = layout.slots.map((slot, idx) => ({
			id: slot.id || `slot-${idx}`,
			gx: slot.gx,
			gy: slot.gy,
			layer: slot.layer,
			tileIndex: deck[idx],
			blockers: new Set(),
			covers: new Set(),
			removed: false
		}));

		this.computeBlockingRelationships();
	}

	buildTripletDeck(slotCount, configs) {
		const usableSlots = slotCount - (slotCount % 3);
		const totalTriplets = usableSlots / 3;
		const allFaces = Array.from({ length: 28 }, (_, i) => i);
		const cfgArray = Array.isArray(configs)
			? configs
			: (configs ? [configs] : [{ facesCount: 26, tripletsPerFace: 1 }]);

		// Shuffle a working pool of all faces for random selection without replacement across configs
		const facesPool = [...allFaces];
		for (let i = facesPool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[facesPool[i], facesPool[j]] = [facesPool[j], facesPool[i]];
		}

		const picks = [];
		const chosenFaceSet = new Set();
		let poolIndex = 0;
		let emittedTriplets = 0;

		for (const cfg of cfgArray) {
			if (emittedTriplets >= totalTriplets) break;
			const desiredFaces = Math.max(0, Math.min(cfg.facesCount ?? 0, allFaces.length - chosenFaceSet.size));
			const perFaceTriplets = Math.max(cfg.tripletsPerFace ?? 1, 1);

			// Choose distinct faces for this config from the global pool
			const facesForCfg = [];
			for (let k = 0; k < desiredFaces && poolIndex < facesPool.length; k++) {
				const face = facesPool[poolIndex++];
				chosenFaceSet.add(face);
				facesForCfg.push(face);
			}

			// Emit triplets per chosen face, bounded by remaining capacity
			for (const face of facesForCfg) {
				for (let t = 0; t < perFaceTriplets && emittedTriplets < totalTriplets; t++) {
					picks.push(face, face, face);
					emittedTriplets++;
				}
				if (emittedTriplets >= totalTriplets) break;
			}
		}

		// Top up if needed by repeating from chosen faces
		const chosenFaces = Array.from(chosenFaceSet);
		while (emittedTriplets < totalTriplets) {
			const faceSource = chosenFaces.length ? chosenFaces : allFaces;
			const face = faceSource[Math.floor(Math.random() * faceSource.length)];
			picks.push(face, face, face);
			emittedTriplets++;
		}
		
		// Shuffle deck
		for (let i = picks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[picks[i], picks[j]] = [picks[j], picks[i]];
		}
		return picks;
	}

	computeBlockingRelationships() {
		// Reset blocking relationships
		for (const tile of this.tiles) {
			tile.blockers.clear();
			tile.covers.clear();
		}

		// Compute blocking (tile covers another if above and rectangles would overlap in screen space)
		// Note: We compute based on grid positions; actual pixel overlap check happens in App3
		for (let i = 0; i < this.tiles.length; i++) {
			for (let j = 0; j < this.tiles.length; j++) {
				if (i === j) continue;
				const a = this.tiles[i];
				const b = this.tiles[j];
				if (b.layer <= a.layer) continue;
				
				// Grid-based overlap check (tiles are 1 unit wide/tall in grid space)
				const overlap = !(
					a.gx + 1 <= b.gx || b.gx + 1 <= a.gx ||
					a.gy + 1 <= b.gy || b.gy + 1 <= a.gy
				);
				
				if (overlap) {
					a.blockers.add(b.id);
					b.covers.add(a.id);
				}
			}
		}
	}

	getTiles() {
		return this.tiles;
	}

	getActiveTiles() {
		return this.tiles.filter(t => !t.removed);
	}

	findTopmostTileAt(gx, gy) {
		let picked = null;
		for (const tile of this.tiles) {
			if (tile.removed) continue;
			// Check if point is within tile's grid cell
			const inside = gx >= tile.gx && gx < tile.gx + 1 && gy >= tile.gy && gy < tile.gy + 1;
			if (!inside) continue;
			if (!picked || tile.layer > picked.layer) picked = tile;
		}
		return picked;
	}

	isSelectable(tile) {
		return tile && !tile.removed && tile.blockers.size === 0;
	}

	selectTile(tile) {
		if (!this.isSelectable(tile)) return false;
		
		tile.removed = true;
		// Unblock tiles this one was covering
		for (const lowerId of tile.covers) {
			const lower = this.tiles.find(t => t.id === lowerId);
			if (lower) {
				lower.blockers.delete(tile.id);
			}
		}
		return true;
	}

	isGameWon() {
		return this.tiles.every(t => t.removed);
	}

	getTileCount() {
		return this.getActiveTiles().length;
	}
}
