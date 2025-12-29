import View from '../../Core/View.js';
import GuessWordsTile from './GuessWordsTile.js';
import Button from '../Button.js';

export default class GuessWordsHeader extends View {
	constructor({ maxWidth, colors, onToggleCheat, onReset }) {
		super();
		this.maxWidth = maxWidth;
		this.colors = colors;
		this.tile = new GuessWordsTile();
		this.onToggleCheat = onToggleCheat;
		this.onReset = onReset;
		this.message = null;
		this.messageTimer = 0;
		this.messageKind = 'info';
		this.cheatButton = new Button({
			x: 0, y: 0, width: 50, height: 40,
			label: '?',
			bgColor: '#565758',
			hoverColor: '#6a6a6c',
			onClick: () => this.onToggleCheat?.()
		});
		this.resetButton = new Button({
			x: 0, y: 0, width: 60, height: 40,
			label: 'Reset',
			bgColor: '#565758',
			hoverColor: '#6a6a6c',
			onClick: () => this.onReset?.()
		});
	}

	setMessage(msg, durationMs = 2000, kind = 'info') {
		this.message = msg;
		this.messageTimer = millis() + durationMs;
		this.messageKind = kind;
	}

	draw({ width, yStart, height, model, isCheatRevealed }) {
		// Background band for header
		push();
		noStroke();
		fill(30);
		rect(0, yStart, width, height);
		pop();

		const constrainedWidth = Math.min(width, this.maxWidth);
		const headerOffsetX = (width - constrainedWidth) / 2;
		const headerRowY = yStart + height / 2;
		// centered within header
		const messageY = yStart + height / 2;

		// Determine reveal state per letter (only submitted rows contribute)
		const revealState = Array(5).fill(false);
		for (let r = 0; r < 6; r++) {
			const rowResult = model.results?.[r];
			if (!rowResult) continue; // only reveal submitted guesses
			for (let i = 0; i < 5; i++) {
				if (rowResult[i] === 'correct') revealState[i] = true;
			}
		}

		// If cheat or game over, reveal all
		const forceRevealAll = isCheatRevealed || model.gameStatus !== 'playing';

		// Draw word as tiles (inline with buttons)
		const tileSize = 42;
		const gap = 8;
		const totalWidth = tileSize * 5 + gap * 4;
		const startX = headerOffsetX + (constrainedWidth - totalWidth) / 2;
		const y = headerRowY;

		for (let i = 0; i < 5; i++) {
			const revealed = forceRevealAll || revealState[i];
			const letter = revealed ? model.targetWord[i] : '';
			const fillColor = revealed ? this.colors.correct : color(0, 0, 0, 0);
			const strokeColor = revealed ? this.colors.correct : this.colors.border;

			this.tile.draw({
				x: startX + i * (tileSize + gap),
				y: y - tileSize / 2,
				size: tileSize,
				letter,
				strokeColor,
				fillColor,
				textColor: this.colors.text
			});
		}

		// Determine message (timed only; no lingering status)
		const isActiveMessage = this.message && millis() < this.messageTimer;
		const headerMessage = isActiveMessage ? this.message : '';

		if (headerMessage) {
			const palette = {
				info: { fill: '#000000', stroke: '#ffffff', text: '#ffffff' },
				win: { fill: '#2e7d32', stroke: '#ffffff', text: '#ffffff' },
				loss: { fill: '#b71c1c', stroke: '#ffffff', text: '#ffffff' }
			};
			const theme = palette[this.messageKind] || palette.info;

			push();
			const paddingX = 50;
			const paddingY = 4;
			textSize(14);
			textStyle(BOLD);
			const textWidthVal = textWidth(headerMessage);
			const rectWidth = textWidthVal + paddingX * 2;
			const rectHeight = 20 + paddingY * 2;
			const rectX = headerOffsetX + (constrainedWidth - rectWidth) / 2;
			const rectY = messageY - rectHeight / 2;
			stroke(theme.stroke);
			strokeWeight(2);
			fill(theme.fill);
			rect(rectX, rectY, rectWidth, rectHeight, rectHeight / 2);

			noStroke();
			fill(theme.text);
			textAlign(CENTER, CENTER);
			text(headerMessage, headerOffsetX + constrainedWidth / 2, messageY);
			pop();
		}

		// Draw buttons always visible (aligned to edges of constrained width)
		const buttonTop = headerRowY - this.cheatButton.height / 2;
		this.cheatButton.y = buttonTop;
		this.cheatButton.x = headerOffsetX + 10;

		this.resetButton.y = buttonTop;
		this.resetButton.x = headerOffsetX + constrainedWidth - this.resetButton.width - 10;

		this.cheatButton.draw();
		this.resetButton.draw();
	}

	handleClick(x, y) {
		if (this.cheatButton.checkClick(x, y)) return true;
		if (this.resetButton.checkClick(x, y)) return true;
		return false;
	}
}
