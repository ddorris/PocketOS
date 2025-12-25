// DinoBoard - View component for rendering and hit-testing the game board
import DinoTile from './DinoTile.js';
import { buildTurtleLayout } from '../../Models/Layout/DinoLayout.js';

export default class DinoBoard {
	constructor(model, spriteSheetSystem, sheetKey = 'dinotiles') {
		this.model = model;
		this.spriteSheetSystem = spriteSheetSystem;
		this.sheetKey = sheetKey;
		this.tileViews = new Map(); // Maps tile id -> {view, dx, dy, dw, dh}
		this.layoutStartY = 200;
		this.isDebug = false;
		this.maxBoardWidth = 400; // Maximum width for board rendering (tunable)
		this.lastAvailableWidth = typeof width !== 'undefined' ? width : 800;
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
		let gridWidth = (maxX - minX + 1) * (dw + padding) - padding;
		const gridHeight = (maxY - minY + 1) * (dh + padding) - padding;

		// Always use maxBoardWidth for scaling, regardless of available width
		const availableWidth = typeof width !== 'undefined' ? width : this.maxBoardWidth;
		this.lastAvailableWidth = availableWidth;
		let targetBoardWidth = this.maxBoardWidth;

		// Scale board if needed
		let scale = 1;
		if (gridWidth > targetBoardWidth) {
			scale = targetBoardWidth / gridWidth;
			gridWidth = targetBoardWidth;
		} else {
			// If gridWidth is less than maxBoardWidth, allow it to grow to maxBoardWidth
			scale = targetBoardWidth / gridWidth;
			gridWidth = targetBoardWidth;
		}
		let scaledDw = dw * scale;
		let scaledDh = dh * scale;
		let scaledPadding = padding * scale;

		const startX = (availableWidth - gridWidth) / 2 - minX * (scaledDw + scaledPadding);
		const startY = this.layoutStartY - minY * (scaledDh + scaledPadding);

		// Create view objects for each tile
		for (const tile of this.model.getTiles()) {
			const dx = startX + tile.gx * (scaledDw + scaledPadding);
			const dy = startY + tile.gy * (scaledDh + scaledPadding);
			const view = new DinoTile({
				sheetKey: this.sheetKey,
				tileIndex: tile.tileIndex,
				dx,
				dy,
				dw: scaledDw,
				dh: scaledDh
			});
			this.tileViews.set(tile.id, { view, dx, dy, dw: scaledDw, dh: scaledDh });
		}
	}

	draw() {
		if (!this.spriteSheetSystem) return;

		// If available width changed, re-initialize layout
		const availableWidth = typeof width !== 'undefined' ? width : this.maxBoardWidth;
		if (availableWidth !== this.lastAvailableWidth) {
			this.initialize();
			this.lastAvailableWidth = availableWidth;
		}

		// Render all active tiles (back to front)
		const activeTiles = this.model.getActiveTiles();
		activeTiles.sort((a, b) => a.layer - b.layer);
		for (const tile of activeTiles) {
			const viewData = this.tileViews.get(tile.id);
			if (viewData) {
				// Set targetDimOverlayAlpha: 0 if selectable, 1 if blocked (for fade)
				if (this.model.isSelectable(tile)) {
					viewData.view.targetDimOverlayAlpha = 0;
				} else {
					viewData.view.targetDimOverlayAlpha = 1;
				}
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
