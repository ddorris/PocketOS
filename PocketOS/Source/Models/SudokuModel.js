// Encapsulated Sudoku domain model: board generation, solving, validation
export default class SudokuModel {
	constructor() { }

	createEmptyBoard() {
		return Array.from({ length: 9 }, () => Array(9).fill(0));
	}

	// Fisher–Yates shuffle
	shuffle(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	isValid(board, row, col, num) {
		for (let r = 0; r < 9; r++) {
			const br = 3 * Math.floor(row / 3) + Math.floor(r / 3);
			const bc = 3 * Math.floor(col / 3) + (r % 3);
			if (board[row][r] === num || board[r][col] === num || board[br][bc] === num) return false;
		}
		return true;
	}

	// Backtracking solver; mutates board in place, returns true if solved
	solve(board) {
		const empty = this.findEmpty(board);
		if (!empty) return true;
		const [r, c] = empty;
		const nums = this.shuffle([...Array(9).keys()].map(n => n + 1));
		for (const n of nums) {
			if (this.isValid(board, r, c, n)) {
				board[r][c] = n;
				if (this.solve(board)) return true;
				board[r][c] = 0;
			}
		}
		return false;
	}

	findEmpty(board) {
		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				if (!board[r][c]) return [r, c];
			}
		}
		return null;
	}

	// Returns { puzzle, solution } boards as 9x9 arrays
	generatePuzzle(cluesCount = 46) {
		const solution = this.createEmptyBoard();
		this.solve(solution);

		const puzzle = solution.map(row => row.slice());
		const positions = this.shuffle(Array.from({ length: 81 }, (_, k) => [Math.floor(k / 9), k % 9]));

		let filled = 81;
		for (const [r, c] of positions) {
			if (filled === cluesCount) break;
			puzzle[r][c] = 0;
			filled--;
		}

		return { puzzle, solution };
	}

	// Valid and complete (1..9 without duplicates) in each row/col/box
	isBoardCompleteAndValid(board) {
		const inRange = v => v >= 1 && v <= 9;
		for (let r = 0; r < 9; r++) {
			const row = [], col = [], box = [];
			for (let a = 0; a < 9; a++) {
				row.push(board[r][a]);
				col.push(board[a][r]);
				const br = Math.floor(r / 3) * 3;
				const bc = (r % 3) * 3;
				box.push(board[br + Math.floor(a / 3)][bc + (a % 3)]);
			}
			if (![row, col, box].every(arr => arr.every(inRange) && new Set(arr).size === arr.length)) return false;
		}
		return true;
	}
}
