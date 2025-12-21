import GuessWordsTile from './GuessWordsTile.js';

export default class GuessWordsGameBoard {
	constructor({ colors }) {
		this.colors = colors;
		this.animations = [];
		this.tile = new GuessWordsTile();
	}

	resetAnimations() {
		this.animations.length = 0;
	}

	addPop(row, col, startTime = millis()) {
		this.animations.push({ row, col, type: 'pop', startTime, duration: 200 });
	}

	draw({ model, tileSize, gap, offsetX, offsetY, results }) {
		for (let r = 0; r < 6; r++) {
			for (let c = 0; c < 5; c++) {
				this.drawTile({
					row: r,
					col: c,
					model,
					tileSize,
					gap,
					offsetX,
					offsetY,
					rowResult: results ? results[r] : null
				});
			}
		}
	}

	drawTile({ row, col, model, tileSize, gap, offsetX, offsetY, rowResult }) {
		const letter = model.guesses[row][col];
		const x = offsetX + col * (tileSize + gap);
		const y = offsetY + row * (tileSize + gap);

		let fillColor = 'transparent';
		let strokeColor = this.colors.border;
		let textColor = this.colors.text;
		let scaleX = 1;

		const isFilled = letter !== '';
		const isRevealedRow = !!rowResult;

		const anim = this.animations.find(a => a.row === row && a.col === col);

		if (anim) {
			const elapsed = millis() - anim.startTime;
			if (anim.type === 'pop') {
				if (elapsed < 100) {
					scaleX = map(elapsed, 0, 50, 1, 1.1);
				} else if (elapsed < 200) {
					scaleX = map(elapsed, 100, 200, 1.1, 1);
				} else {
					const idx = this.animations.indexOf(anim);
					if (idx !== -1) this.animations.splice(idx, 1);
				}
			}
		} else {
			if (isRevealedRow) {
				const status = rowResult[col];
				fillColor = this.colors[status];
				strokeColor = fillColor;
			} else if (isFilled) {
				strokeColor = this.colors.filledBorder;
			}
		}

		this.tile.draw({
			x,
			y,
			size: tileSize,
			letter,
			strokeColor,
			fillColor,
			textColor,
			scaleX
		});
	}
}
