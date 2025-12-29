import View from '../../Core/View.js';

export default class GuessWordsTile extends View {
	draw({ x, y, size, letter, strokeColor, fillColor, textColor, scaleX = 1 }) {
		push();
		translate(x + size / 2, y + size / 2);
		scale(scaleX, 1);

		strokeWeight(2);
		stroke(strokeColor);
		fill(fillColor === 'transparent' ? color(0, 0, 0, 0) : fillColor);
		rectMode(CENTER);
		rect(0, 0, size, size);

		if (letter) {
			noStroke();
			fill(textColor);
			textSize(size * 0.6);
			textAlign(CENTER, CENTER);
			text(letter, 0, 0);
		}
		pop();
	}
}
