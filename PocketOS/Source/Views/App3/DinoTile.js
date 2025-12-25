// DinoTile - View entity representing a tile index on a sprite sheet


export default class DinoTile {
	constructor({ sheetKey, tileIndex, dx = 0, dy = 0, dw = 64, dh = 64 }) {
		this.sheetKey = sheetKey;
		this.tileIndex = tileIndex;
		this.dx = dx;
		this.dy = dy;
		this.dw = dw;
		this.dh = dh;
		this.dimOverlayAlpha = 0; // Current alpha (0 = no dim, 1 = max dim)
		this.targetDimOverlayAlpha = 0; // Target alpha to fade to
		this.fadeDuration = 200; // ms, duration of fade
		this._lastUpdate = millis ? millis() : Date.now();
	}


	display(spriteSheetSystem) {
		// Animate dimOverlayAlpha toward targetDimOverlayAlpha
		const now = millis ? millis() : Date.now();
		const dt = Math.min(100, now - (this._lastUpdate || now));
		this._lastUpdate = now;
		if (this.dimOverlayAlpha !== this.targetDimOverlayAlpha) {
			const diff = this.targetDimOverlayAlpha - this.dimOverlayAlpha;
			const step = dt / this.fadeDuration;
			if (Math.abs(diff) <= 0.01) {
				this.dimOverlayAlpha = this.targetDimOverlayAlpha;
			} else {
				this.dimOverlayAlpha += Math.sign(diff) * Math.min(Math.abs(diff), step);
			}
		}

		if (!spriteSheetSystem) return;
		spriteSheetSystem.drawTile({
			sheetKey: this.sheetKey,
			tileIndex: this.tileIndex,
			dx: this.dx,
			dy: this.dy,
			dw: this.dw,
			dh: this.dh
		});

		// Draw dim overlay if needed
		if (this.dimOverlayAlpha > 0.01) {
			// Max darkness: dark color with alpha (tunable)
			const maxAlpha = 0.23;
			const overlayAlpha = this.dimOverlayAlpha * maxAlpha;
			push();
			noStroke();
			// 866035
			fill(0x86, 0x60, 0x35, overlayAlpha * 255);
			const r = Math.min(this.dw, this.dh) * 0.18;
			rect(this.dx, this.dy, this.dw, this.dh, r);
			pop();
		}
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
