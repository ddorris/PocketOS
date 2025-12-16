// WebSudoku view: encapsulates DOM-based UI for Sudoku using the Sudoku model
import Sudoku from '../Models/Sudoku.js';

export default class WebSudoku {
	constructor() {
		this.model = new Sudoku();
		this.wrapper = null;
		this.appDiv = null;
		this.grid = null;
		this.gui = null;
		this.selectedClues = 46; // default MEDIUM
		this._resizeObserver = null;
		this._scaleState = { initialized: false, lastAvailW: 0, lastAvailH: 0, intrinsicW: 0, intrinsicH: 0 };
	}

	get DIFFICULTY_LEVEL() {
		return { EASY: 56, MEDIUM: 46, HARD: 36, TESTING: 79, SOLVED: 81 };
	}

	get COLORS() {
		return { EMPTY_CELL: 'white', CLUE_CELL: '#ddd', VALID: '#1c1', ERROR: '#e22', DEFAULT: '#eee' };
	}

	mount() {
		this.injectHTMLAndStyles();
		this.ready();
	}

	injectHTMLAndStyles() {
		if (!document.getElementById('app2-font')) {
			const link = document.createElement('link');
			link.id = 'app2-font';
			link.rel = 'stylesheet';
			link.href = 'https://fonts.googleapis.com/css2?family=Varela+Round&display=swap';
			document.head.appendChild(link);
		}
		if (!document.getElementById('app2-style')) {
			const link = document.createElement('link');
			link.id = 'app2-style';
			link.rel = 'stylesheet';
			link.href = 'Styles/App2.css';
			document.head.appendChild(link);
		}
		if (document.getElementById('app2-page-container')) return;

		const pageContainer = document.createElement('div');
		pageContainer.id = 'app2-page-container';
		document.body.appendChild(pageContainer);

		const fitHeightContainer = document.createElement('div');
		fitHeightContainer.id = 'app2-fit-height';
		pageContainer.appendChild(fitHeightContainer);

		const fitWidthContainer = document.createElement('div');
		fitWidthContainer.id = 'app2-fit-width';
		fitHeightContainer.appendChild(fitWidthContainer);

		const scaler = document.createElement('div');
		scaler.id = 'app2-scaler';
		fitWidthContainer.appendChild(scaler);

		this.wrapper = document.createElement('div');
		this.wrapper.id = 'app2-wrapper';
		scaler.appendChild(this.wrapper);

		this.appDiv = document.createElement('div');
		this.appDiv.id = 'app2-app';
		this.wrapper.appendChild(this.appDiv);
	}

	ready() {
		const e = (parent, tag = 'div', cls = null, text = null) => {
			const o = document.createElement(tag);
			if (cls) o.className = cls;
			if (text) o.textContent = text;
			if (parent) parent.appendChild(o);
			return o;
		};

		const stopBubble = (evt) => evt.stopPropagation();
		const bubbleEvents = ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'wheel', 'contextmenu', 'change', 'input'];
		for (const eventType of bubbleEvents) this.wrapper.addEventListener(eventType, stopBubble, false);

		// Grid
		this.grid = e(this.appDiv, 'div', 'app2-grid');
		this.grid.setAttribute('role', 'grid');
		this.grid.blocks = [];
		for (let t = 0; t < 9; t++) {
			const block = e(this.grid, 'div', 'app2-block');
			block.cells = [];
			for (let r = 0; r < 9; r++) {
				const input = e(block, 'input', 'app2-cell');
				input.maxLength = 1;
				input.value = '';
				input.setAttribute('inputmode', 'numeric');
				input.setAttribute('autocomplete', 'off');
				input.setAttribute('role', 'gridcell');
				input.addEventListener('input', () => { input.value = isNaN(input.value) ? '' : input.value; });
				block.cells.push(input);
			}
			this.grid.blocks.push(block);
		}
		this.grid.addEventListener('input', () => { this.showGridState(); this.highlightConflicts(); });

		// GUI
		this.gui = e(this.appDiv, 'div', 'app2-gui');
		const labelEl = e(this.gui, 'label', null, 'DIFFICULTY:');
		const select = e(this.gui, 'select', 'app2-dropdown');
		select.id = 'app2-difficulty';
		labelEl.setAttribute('for', 'app2-difficulty');
		for (let key in this.DIFFICULTY_LEVEL) {
			const opt = e(select, 'option');
			opt.value = key;
			opt.text = key.charAt(0) + key.slice(1).toLowerCase();
		}
		this.selectedClues = this.DIFFICULTY_LEVEL[select.value];
		select.addEventListener('change', () => { this.selectedClues = this.DIFFICULTY_LEVEL[select.value]; });
		e(this.gui, 'button', 'app2-button', 'New').addEventListener('click', () => this.newGame());
		e(this.gui, 'button', 'app2-button', 'Solve').addEventListener('click', () => this.solveGame());

		// On-screen keyboard
		const keyboard = e(this.appDiv, 'div', 'app2-keyboard');
		let currentFocusedCell = null;
		const setCellFocus = (cell) => {
			if (currentFocusedCell) currentFocusedCell.classList.remove('focused');
			currentFocusedCell = cell;
			if (cell) cell.classList.add('focused');
		};

		this.clearCrossHighlights = () => {
			this.grid.blocks.forEach(b => b.cells.forEach(c => c.classList.remove('cross')));
		};
		this.updateCrossHighlights = (cell) => {
			if (!cell) return;
			this.clearCrossHighlights();
			let rIdx = -1, cIdx = -1;
			for (let r = 0; r < 9; r++) {
				for (let c = 0; c < 9; c++) {
					const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
					const ci = (r % 3) * 3 + (c % 3);
					if (this.grid.blocks[bi].cells[ci] === cell) { rIdx = r; cIdx = c; break; }
				}
				if (rIdx !== -1) break;
			}
			if (rIdx === -1) return;
			for (let c = 0; c < 9; c++) {
				const bi = Math.floor(rIdx / 3) * 3 + Math.floor(c / 3);
				const ci = (rIdx % 3) * 3 + (c % 3);
				this.grid.blocks[bi].cells[ci].classList.add('cross');
			}
			for (let r = 0; r < 9; r++) {
				const bi = Math.floor(r / 3) * 3 + Math.floor(cIdx / 3);
				const ci = (r % 3) * 3 + (cIdx % 3);
				this.grid.blocks[bi].cells[ci].classList.add('cross');
			}
			const br = Math.floor(rIdx / 3) * 3;
			const bc = Math.floor(cIdx / 3) * 3;
			for (let a = 0; a < 9; a++) {
				const r = br + Math.floor(a / 3);
				const c = bc + (a % 3);
				const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
				const ci = (r % 3) * 3 + (c % 3);
				this.grid.blocks[bi].cells[ci].classList.add('cross');
			}
		};

		this.highlightConflicts = () => {
			this.grid.blocks.forEach(b => b.cells.forEach(c => c.classList.remove('conflict')));
			// rows
			for (let r = 0; r < 9; r++) {
				const vals = [];
				for (let c = 0; c < 9; c++) vals.push(this.getCellValue(r, c));
				for (let c = 0; c < 9; c++) {
					const v = vals[c];
					if (v && vals.filter(x => x === v).length > 1) {
						const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
						const ci = (r % 3) * 3 + (c % 3);
						this.grid.blocks[bi].cells[ci].classList.add('conflict');
					}
				}
			}
			// columns
			for (let c = 0; c < 9; c++) {
				const vals = [];
				for (let r = 0; r < 9; r++) vals.push(this.getCellValue(r, c));
				for (let r = 0; r < 9; r++) {
					const v = vals[r];
					if (v && vals.filter(x => x === v).length > 1) {
						const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
						const ci = (r % 3) * 3 + (c % 3);
						this.grid.blocks[bi].cells[ci].classList.add('conflict');
					}
				}
			}
			// boxes
			for (let br = 0; br < 9; br += 3) {
				for (let bc = 0; bc < 9; bc += 3) {
					const vals = [];
					for (let a = 0; a < 9; a++) {
						const r = br + Math.floor(a / 3);
						const c = bc + (a % 3);
						vals.push(this.getCellValue(r, c));
					}
					for (let a = 0; a < 9; a++) {
						const r = br + Math.floor(a / 3);
						const c = bc + (a % 3);
						const v = vals[a];
						if (v && vals.filter(x => x === v).length > 1) {
							const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
							const ci = (r % 3) * 3 + (c % 3);
							this.grid.blocks[bi].cells[ci].classList.add('conflict');
						}
					}
				}
			}
		};

		this.grid.addEventListener('focus', (evt) => {
			if (evt.target.classList.contains('app2-cell')) {
				setCellFocus(evt.target);
				this.updateCrossHighlights(evt.target);
			}
		}, true);
		this.grid.addEventListener('blur', (evt) => {
			if (evt.target.classList.contains('app2-cell')) {
				setCellFocus(null);
				this.clearCrossHighlights();
			}
		}, true);

		for (let i = 1; i <= 9; i++) {
			const btn = e(keyboard, 'button', 'app2-key', String(i));
			btn.tabIndex = -1;
			let targetCell = null;
			btn.addEventListener('mousedown', () => { targetCell = currentFocusedCell; });
			btn.addEventListener('click', () => {
				if (targetCell && !targetCell.disabled) {
					targetCell.value = String(i);
					targetCell.dispatchEvent(new Event('input', { bubbles: true }));
					targetCell.focus();
				}
			});
		}

		const backspaceBtn = e(keyboard, 'button', 'app2-key', '⌫');
		backspaceBtn.tabIndex = -1;
		let targetCell = null;
		backspaceBtn.addEventListener('mousedown', () => { targetCell = currentFocusedCell; });
		backspaceBtn.addEventListener('click', () => {
			if (targetCell && !targetCell.disabled) {
				targetCell.value = '';
				targetCell.dispatchEvent(new Event('input', { bubbles: true }));
				targetCell.focus();
			}
		});

		this.newGame();
		requestAnimationFrame(() => this.updateScale(true));
	}

	getCellValue(r, c) {
		const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
		const ci = (r % 3) * 3 + (c % 3);
		const v = this.grid.blocks[bi].cells[ci].value;
		const n = Number(v);
		return Number.isFinite(n) ? n : 0;
	}

	setBoardFromMatrix(matrix) {
		this.grid.blocks.forEach((block, bi) => block.cells.forEach((cell, ci) => {
			const r = Math.floor(bi / 3) * 3 + Math.floor(ci / 3);
			const c = (bi % 3) * 3 + (ci % 3);
			const val = matrix[r][c];
			cell.disabled = val !== 0;
			cell.value = val === 0 ? '' : String(val);
			cell.style.backgroundColor = val === 0 ? this.COLORS.EMPTY_CELL : this.COLORS.CLUE_CELL;
		}));
	}

	readMatrixFromGrid() {
		const m = Array.from({ length: 9 }, () => Array(9).fill(0));
		this.grid.blocks.forEach((block, bi) => block.cells.forEach((cell, ci) => {
			const r = Math.floor(bi / 3) * 3 + Math.floor(ci / 3);
			const c = (bi % 3) * 3 + (ci % 3);
			const n = Number(cell.value);
			m[r][c] = Number.isFinite(n) ? n : 0;
		}));
		return m;
	}

	showGridState(ok = this.COLORS.VALID, bad = this.COLORS.DEFAULT) {
		const board = this.readMatrixFromGrid();
		const valid = this.model.isBoardCompleteAndValid(board);
		this.appDiv.style.border = `8px solid ${valid ? ok : bad}`;
	}

	newGame() {
		const { puzzle } = this.model.generatePuzzle(this.selectedClues);
		this.setBoardFromMatrix(puzzle);
		this.showGridState();
	}

	solveGame() {
		this.showGridState(this.COLORS.VALID, this.COLORS.ERROR);
	}

	updateScale(init = false) {
		const fitH = document.getElementById('app2-fit-height');
		const fitW = document.getElementById('app2-fit-width');
		const scaler = document.getElementById('app2-scaler');
		if (!fitH || !fitW || !scaler || !this.wrapper) return;

		if (init || !this._scaleState.initialized) {
			const prev = scaler.style.transform;
			scaler.style.transform = 'none';
			this._scaleState.intrinsicW = this.wrapper.offsetWidth;
			this._scaleState.intrinsicH = this.wrapper.offsetHeight;
			scaler.style.transform = prev || '';
			this._scaleState.initialized = true;
			if (!this._resizeObserver && window.ResizeObserver) {
				this._resizeObserver = new ResizeObserver(() => this.updateScale(false));
				this._resizeObserver.observe(fitH);
				this._resizeObserver.observe(fitW);
				window.addEventListener('resize', this._onWindowResizeBound = () => this.updateScale(false));
			}
		}

		const availW = fitW.clientWidth;
		const availH = fitH.clientHeight;
		if (availW === this._scaleState.lastAvailW && availH === this._scaleState.lastAvailH) return;
		this._scaleState.lastAvailW = availW;
		this._scaleState.lastAvailH = availH;

		const iw = this._scaleState.intrinsicW || 1;
		const ih = this._scaleState.intrinsicH || 1;
		const sW = availW / iw;
		const sH = availH / ih;
		const s = Math.min(1, sW, sH);
		scaler.style.transform = `scale(${s})`;
		scaler.style.transformOrigin = 'top center';
	}

	setEnabled(enable) {
		const page = document.getElementById('app2-page-container');
		if (!page) return;
		page.style.display = enable ? 'flex' : 'none';
		page.style.pointerEvents = enable ? 'auto' : 'none';
		if (!enable && document.activeElement && page.contains(document.activeElement)) {
			document.activeElement.blur();
		}
		if (enable) this.updateScale(false);
	}

	cleanup() {
		const page = document.getElementById('app2-page-container');
		if (page && page.parentNode) page.parentNode.removeChild(page);
		this.wrapper = null;
		this.appDiv = null;
		if (this._resizeObserver) {
			this._resizeObserver.disconnect();
			this._resizeObserver = null;
		}
		if (this._onWindowResizeBound) {
			window.removeEventListener('resize', this._onWindowResizeBound);
			this._onWindowResizeBound = null;
		}
	}
}
