export default class GuessWordsKeyboard {
	constructor(config) {
		this.onKeyPress = config.onKeyPress || (() => { });
		this.keys = [
			['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
			['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
			['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
		];
		this.keyStates = {}; // 'correct', 'present', 'absent'
		this.isEnabled = true; // Allow toggling keyboard on/off
		this.colors = {
			default: '#818384',
			correct: '#538d4e',
			present: '#b59f3b',
			absent: '#3a3a3c',
			disabled: '#4a4a4c',
			text: '#ffffff'
		};
		this.bounds = { x: 0, y: 0, width: 0, height: 0 };
		this.keyButtons = [];
	}

	resize(x, y, width, height) {
		this.bounds = { x, y, width, height };
		this.calculateLayout();
	}

	calculateLayout() {
		this.keyButtons = [];
		const rows = this.keys.length;
		const padding = 6;
		const availableHeight = this.bounds.height - (padding * (rows + 1));
		const keyHeight = availableHeight / rows;

		// Constrain keyboard width to a reasonable max
		const maxKeyboardWidth = 500;
		const constrainedWidth = Math.min(this.bounds.width, maxKeyboardWidth);

		// Calculate max width needed for the longest row (row 0 has 10 keys)
		// Standard key width unit
		const maxKeysInRow = 10;
		const totalPaddingX = padding * (maxKeysInRow + 1);
		const keyWidth = (constrainedWidth - totalPaddingX) / maxKeysInRow;

		// Center the keyboard horizontally
		const keyboardOffsetX = this.bounds.x + (this.bounds.width - constrainedWidth) / 2;
		let currentY = this.bounds.y + padding;

		this.keys.forEach((row, rowIndex) => {
			let rowWidth = 0;
			row.forEach(key => {
				let w = keyWidth;
				if (key === 'ENTER' || key === '⌫') {
					w = keyWidth * 1.5;
				}
				rowWidth += w + padding;
			});
			rowWidth -= padding; // Remove last padding

			let currentX = keyboardOffsetX + (constrainedWidth - rowWidth) / 2;

			row.forEach(key => {
				let w = keyWidth;
				if (key === 'ENTER' || key === '⌫') {
					w = keyWidth * 1.5;
				}

				this.keyButtons.push({
					key: key,
					x: currentX,
					y: currentY,
					w: w,
					h: keyHeight
				});

				currentX += w + padding;
			});

			currentY += keyHeight + padding;
		});
	}

	updateKeyStatus(key, status) {
		// Status priority: correct > present > absent
		const current = this.keyStates[key];
		if (current === 'correct') return;
		if (current === 'present' && status === 'absent') return;

		this.keyStates[key] = status;
	}

	draw() {
		push();
		textAlign(CENTER, CENTER);
		textSize(14);

		this.keyButtons.forEach(btn => {
			const status = this.keyStates[btn.key];
			let bgColor = this.isEnabled ? this.colors.default : this.colors.disabled;

			if (this.isEnabled && status) {
				bgColor = this.colors[status];
			}

			// Draw key background with border
			fill(bgColor);
			stroke('#1a1a1a');
			strokeWeight(1);
			rect(btn.x, btn.y, btn.w, btn.h, 4);

			// Draw key text
			fill(this.colors.text);
			noStroke();
			text(btn.key, btn.x + btn.w / 2, btn.y + btn.h / 2);
		});
		pop();
	}

	setEnabled(enabled) {
		this.isEnabled = enabled;
	}

	reset() {
		this.keyStates = {};
		this.isEnabled = true;
	}

	handleClick(x, y) {
		if (!this.isEnabled) return false;

		for (const btn of this.keyButtons) {
			if (x >= btn.x && x <= btn.x + btn.w &&
				y >= btn.y && y <= btn.y + btn.h) {

				let keyToSend = btn.key;
				if (keyToSend === 'ENTER') keyToSend = 'Enter';
				if (keyToSend === '⌫') keyToSend = 'Backspace';

				this.onKeyPress(keyToSend);
				return true;
			}
		}
		return false;
	}
}