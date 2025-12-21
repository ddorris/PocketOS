export default class GuessWordsModel {
	constructor() {
		this.answers = [];
		this.validWords = new Set();
		this.targetWord = '';
		this.currentRow = 0;
		this.currentTile = 0;
		this.guesses = [];
		this.results = [];
		this.gameStatus = 'playing'; // playing, won, lost
		this.attemptedGuesses = new Set(); // Track guesses to prevent duplicates
		this.wordListUrls = {answers: '', allowed: ''};
	}

	async init() {
		if (this.answers.length === 0) {
			try {
				const [answersRes, allowedRes] = await Promise.all([
					fetch(this.wordListUrls.answers),
					fetch(this.wordListUrls.allowed)
				]);

				if (!answersRes.ok || !allowedRes.ok) throw new Error("Failed to fetch word lists");

				const answersText = await answersRes.text();
				const allowedText = await allowedRes.text();

				this.answers = answersText.split(/\r?\n/)
					.map(w => w.trim().toUpperCase())
					.filter(w => w.length === 5);

				const allowed = allowedText.split(/\r?\n/)
					.map(w => w.trim().toUpperCase())
					.filter(w => w.length === 5);

				this.validWords = new Set([...this.answers, ...allowed]);
			} catch (e) {
				console.error("Failed to load words", e);
				throw e;
			}
		}
		this.startNewGame();
	}

	startNewGame() {
		this.targetWord = this.answers[Math.floor(Math.random() * this.answers.length)];
		this.currentRow = 0;
		this.currentTile = 0;
		this.guesses = Array(6).fill(null).map(() => Array(5).fill(''));
		this.results = Array(6).fill(null);
		this.gameStatus = 'playing';
		this.attemptedGuesses.clear(); // Reset attempted guesses for new game
	}

	addLetter(letter) {
		if (this.gameStatus !== 'playing') return false;
		if (this.currentTile < 5 && this.currentRow < 6) {
			this.guesses[this.currentRow][this.currentTile] = letter;
			this.currentTile++;
			return true; // Letter added
		}
		return false;
	}

	deleteLetter() {
		if (this.gameStatus !== 'playing') return false;
		if (this.currentTile > 0) {
			this.currentTile--;
			this.guesses[this.currentRow][this.currentTile] = '';
			return true; // Letter deleted
		}
		return false;
	}

	submitGuess() {
		if (this.gameStatus !== 'playing') return { status: 'error', message: 'Game over' };

		const row = this.guesses[this.currentRow];
		const guess = row.join('');

		if (guess.length !== 5) {
			return { status: 'error', message: 'Not enough letters' };
		}

		if (!this.validWords.has(guess)) {
			return { status: 'error', message: 'Not in word list' };
		}

		if (this.attemptedGuesses.has(guess)) {
			return { status: 'error', message: 'Already guessed' };
		}

		// Add to attempted guesses
		this.attemptedGuesses.add(guess);

		const result = this.checkGuess(guess, this.targetWord);
		const currentRowIndex = this.currentRow;
		this.results[currentRowIndex] = result;

		if (guess === this.targetWord) {
			this.gameStatus = 'won';
		} else {
			if (this.currentRow >= 5) {
				this.gameStatus = 'lost';
			} else {
				this.currentRow++;
				this.currentTile = 0;
			}
		}

		return {
			status: 'success',
			result,
			guess,
			rowIndex: currentRowIndex,
			gameStatus: this.gameStatus,
			targetWord: this.targetWord
		};
	}

	getResultForRow(rowIndex) {
		return this.results[rowIndex] || null;
	}

	checkGuess(guess, target) {
		const result = Array(5).fill('absent');
		const targetArr = target.split('');
		const guessArr = guess.split('');

		// First pass: Correct position
		guessArr.forEach((char, i) => {
			if (char === targetArr[i]) {
				result[i] = 'correct';
				targetArr[i] = null;
				guessArr[i] = null;
			}
		});

		// Second pass: Wrong position
		guessArr.forEach((char, i) => {
			if (char !== null && targetArr.includes(char)) {
				result[i] = 'present';
				targetArr[targetArr.indexOf(char)] = null;
			}
		});

		return result;
	}
}
