import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';
import DinoTile from '../Views/DinoTile.js';
import DinoDock from '../Views/DinoDock.js';
import SpriteSheetSystem from '../Systems/SpriteSheetSystem.js';
import { buildTurtleLayout, buildMiniLayout } from '../Models/DinoLayout.js';

export default class App3 extends System {
	constructor() {
		super();
		this.tiles = [];
		this.dinoDock = new DinoDock();
		this.resetButton = null;
		this.isDebug = false;
		this.layoutStartY = 200;
	}
	
	async setup() {
		const appInfo = this.engine.state.apps.find(app => app.id === 3);
		if (appInfo && appInfo.icon) {
			const icon = loadImage(appInfo.icon);
			this.appInfo = new AppInfo({ info: appInfo, icon });
		}

		// Locate the sprite sheet system and ensure sheets are loaded
		this.spriteSheetSystem = this.engine.systems.find(s => s instanceof SpriteSheetSystem);
		if (this.spriteSheetSystem) {
			// SpriteSheetSystem setup already ran; sheets are cached in engine.state.spriteSheets
		}

		this.dinoDock.setSpriteSheetSystem(this.spriteSheetSystem);
		
		// Configure DinoDock slot sizes from sprite sheet metadata
		const sheetMeta = this.engine.state.spriteSheets?.['dinotiles'];
		if (sheetMeta) {
			this.dinoDock.slotWidth = sheetMeta.dw;
			this.dinoDock.slotHeight = sheetMeta.dh;
			this.dinoDock.tileSpacing = sheetMeta.dw + 1; // tile width + small gap
		}
		
		this.initializeGame();
	}

	initializeGame() {
		this.tiles = [];
		this.dinoDock.reset();
		this.buildBoard();
		this.dinoDock.updateLayout(width, height);
		this.createResetButton();
	}

	buildBoard() {
		const sheetKey = 'dinotiles';
		const sheetMeta = this.engine.state.spriteSheets?.[sheetKey];
		if (!sheetMeta) return;

		const padding = 5;
		const dw = sheetMeta.dw;
		const dh = sheetMeta.dh;
		const layout = buildTurtleLayout();
		// const layout = buildMiniLayout();
		// Build a deck favoring multiple triplets per face to reduce deadlocks
		const deck = this.buildTripletDeck(layout.slots.length, [{ facesCount: 9, tripletsPerFace: 2 }, { facesCount: 8, tripletsPerFace: 1 }]);

		// Normalize to center on screen based on layout extents
		const minX = Math.min(...layout.slots.map(s => s.gx));
		const maxX = Math.max(...layout.slots.map(s => s.gx));
		const minY = Math.min(...layout.slots.map(s => s.gy));
		const maxY = Math.max(...layout.slots.map(s => s.gy));
		const gridWidth = (maxX - minX + 1) * (dw + padding) - padding;
		const gridHeight = (maxY - minY + 1) * (dh + padding) - padding;
		const startX = (width - gridWidth) / 2 - minX * (dw + padding);
		const startY = this.layoutStartY - minY * (dh + padding);

		// Build tile records with spatial data
		this.tiles = layout.slots.map((slot, idx) => {
			const dx = startX + slot.gx * (dw + padding);
			const dy = startY + slot.gy * (dh + padding);
			const tileIndex = deck[idx];
			const view = new DinoTile({ sheetKey, tileIndex, dx, dy, dw, dh });
			return {
				id: slot.id || `slot-${idx}`,
				sheetKey,
				gx: slot.gx,
				gy: slot.gy,
				layer: slot.layer,
				dx,
				dy,
				dw,
				dh,
				tileIndex,
				view,
				blockers: new Set(),
				covers: new Set(),
				removed: false
			};
		});

		// Compute blocking relationships (tile covers another if above and rectangles overlap)
		for (let i = 0; i < this.tiles.length; i++) {
			for (let j = 0; j < this.tiles.length; j++) {
				if (i === j) continue;
				const a = this.tiles[i];
				const b = this.tiles[j];
				if (b.layer <= a.layer) continue;
				if (this.rectsOverlap(a, b)) {
					a.blockers.add(b.id);
					b.covers.add(a.id);
				}
			}
		}
	}

	buildTripletDeck(slotCount, configs) {
		// Ensure slotCount is multiple of 3
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

	rectsOverlap(a, b) {
		return !(a.dx + a.dw <= b.dx || b.dx + b.dw <= a.dx || a.dy + a.dh <= b.dy || b.dy + b.dh <= a.dy);
	}

	createResetButton() {
		this.resetButton = {
			x: width - 80,
			y: this.dinoDock.dockY + (this.dinoDock.dockHeight - 40) / 2,
			w: 60,
			h: 40,
			label: 'Reset'
		};
	}

	draw() {
		if (this.enabled === false) return;

		// Background for this game is efd0a4
		// Use rect to avoid clearing entire canvas - dockHeight = 120
		noStroke();
		fill(0xEF, 0xD0, 0xA4);
		rect(0, 120, width, height - 120);

		// Render all tiles (back to front)
		const activeTiles = this.tiles.filter(t => !t.removed);
		activeTiles.sort((a, b) => a.layer - b.layer);
		for (const tile of activeTiles) {
			tile.view.display(this.spriteSheetSystem);
			if (this.isDebug) {
				// Debug: draw z-depth label on each tile
				push();
				textAlign(CENTER, CENTER);
				textSize(10);
				stroke(0);
				strokeWeight(3);
				fill(255);
				text(`layer:${tile.layer}`, tile.dx + tile.dw / 2, tile.dy + tile.dh / 2);
				pop();
			}
		}

		// Draw DinoDock at bottom
		this.dinoDock.draw(this.spriteSheetSystem);

		// Check for win condition: board empty AND dock empty
		if (this.tiles.every(t => t.removed) && this.dinoDock.getTileCount() === 0 && this.dinoDock.gameState !== 'won') {
			this.dinoDock.gameState = 'won';
		}

		// Draw reset button on top (always visible)
		this.drawResetButton();
	}

	drawResetButton() {
		if (!this.resetButton) return;
		const btn = this.resetButton;
		
		push();
		fill(0xEF, 0xD0, 0xA4);
		stroke(0x86, 0x60, 0x35);
		strokeWeight(2);
		rect(btn.x, btn.y, btn.w, btn.h, 5);
		
		noStroke();
		// 866035
		fill(0x86, 0x60, 0x35);
		textAlign(CENTER, CENTER);
		textSize(14);
		text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
		pop();
	}

	windowResized() {
		this.dinoDock.updateLayout(width, height);
		this.createResetButton();
	}

	mousePressed() {
		if (mouseY < 120) return false;

		// Check reset button
		if (this.resetButton && this.hitTestButton(mouseX, mouseY, this.resetButton)) {
			this.initializeGame();
			return true;
		}

		// Don't allow tile clicks if game is over
		if (this.dinoDock.isGameOver()) return false;

		// Hit test: pick topmost tile under cursor
		const candidate = this.findTopmostTileAt(mouseX, mouseY);
		if (candidate && candidate.blockers.size === 0) {
			if (this.dinoDock.addTile(candidate)) {
				this.removeTile(candidate);
			}
			return true;
		}
		return false;
	}

	findTopmostTileAt(px, py) {
		let picked = null;
		for (const tile of this.tiles) {
			if (tile.removed) continue;
			const inside = px >= tile.dx && px <= tile.dx + tile.dw && py >= tile.dy && py <= tile.dy + tile.dh;
			if (!inside) continue;
			if (!picked || tile.layer > picked.layer) picked = tile;
		}
		return picked;
	}

	removeTile(tile) {
		tile.removed = true;
		// Unblock tiles this one was covering
		for (const lowerId of tile.covers) {
			const lower = this.tiles.find(t => t.id === lowerId);
			if (lower) {
				lower.blockers.delete(tile.id);
			}
		}
	}

	hitTestButton(x, y, btn) {
		return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
	}

	touchStarted() {
		return this.mousePressed();
	}
}
