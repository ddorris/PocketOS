import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';

// Direct port of Doku (Sudoku) using DOM; works exactly like Doku but controlled by this.enabled
export default class App2 extends System {
	constructor() {
		super();
		this.wrapper = null;
		this.appDiv = null;
		this.GLOBAL = { board: null, grid: null, gui: null, selectedDifficulty: null };
		this.DIFFICULTY_LEVEL = { EASY: 56, MEDIUM: 46, HARD: 36, TESTING: 79, SOLVED: 81 };
		this.COLORS = { EMPTY_CELL: 'white', CLUE_CELL: '#ddd', VALID: '#1c1', ERROR: '#e22', DEFAULT: '#eee' };
		this.appDockHeight = 120;
		this._canvasEventsDisabled = false;
		this._scaleState = { initialized: false, lastAvailW: 0, lastAvailH: 0, intrinsicW: 0, intrinsicH: 0 };
		this._resizeObserver = null;
	}

	setup() {
		const appInfo = this.engine.state.apps.find(app => app.id === 2);
		if (appInfo && appInfo.icon) {
			const icon = loadImage(appInfo.icon);
			this.appInfo = new AppInfo({ info: appInfo, icon });
		}
		this.injectHTMLAndStyles();
		this.ready();
	}

	// Inject HTML structure and load external CSS exactly like Doku
	injectHTMLAndStyles() {
		// Inject Google Font once
		if (!document.getElementById('app2-font')) {
			const link = document.createElement('link');
			link.id = 'app2-font';
			link.rel = 'stylesheet';
			link.href = 'https://fonts.googleapis.com/css2?family=Varela+Round&display=swap';
			document.head.appendChild(link);
		}

		// Inject App2 CSS once
		if (!document.getElementById('app2-style')) {
			const link = document.createElement('link');
			link.id = 'app2-style';
			link.rel = 'stylesheet';
			link.href = 'Styles/App2.css';
			document.head.appendChild(link);
		}

		// Check if already injected (root guard is the page container)
		if (document.getElementById('app2-page-container')) return;

		// Create container hierarchy: page-container > fit-height > fit-width > wrapper (visual border) > app (content)
		const pageContainer = document.createElement('div');
		pageContainer.id = 'app2-page-container';
		document.body.appendChild(pageContainer);

		const fitHeightContainer = document.createElement('div');
		fitHeightContainer.id = 'app2-fit-height';
		pageContainer.appendChild(fitHeightContainer);

		const fitWidthContainer = document.createElement('div');
		fitWidthContainer.id = 'app2-fit-width';
		fitHeightContainer.appendChild(fitWidthContainer);

		// Scaler sits between fit containers and visual wrapper
		const scaler = document.createElement('div');
		scaler.id = 'app2-scaler';
		fitWidthContainer.appendChild(scaler);

		// Visual wrapper (white border)
		this.wrapper = document.createElement('div');
		this.wrapper.id = 'app2-wrapper';
		scaler.appendChild(this.wrapper);

		// Content div
		this.appDiv = document.createElement('div');
		this.appDiv.id = 'app2-app';
		this.wrapper.appendChild(this.appDiv);
	}

	// Doku algorithms (unchanged)
	shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
	isValid(row, col, num) {
		for (let r = 0; r < 9; r++) {
			const br = 3 * Math.floor(row / 3) + Math.floor(r / 3);
			const bc = 3 * Math.floor(col / 3) + (r % 3);
			if (this.GLOBAL.board[row][r] === num || this.GLOBAL.board[r][col] === num || this.GLOBAL.board[br][bc] === num) { return false; }
		}
		return true;
	}
	solveBoard() {
		const empty = this.GLOBAL.board.flatMap((row, r) => row.map((v, c) => (v ? null : [r, c]))).filter(Boolean)[0] || null;
		if (!empty) return true;
		const [r, c] = empty;
		const nums = this.shuffle([...Array(9).keys()].map(n => n + 1));
		for (const n of nums) {
			if (this.isValid(r, c, n)) {
				this.GLOBAL.board[r][c] = n;
				if (this.solveBoard()) return true;
				this.GLOBAL.board[r][c] = 0;
			}
		}
		return false;
	}
	generatePuzzle() {
		this.GLOBAL.board = Array.from({ length: 9 }, () => Array(9).fill(0));
		this.solveBoard();
		const positions = this.shuffle(Array.from({ length: 81 }, (_, k) => [Math.floor(k / 9), k % 9]));
		let clues = 81;
		for (const [r, c] of positions) {
			if (clues === this.GLOBAL.selectedDifficulty) break;
			this.GLOBAL.board[r][c] = 0;
			clues--;
		}
	}

	showGridState(ok = this.COLORS.VALID, bad = this.COLORS.DEFAULT) {
		let n = true;
		for (let r = 0; r < 9; r++) {
			const row = [], col = [], box = [];
			for (let a = 0; a < 9; a++) {
				// row r, column a
				row.push(this.getCellValue(r, a));
				// column r, row a
				col.push(this.getCellValue(a, r));
				// box r, index a inside the box
				const br = Math.floor(r / 3) * 3;
				const bc = (r % 3) * 3;
				box.push(this.getCellValue(br + Math.floor(a / 3), bc + (a % 3)));
			}
			[row, col, box].forEach(arr => { if (!(arr.every(v => v >= 1 && v <= 9) && new Set(arr).size === arr.length)) { n = false; } });
		}
		this.appDiv.style.border = `8px solid ${n ? ok : bad}`;
	}
	getCellValue(r, c) {
		const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
		const ci = (r % 3) * 3 + (c % 3);
		const v = this.GLOBAL.grid.blocks[bi].cells[ci].value;
		const n = Number(v);
		return Number.isFinite(n) ? n : 0;
	}
	newGame() {
		this.generatePuzzle();
		const apply = (el, val) => {
			el.disabled = val !== 0;
			el.value = val === 0 ? '' : String(val);
			el.style.backgroundColor = val === 0 ? this.COLORS.EMPTY_CELL : this.COLORS.CLUE_CELL;
		};
		this.GLOBAL.grid.blocks.forEach((block, bi) => block.cells.forEach((cell, ci) => {
			const r = Math.floor(bi / 3) * 3 + Math.floor(ci / 3);
			const c = (bi % 3) * 3 + (ci % 3);
			apply(cell, this.GLOBAL.board[r][c]);
		}));
		this.showGridState();
	}
	solveGame() { this.showGridState(this.COLORS.VALID, this.COLORS.ERROR); }

	// Exact Doku ready() logic but using our class DOM elements
	ready() {
		const e = (parent, tag = 'div', cls = null, text = null) => {
			const o = document.createElement(tag);
			if (cls) o.className = cls;
			if (text) o.textContent = text;
			if (parent) parent.appendChild(o);
			return o;
		};

		// Block events from bubbling up to p5's document/window listeners (bubble phase)
		// This allows inputs/buttons to work but prevents p5 from seeing events
		const stopBubble = (evt) => {
			evt.stopPropagation();
		};
		const bubbleEvents = ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'wheel', 'contextmenu', 'change', 'input'];
		for (const eventType of bubbleEvents) {
			this.wrapper.addEventListener(eventType, stopBubble, false);
		}

		// Grid
		this.GLOBAL.grid = e(this.appDiv, 'div', 'app2-grid');
		this.GLOBAL.grid.setAttribute('role', 'grid');
		this.GLOBAL.grid.blocks = [];
		for (let t = 0; t < 9; t++) {
			const block = e(this.GLOBAL.grid, 'div', 'app2-block');
			block.cells = [];
			for (let r = 0; r < 9; r++) {
				const input = e(block, 'input', 'app2-cell');
				input.maxLength = 1;
				input.value = '';
				input.setAttribute('inputmode', 'numeric');
				input.setAttribute('autocomplete', 'off');
				input.setAttribute('role', 'gridcell');
				// Doku's approach: accept anything, blank out non-numbers via isNaN
				input.addEventListener('input', () => { input.value = isNaN(input.value) ? '' : input.value; });
				block.cells.push(input);
			}
			this.GLOBAL.grid.blocks.push(block);
		}
		this.GLOBAL.grid.addEventListener('input', () => { this.showGridState(); this.highlightConflicts(); });

		// GUI
		this.GLOBAL.gui = e(this.appDiv, 'div', 'app2-gui');
		const labelEl = e(this.GLOBAL.gui, 'label', null, 'DIFFICULTY:');
		const select = e(this.GLOBAL.gui, 'select', 'app2-dropdown');
		select.id = 'app2-difficulty';
		labelEl.setAttribute('for', 'app2-difficulty');
		for (let key in this.DIFFICULTY_LEVEL) {
			const opt = e(select, 'option');
			opt.value = key;
			opt.text = key.charAt(0) + key.slice(1).toLowerCase();
		}
		this.GLOBAL.selectedDifficulty = this.DIFFICULTY_LEVEL[select.value];
		select.addEventListener('change', () => { this.GLOBAL.selectedDifficulty = this.DIFFICULTY_LEVEL[select.value]; });
		e(this.GLOBAL.gui, 'button', 'app2-button', 'New').addEventListener('click', () => this.newGame());
		e(this.GLOBAL.gui, 'button', 'app2-button', 'Solve').addEventListener('click', () => this.solveGame());

		// On-screen keyboard for digits 1-9
		const keyboard = e(this.appDiv, 'div', 'app2-keyboard');
		let currentFocusedCell = null;

		// Track which cell is focused and show visual feedback
		const setCellFocus = (cell) => {
			if (currentFocusedCell) currentFocusedCell.classList.remove('focused');
			currentFocusedCell = cell;
			if (cell) cell.classList.add('focused');
		};

		// Cross highlight helpers
		this.clearCrossHighlights = () => {
			this.GLOBAL.grid.blocks.forEach(b => b.cells.forEach(c => c.classList.remove('cross')));
		};
		this.updateCrossHighlights = (cell) => {
			if (!cell) return;
			this.clearCrossHighlights();
			// find r,c of the cell
			let rIdx = -1, cIdx = -1;
			for (let r = 0; r < 9; r++) {
				for (let c = 0; c < 9; c++) {
					const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
					const ci = (r % 3) * 3 + (c % 3);
					if (this.GLOBAL.grid.blocks[bi].cells[ci] === cell) { rIdx = r; cIdx = c; break; }
				}
				if (rIdx !== -1) break;
			}
			if (rIdx === -1) return;
			// highlight row and column
			for (let c = 0; c < 9; c++) {
				const bi = Math.floor(rIdx / 3) * 3 + Math.floor(c / 3);
				const ci = (rIdx % 3) * 3 + (c % 3);
				this.GLOBAL.grid.blocks[bi].cells[ci].classList.add('cross');
			}
			for (let r = 0; r < 9; r++) {
				const bi = Math.floor(r / 3) * 3 + Math.floor(cIdx / 3);
				const ci = (r % 3) * 3 + (cIdx % 3);
				this.GLOBAL.grid.blocks[bi].cells[ci].classList.add('cross');
			}
			// highlight box
			const br = Math.floor(rIdx / 3) * 3;
			const bc = Math.floor(cIdx / 3) * 3;
			for (let a = 0; a < 9; a++) {
				const r = br + Math.floor(a / 3);
				const c = bc + (a % 3);
				const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
				const ci = (r % 3) * 3 + (c % 3);
				this.GLOBAL.grid.blocks[bi].cells[ci].classList.add('cross');
			}
		};

		// Conflict highlighting
		this.highlightConflicts = () => {
			// Clear previous
			this.GLOBAL.grid.blocks.forEach(b => b.cells.forEach(c => c.classList.remove('conflict')));
			// rows
			for (let r = 0; r < 9; r++) {
				const vals = [];
				for (let c = 0; c < 9; c++) {
					const v = this.getCellValue(r, c);
					vals.push(v);
				}
				for (let c = 0; c < 9; c++) {
					const v = vals[c];
					if (v && vals.filter(x => x === v).length > 1) {
						const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
						const ci = (r % 3) * 3 + (c % 3);
						this.GLOBAL.grid.blocks[bi].cells[ci].classList.add('conflict');
					}
				}
			}
			// columns
			for (let c = 0; c < 9; c++) {
				const vals = [];
				for (let r = 0; r < 9; r++) {
					vals.push(this.getCellValue(r, c));
				}
				for (let r = 0; r < 9; r++) {
					const v = vals[r];
					if (v && vals.filter(x => x === v).length > 1) {
						const bi = Math.floor(r / 3) * 3 + Math.floor(c / 3);
						const ci = (r % 3) * 3 + (c % 3);
						this.GLOBAL.grid.blocks[bi].cells[ci].classList.add('conflict');
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
							this.GLOBAL.grid.blocks[bi].cells[ci].classList.add('conflict');
						}
					}
				}
			}
		};

		this.GLOBAL.grid.addEventListener('focus', (evt) => {
			if (evt.target.classList.contains('app2-cell')) {
				setCellFocus(evt.target);
				this.updateCrossHighlights(evt.target);
			}
		}, true);
		this.GLOBAL.grid.addEventListener('blur', (evt) => {
			if (evt.target.classList.contains('app2-cell')) {
				setCellFocus(null);
				this.clearCrossHighlights();
			}
		}, true);

		// Create digit buttons 1-9 in a single row
		for (let i = 1; i <= 9; i++) {
			const btn = e(keyboard, 'button', 'app2-key', String(i));
			btn.tabIndex = -1; // Prevent button from taking focus
			let targetCell = null;
			// Capture focused cell on mousedown before blur occurs
			btn.addEventListener('mousedown', () => {
				targetCell = currentFocusedCell;
			});
			btn.addEventListener('click', () => {
				if (targetCell && !targetCell.disabled) {
					targetCell.value = String(i);
					targetCell.dispatchEvent(new Event('input', { bubbles: true }));
					targetCell.focus(); // Restore focus to the cell
				}
			});
		}

		// Backspace button to clear the current cell
		const backspaceBtn = e(keyboard, 'button', 'app2-key', '⌫');
		backspaceBtn.tabIndex = -1;
		let targetCell = null;
		backspaceBtn.addEventListener('mousedown', () => {
			targetCell = currentFocusedCell;
		});
		backspaceBtn.addEventListener('click', () => {
			if (targetCell && !targetCell.disabled) {
				targetCell.value = '';
				targetCell.dispatchEvent(new Event('input', { bubbles: true }));
				targetCell.focus();
			}
		});

		// Start a new game
		this.newGame();

		// Initialize scaling on next frame to ensure DOM has laid out
		requestAnimationFrame(() => this.updateScale(true));
	}

	updateScale(init = false) {
		const fitH = document.getElementById('app2-fit-height');
		const fitW = document.getElementById('app2-fit-width');
		const scaler = document.getElementById('app2-scaler');
		if (!fitH || !fitW || !scaler || !this.wrapper) return;

		// Measure intrinsic size once (or when forced)
		if (init || !this._scaleState.initialized) {
			const prev = scaler.style.transform;
			scaler.style.transform = 'none';
			this._scaleState.intrinsicW = this.wrapper.offsetWidth;
			this._scaleState.intrinsicH = this.wrapper.offsetHeight;
			scaler.style.transform = prev || '';
			this._scaleState.initialized = true;
			// Setup resize observer once
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

	draw() {
		const page = document.getElementById('app2-page-container');
		if (!page) return;
		const enable = !!this.enabled;
		page.style.display = enable ? 'flex' : 'none';
		page.style.pointerEvents = enable ? 'auto' : 'none';

		// If disabling while an input is focused, blur it to avoid capturing keys
		if (!enable && document.activeElement && page.contains(document.activeElement)) {
			document.activeElement.blur();
		}

		// Update scale when active (uses cached intrinsic sizes)
		if (enable) this.updateScale(false);

		// Toggle canvas interactivity so right-click / clicks do not go to p5 when Sudoku is active
		if (enable !== this._canvasEventsDisabled) {
			const canvases = Array.from(document.getElementsByTagName('canvas'));
			for (const c of canvases) {
				c.style.pointerEvents = enable ? 'none' : '';
				c.style.zIndex = enable ? '0' : '';
			}
			this._canvasEventsDisabled = enable;
		}
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
		this.GLOBAL = { board: null, grid: null, gui: null, selectedDifficulty: null };
	}
}
