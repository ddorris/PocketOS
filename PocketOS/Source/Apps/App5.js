import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';
import GuessWordsModel from '../Models/GuessWordsModel.js';
import Keyboard from '../Views/Keyboard.js';
import GuessWordsHeader from '../Views/GuessWordsHeader.js';
import GuessWordsGameBoard from '../Views/GuessWordsGameBoard.js';

const COLORS = {
	correct: '#538d4e',
	present: '#b59f3b',
	absent: '#3a3a3c',
	empty: '#121213',
	border: '#3a3a3c',
	activeBorder: '#565758',
	filledBorder: '#818384',
	text: '#ffffff'
};

export default class App5 extends System {
	constructor() {
		super();
		this.model = null;
		this.keyboard = null;
		this.keyListener = null;
		this.appInfo = null;
		this.isCheatRevealed = false;
		this.maxHeaderWidth = 480;
		this.appDockHeight = 120;
		this.headerHeight = 70;
		this.keyboardHeight = 180;
		this.messageTimeouts = [];
		this.header = new GuessWordsHeader({
			maxWidth: this.maxHeaderWidth,
			colors: COLORS,
			onToggleCheat: () => { this.isCheatRevealed = !this.isCheatRevealed; },
			onReset: () => this.startGame()
		});
		this.gameBoard = new GuessWordsGameBoard({ colors: COLORS });
	}

	async setup() {
		const appInfo = this.engine.state.apps.find(app => app.id === 5);
		if (appInfo && appInfo.icon) {
			const icon = loadImage(appInfo.icon);
			this.appInfo = new AppInfo({ info: appInfo, icon });
		}

		// Get word list URLs from bundle
		const wordListUrls = appInfo?.bundle?.wordLists || {};

		// Initialize model with URLs from manifest
		this.model = new GuessWordsModel(wordListUrls);
		try {
			await this.model.init();
		} catch (e) {
			this.showMessage("Error loading dictionary.");
			return;
		}

		// Initialize keyboard
		this.keyboard = new Keyboard({
			onKeyPress: (key) => this.handleInput(key)
		});

		// Setup keyboard event listener
		this.setupKeyListener();

		this.startGame();
	}

	setupKeyListener() {
		if (this.keyListener) {
			document.removeEventListener('keydown', this.keyListener);
		}
		this.keyListener = (e) => {
			// Ignore all keyboard input when app is not enabled
			if (!this.enabled) return;
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (e.key === 'Enter') e.preventDefault();
			this.handleInput(e.key);
		};
		document.addEventListener('keydown', this.keyListener);
	}

	startGame() {
		this.model.startNewGame();
		this.gameBoard.resetAnimations();
		this.isCheatRevealed = false;
		this.clearMessageQueue();
		this.header.setMessage(null, 0);
		this.keyboard.reset();
	}

	draw() {
		if (this.enabled === false) return;
		if (!this.keyboard || !this.model) return; // Wait for initialization

		this.calculateLayout();

		// Draw background
		noStroke();
		fill(20);
		rect(0, this.appDockHeight, width, height - this.appDockHeight);

		// Draw header area and controls
		this.header.draw({
			width,
			yStart: this.appDockHeight,
			height: this.headerHeight,
			model: this.model,
			isCheatRevealed: this.isCheatRevealed
		});

		// Draw grid
		this.gameBoard.draw({
			model: this.model,
			tileSize: this.tileSize,
			gap: this.gap,
			offsetX: this.offsetX,
			offsetY: this.offsetY,
			results: this.model.results
		});

		// Draw keyboard
		this.keyboard.draw(this);
	}

	calculateLayout() {
		const gridAreaHeight = height - this.appDockHeight - this.headerHeight - this.keyboardHeight;

		const maxW = width / 5;
		const maxH = gridAreaHeight / 6;

		// Larger tiles for mobile while fitting 5x6 grid
		this.tileSize = Math.min(maxW, maxH) * 0.92;
		this.gap = this.tileSize * 0.06;

		this.gridWidth = (this.tileSize * 5) + (this.gap * 4);
		this.gridHeight = (this.tileSize * 6) + (this.gap * 5);

		this.offsetX = (width - this.gridWidth) / 2;
		this.offsetY = this.appDockHeight + this.headerHeight + (gridAreaHeight - this.gridHeight) / 2;

		// Keyboard layout
		if (this.keyboard) {
			this.keyboard.resize(0, height - this.keyboardHeight, width, this.keyboardHeight);
		}

		// Header positions derived inside header component; only offsets needed above
	}

	handleInput(key) {
		const isEnter = key === 'Enter' || key === 'ENTER';
		if (this.model.gameStatus !== 'playing') {
			if (isEnter) this.startGame();
			return;
		}

		if (key === 'Backspace' || key === '⌫') {
			this.model.deleteLetter();
		} else if (isEnter) {
			this.submitGuess();
		} else if (/^[a-zA-Z]$/.test(key)) {
			this.addLetter(key.toUpperCase());
		}
	}

	addLetter(letter) {
		if (this.model.addLetter(letter)) {
			this.gameBoard.addPop(this.model.currentRow, this.model.currentTile - 1);
		}
	}

	submitGuess() {
		const resultObj = this.model.submitGuess();

		if (resultObj.status === 'error') {
			this.showMessage(resultObj.message, 'info');
			return;
		}

		this.updateKeyboard(resultObj.guess, resultObj.result);

		if (resultObj.gameStatus === 'won') {
			this.runMessageSequence([
				{ text: 'Splendid!', kind: 'win', duration: 1000 },
				{ text: 'You Win!', kind: 'win', duration: 1200 }
			]);
		} else if (resultObj.gameStatus === 'lost') {
			this.runMessageSequence([
				{ text: 'Answer: ' + resultObj.targetWord, kind: 'loss', duration: 1400 },
				{ text: 'Game Over', kind: 'loss', duration: 1200 }
			]);
		}
	}

	updateKeyboard(guess, result) {
		guess.split('').forEach((char, i) => {
			this.keyboard.updateKeyStatus(char, result[i]);
		});
	}

	clearMessageQueue() {
		this.messageTimeouts.forEach(clearTimeout);
		this.messageTimeouts = [];
	}

	showMessage(msg, kind = 'info', duration = 2000) {
		this.clearMessageQueue();
		this.header.setMessage(msg, duration, kind);
	}

	runMessageSequence(sequence) {
		this.clearMessageQueue();
		let startOffset = 0;
		sequence.forEach((item, index) => {
			const delay = item.delay !== undefined ? item.delay : startOffset;
			const duration = item.duration ?? 2000;
			const timerId = setTimeout(() => {
				this.header.setMessage(item.text, duration, item.kind ?? 'info');
			}, delay);
			this.messageTimeouts.push(timerId);
			startOffset = (item.delay !== undefined ? item.delay : startOffset) + duration;
		});
	}

	mousePressed() {
		if (mouseY < this.appDockHeight) return false;
		// Check header buttons first
		if (this.header.handleClick(mouseX, mouseY)) return true;
		// Then check keyboard
		if (this.keyboard.handleClick(mouseX, mouseY)) return true;
		return false;
	}

	touchStarted() { return this.mousePressed(); }

	cleanup() {
		if (this.keyListener) {
			document.removeEventListener('keydown', this.keyListener);
			this.keyListener = null;
		}
	}
}
