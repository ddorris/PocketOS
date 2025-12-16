// DATA
const GLOBAL = { board: null, app: null, grid: null, gui: null, selectedDifficulty: null },
	DIFFICULTY_LEVEL = { EASY: 56, MEDIUM: 46, HARD: 36, TESTING: 79, SOLVED: 81 },
	COLORS = { EMPTY_CELL: "white", CLUE_CELL: "#ddd", VALID: "#1c1", ERROR: "#e22", DEFAULT: "#eee" };
// SUDOKU PUZZLE GENERATOR
function generatePuzzle() {
	function shuffle(e) {
		for (let t = e.length - 1; t > 0; t--) {
			const n = Math.floor(Math.random() * (t + 1));
			[e[t], e[n]] = [e[n], e[t]];
		}
		return e;
	}
	function isValid(e, t, n) {
		for (let r = 0; r < 9; r++) {
			const o = 3 * Math.floor(e / 3) + Math.floor(r / 3);
			const l = 3 * Math.floor(t / 3) + r % 3;
			if (GLOBAL.board[e][r] === n || GLOBAL.board[r][t] === n || GLOBAL.board[o][l] === n) { return false; }
		}
		return true;
	}
	function solve() {
		const e = GLOBAL.board.flatMap((e, t) => e.map((n, r) => (n ? null : [t, r]))).filter(Boolean)[0] || null;
		if (!e) { return true; }
		let [t, n] = e;
		let r = shuffle([...Array(9).keys()].map((e) => e + 1));
		for (let o of r) {
			if (isValid(t, n, o)) {
				GLOBAL.board[t][n] = o;
				if (solve()) { return true; }
				GLOBAL.board[t][n] = 0;
			}
		}
		return false;
	}
	GLOBAL.board = Array.from({ length: 9 }, () => Array(9).fill(0));
	solve();
	let positions = shuffle(Array.from({ length: 81 }, (e, t) => [Math.floor(t / 9), t % 9]));
	let clues = 81;
	for (let [e, t] of positions) {
		if (clues === GLOBAL.selectedDifficulty) { break; }
		GLOBAL.board[e][t] = 0;
		clues--;
	}
}

// WEB APP
function showGridState(e = COLORS.VALID, t = COLORS.DEFAULT) {
	let n = true;
	for (let r = 0; r < 9; r++) {
		let o = [], l = [], i = [];
		for (let a = 0; a < 9; a++) {
			o.push(GLOBAL.grid.blocks[r].cells[a].value);
			l.push(GLOBAL.grid.blocks[Math.floor(a / 3) + (r % 3) * 3].cells[a % 3 + Math.floor(r / 3) * 3].value);
			i.push(GLOBAL.grid.blocks[Math.floor(r / 3) * 3 + Math.floor(a / 3)].cells[r % 3 * 3 + a % 3].value);
		}
		[o, l, i].forEach((e) => { if (!(e.every((e) => e >= 1 && e <= 9) && new Set(e).size === e.length)) { n = false; } });
	}
	GLOBAL.app.style.border = "8px solid " + (n ? e : t);
}
function newGame() {
	generatePuzzle();
	function e(e, t) {
		e.disabled = t !== 0;
		e.value = t === 0 ? "" : t.toString();
		e.style.backgroundColor = t === 0 ? COLORS.EMPTY_CELL : COLORS.CLUE_CELL;
	}
	GLOBAL.grid.blocks.forEach((t, n) => t.cells.forEach((t, r) => e(t, GLOBAL.board[Math.floor(n / 3) * 3 + Math.floor(r / 3)][n % 3 * 3 + r % 3])));
	showGridState();
}
function solveGame() { showGridState(COLORS.VALID, COLORS.ERROR); }
function ready() {
	function e(e, t, n, r) {
		const o = document.createElement(t || "div");
		if (n) { o.className = n; }
		if (r) { o.textContent = r; }
		if (e) { e.appendChild(o); }
		return o;
	}
	GLOBAL.app = document.getElementById("app");
	// MAKE GRID
	GLOBAL.grid = e(GLOBAL.app, "div", "grid");
	GLOBAL.grid.blocks = [];
	for (let t = 0; t < 9; t++) {
		const n = e(GLOBAL.grid, "div", "block");
		n.cells = [];
		for (let r = 0; r < 9; r++) {
			const o = e(n, "input", "cell");
			o.maxLength = 1;
			o.value = "";
			o.addEventListener("input", () => { o.value = isNaN(o.value) ? "" : o.value; });
			n.cells.push(o);
		}
		GLOBAL.grid.blocks.push(n);
	}
	GLOBAL.grid.addEventListener("input", () => showGridState());
	// MAKE GUI
	GLOBAL.gui = e(GLOBAL.app, "div");
	e(GLOBAL.gui, "label", null, "DIFFICULTY:");
	const t = e(GLOBAL.gui, "select", "dropdown");
	for (let n in DIFFICULTY_LEVEL) {
		const r = e(t, "option");
		r.value = n;
		r.text = n.charAt(0) + n.slice(1).toLowerCase();
	}
	GLOBAL.selectedDifficulty = DIFFICULTY_LEVEL[t.value];
	t.addEventListener("change", () => { GLOBAL.selectedDifficulty = DIFFICULTY_LEVEL[t.value]; });
	e(GLOBAL.gui, "button", "button", "New").addEventListener("click", newGame);
	e(GLOBAL.gui, "button", "button", "Solve").addEventListener("click", solveGame);
	// START A NEW GAME
	newGame();
}
document.addEventListener("DOMContentLoaded", ready);