// DinoTile - View entity representing a tile index on a sprite sheet
export default class DinoTile {
	constructor({ sheetKey, tileIndex, dx = 0, dy = 0, dw = 64, dh = 64 }) {
		this.sheetKey = sheetKey;
		this.tileIndex = tileIndex;
		this.dx = dx;
		this.dy = dy;
		this.dw = dw;
		this.dh = dh;
	}

	display(spriteSheetSystem) {
		if (!spriteSheetSystem) return;
		spriteSheetSystem.drawTile({
			sheetKey: this.sheetKey,
			tileIndex: this.tileIndex,
			dx: this.dx,
			dy: this.dy,
			dw: this.dw,
			dh: this.dh
		});
	}

	setPosition(x, y) {
		this.dx = x;
		this.dy = y;
	}

	setSize(size) {
		this.dw = size;
		this.dh = size;
	}
}
