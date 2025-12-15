import System from './System.js';

export default class CanvasSystem extends System {
	constructor({ backgroundColor = [26, 26, 26] } = {}) {
		super();
		this.backgroundColor = backgroundColor;
	}

	setup() {
		createCanvas(windowWidth, windowHeight);
		smooth();
		document.querySelector('canvas.p5Canvas').style.imageRendering = 'auto';
		pixelDensity(2);
	}

	draw() { background(...this.backgroundColor); }
	windowResized() { resizeCanvas(windowWidth, windowHeight); }
}
