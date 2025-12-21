// DinoBoard - View component for rendering and hit-testing the game board
import DinoTile from './DinoTile.js';
import { buildTurtleLayout } from '../Models/Layout/DinoLayout.js';

export default class DinoBoard {
	constructor(model, spriteSheetSystem, sheetKey = 'dinotiles') {
		this.model = model;
		this.spriteSheetSystem = spriteSheetSystem;
		this.sheetKey = sheetKey;
		this.tileViews = new Map(); // Maps tile id -> {view, dx, dy, dw, dh}
		this.layoutStartY = 200;
		this.isDebug = false;
	}

	initialize(deckConfigs = [{ facesCount: 9, tripletsPerFace: 2 }, { facesCount: 8, tripletsPerFace: 1 }]) {
		this.tileViews.clear();
		const sheetMeta = this.spriteSheetSystem?.engine?.state?.spriteSheets?.[this.sheetKey];
		if (!sheetMeta) return;

		const padding = 5;
		const dw = sheetMeta.dw;
		const dh = sheetMeta.dh;
		const layout = buildTurtleLayout();

		// Initialize game model with layout and deck
		this.model.initializeGame(layout, deckConfigs);

		// Normalize to center on screen based on layout extents
		const minX = Math.min(...layout.slots.map(s => s.gx));
		const maxX = Math.max(...layout.slots.map(s => s.gx));
		const minY = Math.min(...layout.slots.map(s => s.gy));
		const maxY = Math.max(...layout.slots.map(s => s.gy));
		const gridWidth = (maxX - minX + 1) * (dw + padding) - padding;
		const gridHeight = (maxY - minY + 1) * (dh + padding) - padding;
		const startX = (typeof width !== 'undefined' ? width - gridWidth : 0) / 2 - minX * (dw + padding);
		const startY = this.layoutStartY - minY * (dh + padding);

		// Create view objects for each tile
		for (const tile of this.model.getTiles()) {
			const dx = startX + tile.gx * (dw + padding);
			const dy = startY + tile.gy * (dh + padding);
			const view = new DinoTile({ 
				sheetKey: this.sheetKey, 
				tileIndex: tile.tileIndex, 
				dx, 
				dy, 
				dw, 
				dh 
			});
			this.tileViews.set(tile.id, { view, dx, dy, dw, dh });
		}
	}

	draw() {
		if (!this.spriteSheetSystem) return;

		// Render all active tiles (back to front)
		const activeTiles = this.model.getActiveTiles();
		activeTiles.sort((a, b) => a.layer - b.layer);
		for (const tile of activeTiles) {
			const viewData = this.tileViews.get(tile.id);
			if (viewData) {
				viewData.view.display(this.spriteSheetSystem);
				if (this.isDebug) {
					// Debug: draw layer label on each tile
					push();
					textAlign(CENTER, CENTER);
					textSize(10);
					stroke(0);
					strokeWeight(3);
					fill(255);
					text(`layer:${tile.layer}`, viewData.dx + viewData.dw / 2, viewData.dy + viewData.dh / 2);
					pop();
				}
			}
		}
	}

	findTopmostTileAtPixel(px, py) {
		let picked = null;
		for (const tile of this.model.getTiles()) {
			if (tile.removed) continue;
			const viewData = this.tileViews.get(tile.id);
			if (!viewData) continue;
			
			const inside = px >= viewData.dx && px <= viewData.dx + viewData.dw && 
			               py >= viewData.dy && py <= viewData.dy + viewData.dh;
			if (!inside) continue;
			if (!picked || tile.layer > picked.layer) picked = tile;
		}
		return picked;
	}
}
