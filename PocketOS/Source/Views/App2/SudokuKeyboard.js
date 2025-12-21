export default class SudokuKeyboard {
	constructor({ onKeyPress } = {}) {
		this.onKeyPress = onKeyPress || (() => { });
		this.x = 0; this.y = 0; this.w = 0; this.h = 0;
		this.cols = 10; // 1..9 + backspace
	}

	resize(x, y, w, h) {
		this.x = x; this.y = y; this.w = w; this.h = h;
	}

	draw() {
		push();
		noStroke();
		fill(20);
		rect(this.x, this.y, this.w, this.h);

		const gap = 6;
		const cw = (this.w - gap * (this.cols + 1)) / this.cols;
		// const ch = min(this.h - gap * 2, cw); // square-ish
		const ch = min(this.h - gap * 2, cw * 1.4); // taller for digits
		textAlign(CENTER, CENTER);
		// Use default font (match Wordle keyboard), make digits taller
		textStyle(NORMAL);
		textSize(18);
		for (let i = 0; i < 10; i++) {
			const bx = this.x + gap + i * (cw + gap);
			const by = this.y + gap;
			// Wordle-like key style: dark key, light text, subtle border
			fill('#818384');
			stroke('#1a1a1a');
			strokeWeight(1);
			rect(bx, by, cw, ch, 4);
			noStroke();
			fill('#ffffff');
			const label = i === 9 ? '⌫' : String(i + 1);
			text(label, bx + cw / 2, by + ch / 2);
		}
		pop();
	}

	handleClick(mx, my) {
		const gap = 8;
		const cw = (this.w - gap * (this.cols + 1)) / this.cols;
		const ch = min(this.h - gap * 2, cw * 1.4);
		for (let i = 0; i < 10; i++) {
			const bx = this.x + gap + i * (cw + gap);
			const by = this.y + gap;
			if (mx >= bx && mx <= bx + cw && my >= by && my <= by + ch) {
				const key = i === 9 ? '⌫' : String(i + 1);
				this.onKeyPress(key);
				return true;
			}
		}
		return false;
	}
}
