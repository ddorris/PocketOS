import Button from './Button.js';
import Sudoku from '../Models/Sudoku.js';
import SudokuBoard from './SudokuBoard.js';
import SudokuKeyboard from './SudokuKeyboard.js';

// p5-based Sudoku view: mirrors WebSudoku behavior using canvas
export default class SudokuGame {
	constructor({ isEnabled } = {}) {
		this.model = new Sudoku();
		this.board = new SudokuBoard({});
		this.keyboard = new SudokuKeyboard({ onKeyPress: (k) => this.handleKey(k) });

		this.appDockHeight = 120;
		this.headerHeight = 60;
		this.keyboardHeight = 70;
		this.wrapperPadding = 20;
		this.headerGap = 10;
		this.contentMaxWidth = 550; // match WebSudoku max width
		this.viewportPadding = 12; // adjustable outer margin around the game
		this.controlFontSize = 16;
		this.diffFixedWidth = 100; // fixed width to prevent layout shift

		this.difficulties = [
			{ key: 'Solved', clues: 81, rating: 0 },
			{ key: 'Testing', clues: 79, rating: 1 },
			{ key: 'Easy', clues: 65, rating: 2 },
			{ key: 'Medium', clues: 50, rating: 3 },
			{ key: 'Hard', clues: 35, rating: 4 },
			{ key: 'Evil', clues: 25, rating: 5 }
		];
		this.unused_difficulties = [
		];
		this.diffIndex = 2;
		this.selectedClues = this.difficulties[this.diffIndex].clues;

		const bHoverColor = '#818384';
		const bBgColor = '#818384';
		const bTextColor = '#ffffff';
		const bStrokeColor = '#818384';
		const bCornerRadius = 4;

		this.newButton = new Button({ id: 'new', label: 'New', x: 0, y: 0, width: 90, height: 40, bgColor: bBgColor, hoverColor: bHoverColor, textColor: bTextColor, strokeColor: bStrokeColor, cornerRadius: bCornerRadius, fontSize: 16, onClick: () => this.newGame() });
		this.solveButton = new Button({ id: 'solve', label: 'Solve', x: 0, y: 0, width: 90, height: 40, bgColor: bBgColor, hoverColor: bHoverColor, textColor: bTextColor, strokeColor: bStrokeColor, cornerRadius: bCornerRadius, fontSize: 16, onClick: () => this.solveGame() });
		this.diffButton = new Button({ id: 'difficulty', label: this.difficulties[this.diffIndex].key, x: 0, y: 0, width: 100, height: 40, bgColor: bBgColor, hoverColor: bHoverColor, textColor: bTextColor, strokeColor: bStrokeColor, cornerRadius: bCornerRadius, fontSize: 16, onClick: () => this.cycleDifficulty() });
		// Ensure local Varela Round font is available to canvas text
		if (!document.getElementById('app2-font-local')) {
			const style = document.createElement('style');
			style.id = 'app2-font-local';
			style.textContent = `@font-face { font-family: 'Varela Round'; src: url('./PocketOS/Assets/Fonts/VarelaRound-Regular.ttf') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }`;
			document.head.appendChild(style);
		}

		this.newGame();

		// Optional enabled predicate provided by App2 to gate keyboard input
		this.isEnabled = typeof isEnabled === 'function' ? isEnabled : () => true;
		this.keyListener = null;
		this.setupKeyListener();
	}

	cycleDifficulty() {
		this.diffIndex = (this.diffIndex + 1) % this.difficulties.length;
		const d = this.difficulties[this.diffIndex];
		this.selectedClues = d.clues;
		this.diffButton.label = d.key.charAt(0) + d.key.slice(1).toLowerCase();
	}

	newGame() {
		const { puzzle } = this.model.generatePuzzle(this.selectedClues);
		this.board.setPuzzle(puzzle);
		this.updateValidationBorder();
	}

	solveGame() {
		const ok = this.model.isBoardCompleteAndValid(this.board.readMatrix());
		this.board.borderColor = ok ? '#1c1' : '#e22';
	}

	handleKey(key) {
		if (key === '⌫' || key === 'Backspace') {
			this.board.setValueAtFocus(0);
		} else if (/^[1-9]$/.test(key)) {
			this.board.setValueAtFocus(Number(key));
		}
		this.updateValidationBorder();
	}

	draw() {
		// Compute padded viewport
		const pad = this.viewportPadding;
		this.viewBounds = { x: pad, y: pad, w: width - pad * 2, h: height - pad * 2 };

		// Background area below app dock (full canvas width/height)
		noStroke();
		fill(20);
		rect(0, this.appDockHeight, width, height - this.appDockHeight);

		// Set global font for canvas draws to match WebSudoku
		textFont('Varela Round');

		this.calculateLayout();

		// Wrapper around board + controls, with validation border
		this.drawWrapper();

		// Board
		this.board.draw();

		// Controls (difficulty + buttons) below the board inside wrapper
		this.drawHeader();

		// Keyboard (no top divider line)
		this.keyboard.draw();
	}

	drawHeader() {
		const x = this.wrapperRect.x + this.wrapperPadding;
		const w = this.wrapperRect.w - this.wrapperPadding * 2;
		const y = this.controlsRect.y;

		// we are going to change font styles so we should save/restore
		push();

		// Label + buttons
		noStroke();
		fill(151);
		textAlign(LEFT, CENTER);
		textFont('Varela Round');
		textStyle(BOLD);
		const label = 'DIFFICULTY:';
		let fs = this.controlFontSize;
		let spacing = 10; // gap between elements
		let padX = 24;    // horizontal padding inside buttons

		// Compute widths with fixed diff button width and right-aligned New/Solve
		const compute = () => {
			textSize(fs);
			const labelWidth = textWidth(label) + 12;
			const diffW = this.diffFixedWidth; // fixed
			const newW = Math.ceil(textWidth(this.newButton.label) + padX);
			const solveW = Math.ceil(textWidth(this.solveButton.label) + padX);
			// Total if we placed them in a line; used only to see if we need to compress
			const total = labelWidth + spacing + diffW + spacing + newW + spacing + solveW;
			return { labelWidth, diffW, newW, solveW, total };
		};

		let dims = compute();
		while (dims.total > w && (fs > 12 || padX > 14 || spacing > 6)) {
			if (fs > 12) fs -= 1; else if (padX > 14) padX -= 2; else if (spacing > 6) spacing -= 1;
			dims = compute();
		}

		// Apply font size to buttons
		this.diffButton.fontSize = fs;
		this.newButton.fontSize = fs;
		this.solveButton.fontSize = fs;

		// Draw label
		textSize(fs);
		const labelY = y + this.headerHeight / 2 - 8;
		text(label, x, labelY);

		// Difficulty meter bar (rounded rect with fill level for number of clues out of 81 total cells)
		// First draw the background bar, right underneath the label that says "DIFFICULTY:"
		const meterX = x;
		const meterY = labelY + 15;
		const meterW = dims.diffW;
		const meterH = 8;
		// Filled portion based on difficulty rating
		const rating = this.difficulties[this.diffIndex].rating;
		const maxRating = this.difficulties.length - 1;
		// Instead of one bar, draw the units as discrete segments for clarity
		const segments = maxRating;
		const segmentGap = 4;
		const segmentW = (meterW - segmentGap * (segments - 1)) / segments;
		for (let i = 0; i < segments; i++) {
			const sx = meterX + i * (segmentW + segmentGap);
			if (i < rating) {
				fill('#ff6600');
			} else {
				fill('#666');
			}
			rect(sx, meterY, segmentW, meterH, meterH / 2);
		}

		const cy = y + (this.headerHeight - this.diffButton.height) / 2;

		// Left: fixed-width difficulty button after label
		const diffX = x + dims.labelWidth + spacing;
		this.diffButton.setBounds(diffX, cy, dims.diffW, this.diffButton.height);
		this.diffButton.draw();

		// Right: align Solve, then New from right edge
		let rightX = x + w;
		const solveX = rightX - dims.solveW;
		this.solveButton.setBounds(solveX, cy, dims.solveW, this.solveButton.height);
		this.solveButton.draw();

		rightX = solveX - spacing;
		const newX = rightX - dims.newW;
		this.newButton.setBounds(newX, cy, dims.newW, this.newButton.height);
		this.newButton.draw();

		// restore font styles
		pop();
	}

	drawWrapper() {
		const r = this.wrapperRect;
		push();
		noFill();
		// outline, not drop shadow
		strokeWeight(8);
		stroke(30);
		rect(r.x, r.y, r.w, r.h, 16);
		// white panel
		fill(30);
		rect(r.x, r.y, r.w, r.h, 16);
		// validation border
		strokeWeight(8);
		stroke(this.board.borderColor || '#333');
		noFill();
		rect(r.x + 6, r.y + 6, r.w - 12, r.h - 12, 10);
		pop();
	}

	calculateLayout() {
		const vb = this.viewBounds || { x: 0, y: 0, w: width, h: height };
		const originX = vb.x;
		const originY = vb.y;
		const viewW = vb.w;
		const viewH = vb.h;

		// Keyboard rect (clamped width and centered)
		const kbW = Math.min(viewW, this.contentMaxWidth);
		const kbX = originX + (viewW - kbW) / 2;
		const kbY = originY + viewH - this.keyboardHeight;
		this.kbRect = { x: kbX, y: kbY, w: kbW, h: this.keyboardHeight };
		this.keyboard.resize(kbX, kbY, kbW, this.keyboardHeight);

		// Available area above keyboard for wrapper (board + controls + padding)
		const availTop = originY + this.appDockHeight;
		const availBottom = kbY;
		const availH = Math.max(0, availBottom - availTop);
		const wrapMaxW = Math.min(viewW, this.contentMaxWidth);
		const innerW = wrapMaxW - this.wrapperPadding * 2;

		// Compute tile size to fit both width and height constraints
		const gridNeededH = 9; // tiles vertically
		const controlsAndGaps = this.headerHeight + this.headerGap + this.wrapperPadding * 2;
		const maxTileByW = innerW / 9;
		const maxTileByH = (availH - controlsAndGaps) / 9;
		const tileSize = Math.max(16, Math.floor(Math.min(maxTileByW, maxTileByH)));

		const gap = 0;
		const boardW = (tileSize * 9) + (gap * 8);
		const boardH = (tileSize * 9) + (gap * 8);

		const wrapW = boardW + this.wrapperPadding * 2;
		const wrapH = this.wrapperPadding + boardH + this.headerGap + this.headerHeight + this.wrapperPadding;
		const wrapX = originX + (viewW - wrapW) / 2;
		const wrapY = availTop + (availH - wrapH) / 2;
		this.wrapperRect = { x: wrapX, y: wrapY, w: wrapW, h: wrapH };

		const boardX = wrapX + this.wrapperPadding;
		const boardY = wrapY + this.wrapperPadding;
		this.board.setLayout({ x: boardX, y: boardY, tileSize, gap });
		this.boardRect = { x: boardX, y: boardY, w: boardW, h: boardH };

		const controlsY = boardY + boardH + this.headerGap;
		this.controlsRect = { x: boardX, y: controlsY, w: boardW, h: this.headerHeight };
	}

	mousePressed(mx, my) {
		// Header buttons
		if (this.newButton.checkClick(mx, my)) return true;
		if (this.solveButton.checkClick(mx, my)) return true;
		if (this.diffButton.checkClick(mx, my)) return true;

		// Keyboard
		if (this.keyboard.handleClick(mx, my)) return true;

		// Grid focus
		this.board.setFocusByPixel(mx, my);
		return true;
	}

	updateValidationBorder() {
		const ok = this.model.isBoardCompleteAndValid(this.board.readMatrix());
		this.board.borderColor = ok ? '#1c1' : '#333';
	}

	setupKeyListener() {
		if (this.keyListener) {
			document.removeEventListener('keydown', this.keyListener);
		}
		this.keyListener = (e) => {
			if (!this.isEnabled()) return;
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			const key = e.key;
			if (key === 'Enter') { e.preventDefault(); return; }
			if (key === 'Backspace' || /^[1-9]$/.test(key)) {
				e.preventDefault();
				this.handleKey(key);
			}
		};
		document.addEventListener('keydown', this.keyListener);
	}

	cleanup() {
		if (this.keyListener) {
			document.removeEventListener('keydown', this.keyListener);
			this.keyListener = null;
		}
	}
}
