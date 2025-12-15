import System from './System.js';

export default class SpriteSheetSystem extends System {
	constructor() {
		super();
		this.sheets = new Map();
	}

	async setup() {
		const apps = this.engine.state.apps || [];
		const spriteSheets = apps.flatMap(app => (app.bundle?.spriteSheets || []).map(def => ({ ...def, appKey: app.key })));

		this.engine.state.spriteSheets = this.engine.state.spriteSheets || {};

		for (const def of spriteSheets) {
			const img = await this.loadImage(def.url);
			const key = def.key || def.name || def.url;
			if (!def.sw || !def.sh) continue;
			const sheet = {
				key,
				image: img,
				sx: def.sx,
				sy: def.sy,
				sw: def.sw,
				sh: def.sh,
				dw: def.dw,
				dh: def.dh,
				cols: def.cols,
				rows: def.rows
			};

			this.sheets.set(key, sheet);
			this.engine.state.spriteSheets[key] = sheet;
		}
	}

	async loadImage(url) {
		return new Promise(resolve => loadImage(url, resolve));
	}

	getSheet(key) {
		return this.sheets.get(key);
	}

	drawTile({ sheetKey, tileIndex, dx, dy, dw, dh }) {
		const sheet = this.sheets.get(sheetKey);
		if (!sheet || !sheet.image || !sheet.sw || !sheet.sh) return;

		const cols = sheet.sx.length;
		const col = tileIndex % cols;
		const row = Math.floor(tileIndex / cols);

		const sx = sheet.sx.length ? sheet.sx[col] : col * sheet.sw;
		const sy = sheet.sy.length ? sheet.sy[row] : row * sheet.sh;
		const sw = sheet.sw;
		const sh = sheet.sh;

		const renderW = dw ?? sw;
		const renderH = dh ?? sh;

		push();
		noStroke();
		image(sheet.image, dx, dy, renderW, renderH, sx, sy, sw, sh);
		pop();
	}
}
