import SudokuModel from '../../Models/SudokuModel.js';

export default class SudokuBoard {
	constructor({ colors } = {}) {
		this.colors = colors || { EMPTY_CELL: 'white', CLUE_CELL: '#ccc', VALID: '#1c1', ERROR: '#e22', DEFAULT: '#eee' };
		this.model = new SudokuModel();
		this.matrix = this.model.createEmptyBoard();
		this.cluesMask = Array.from({ length: 9 }, () => Array(9).fill(false));
		this.focus = { r: -1, c: -1 };
		this.tileSize = 48;
		this.gap = 0;
		this.x = 0; this.y = 0;
		this.borderColor = '#ccc';
		this.conflicts = new Set(); // key: r,c string
	}

	setLayout({ x, y, tileSize, gap }) {
		this.x = x; this.y = y; this.tileSize = tileSize; this.gap = gap;
	}

	setPuzzle(puzzle) {
		this.matrix = puzzle.map(row => row.slice());
		this.cluesMask = this.matrix.map(row => row.map(v => v !== 0));
		this.updateConflicts();
		// Clear focus to avoid highlighting a clue cell
		this.focus = { r: -1, c: -1 };
	}

	readMatrix() {
		return this.matrix.map(row => row.slice());
	}

	updateConflicts() {
		this.conflicts.clear();
		const add = (r, c) => this.conflicts.add(`${r},${c}`);
		// rows
		for (let r = 0; r < 9; r++) {
			const vals = [];
			for (let c = 0; c < 9; c++) vals.push(this.matrix[r][c]);
			for (let c = 0; c < 9; c++) {
				const v = vals[c];
				if (v && vals.filter(x => x === v).length > 1) add(r, c);
			}
		}
		// cols
		for (let c = 0; c < 9; c++) {
			const vals = [];
			for (let r = 0; r < 9; r++) vals.push(this.matrix[r][c]);
			for (let r = 0; r < 9; r++) {
				const v = vals[r];
				if (v && vals.filter(x => x === v).length > 1) add(r, c);
			}
		}
		// boxes
		for (let br = 0; br < 9; br += 3) {
			for (let bc = 0; bc < 9; bc += 3) {
				const vals = [];
				for (let a = 0; a < 9; a++) {
					const r = br + Math.floor(a / 3);
					const c = bc + (a % 3);
					vals.push(this.matrix[r][c]);
				}
				for (let a = 0; a < 9; a++) {
					const r = br + Math.floor(a / 3);
					const c = bc + (a % 3);
					const v = vals[a];
					if (v && vals.filter(x => x === v).length > 1) add(r, c);
				}
			}
		}
	}

	setFocusByPixel(mx, my) {
		const rc = this.rcFromPixel(mx, my);
		if (rc && !this.cluesMask[rc.r][rc.c]) {
			this.focus = rc;
		} else {
			this.focus = { r: -1, c: -1 };
		}
	}

	rcFromPixel(mx, my) {
		const size = this.tileSize;
		const boardW = (size * 9) + (this.gap * 8);
		const boardH = (size * 9) + (this.gap * 8);
		if (mx < this.x || my < this.y || mx > this.x + boardW || my > this.y + boardH) return null;
		const localX = mx - this.x;
		const localY = my - this.y;
		const stride = size + this.gap;
		const c = Math.floor(localX / stride);
		const r = Math.floor(localY / stride);
		if (r < 0 || r > 8 || c < 0 || c > 8) return null;
		return { r, c };
	}

	setValueAtFocus(val) {
		const { r, c } = this.focus;
		if (r < 0 || c < 0) return;
		if (this.cluesMask[r][c]) return; // cannot edit clues
		this.matrix[r][c] = val;
		this.updateConflicts();
	}

	draw() {
		const size = this.tileSize;
		const stride = size + this.gap;
		const boardW = (size * 9) + (this.gap * 8);
		const boardH = (size * 9) + (this.gap * 8);

		// grid cells
		push();
		textAlign(CENTER, CENTER);
		textSize(size * 0.55);
		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				const px = this.x + c * stride;
				const py = this.y + r * stride;
				// background color
				const isClue = this.cluesMask[r][c];
				// No cross/duplicate highlighting; keep base styling only
				fill(isClue ? '#ccc' : '#eee');
				stroke('#ddd'); strokeWeight(2);
				rect(px, py, size, size);
				// value
				const v = this.matrix[r][c];
				if (v) {
					noStroke();
					textFont('Varela Round');
					textStyle(BOLD);
					if (isClue) fill('#666'); else fill('#0066cc');
					text(v, px + size / 2, py + size / 2 + 1);
				}
			}
		}
		pop();
		
		// thick 3x3 lines
		stroke('#666'); strokeWeight(3);
		strokeJoin(ROUND); strokeCap(ROUND);
		for (let i = 0; i <= 9; i += 3) {
			const y = this.y + i * stride - (i === 0 ? 0 : this.gap);
			line(this.x, y, this.x + boardW, y);
			const x = this.x + i * stride - (i === 0 ? 0 : this.gap);
			line(x, this.y, x, this.y + boardH);
		}

		// focus ring
		if (this.focus.r >= 0 && this.focus.c >= 0) {
			const px = this.x + this.focus.c * stride;
			const py = this.y + this.focus.r * stride;
			// noFill();
			fill(0, 102, 204, 15);
			stroke('#0066cc'); strokeWeight(3);
			rect(px, py, size, size);
		}
	}
}
