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
		       // Only reset the model if deckConfigs is provided (i.e., on true reset, not layout update)
		       if (deckConfigs) {
			       const sheetMeta = this.spriteSheetSystem?.engine?.state?.spriteSheets?.[this.sheetKey];
			       if (!sheetMeta) return;
			       const layout = buildTurtleLayout();
			       this.model.initializeGame(layout, deckConfigs);
		       }
		       this.updateTileViews();
	       }

	       updateTileViews() {
		       this.tileViews.clear();
		       const sheetMeta = this.spriteSheetSystem?.engine?.state?.spriteSheets?.[this.sheetKey];
		       if (!sheetMeta) return;
		       const padding = 2;
		       const dw = sheetMeta.dw;
		       const dh = sheetMeta.dh;
		       // Use the model's current tiles for layout
		       const tiles = this.model.getTiles();
		       if (!tiles.length) return;
		       const minX = Math.min(...tiles.map(s => s.gx));
		       const maxX = Math.max(...tiles.map(s => s.gx));
		       const minY = Math.min(...tiles.map(s => s.gy));
		       const maxY = Math.max(...tiles.map(s => s.gy));
		       let gridWidth = (maxX - minX + 1) * (dw + padding) - padding;
		       // Always use maxBoardWidth for scaling, regardless of available width
		       const availableWidth = typeof width !== 'undefined' ? width : this.maxBoardWidth;
		       this.lastAvailableWidth = availableWidth;
		       let targetBoardWidth = this.maxBoardWidth;
		       let scale = 1;
		       if (gridWidth > targetBoardWidth) {
			       scale = targetBoardWidth / gridWidth;
			       gridWidth = targetBoardWidth;
		       } else {
			       scale = targetBoardWidth / gridWidth;
			       gridWidth = targetBoardWidth;
		       }
		       let scaledDw = dw * scale;
		       let scaledDh = dh * scale;
		       let scaledPadding = padding * scale;
		       const startX = (availableWidth - gridWidth) / 2 - minX * (scaledDw + scaledPadding);
		       const startY = this.layoutStartY - minY * (scaledDh + scaledPadding);
		       for (const tile of tiles) {
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
			       // Set dimOverlayAlpha and targetDimOverlayAlpha to 1 if blocked, 0 if selectable
			       if (tile.blockers && tile.blockers.size > 0) {
				       view.dimOverlayAlpha = 1;
				       view.targetDimOverlayAlpha = 1;
			       } else {
				       view.dimOverlayAlpha = 0;
				       view.targetDimOverlayAlpha = 0;
			       }
			       this.tileViews.set(tile.id, { view, dx, dy, dw: scaledDw, dh: scaledDh });
		       }
	       }

	       draw() {
		       if (!this.spriteSheetSystem) return;

		       // If available width changed, only update layout, not model
		       const availableWidth = typeof width !== 'undefined' ? width : this.maxBoardWidth;
		       if (availableWidth !== this.lastAvailableWidth) {
			       this.updateTileViews();
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
