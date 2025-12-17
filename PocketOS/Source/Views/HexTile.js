import Hexagon from './Hexagon.js';
import HexTileArrow from './HexTileArrow.js';

// For flat-top hexes, arrow points to edge midpoints
// Arrow is designed to face up; rotation is 60° increments clockwise
const DIR_ANGLES = {
	up: 0,
	upRight: 60,
	downRight: 120,
	down: 180,
	downLeft: 240,
	upLeft: 300,
};

// Face color for the hex based on direction
const DIR_COLORS = {
	up: '#e53935', // red
	upLeft: '#fb8c00', // orange
	upRight: '#1e88e5', // blue
	down: '#fdd835', // yellow
	downLeft: '#8e24aa', // purple
	downRight: '#43a047', // green
};

export default class HexTile {
	constructor({ x = 0, y = 0, radius = 30, fill = '#4da3ff', arrowDir = 'up', cornerRadiusRatio = 0 } = {}) {
		this.hex = new Hexagon({ x, y, radius, fill, cornerRadiusRatio });
		this.arrowDir = arrowDir;
		// Apply face color by direction
		const face = DIR_COLORS[this.arrowDir] || this.hex.fill;
		this.hex.setStyle({ fill: face });
		this.arrow = new HexTileArrow({ stroke: '#ffffff', strokeWeight: Math.max(3, Math.round(radius * 0.12)) });
	}

	setPosition(x, y) {
		this.hex.setPosition(x, y);
	}

	setStyle(style) {
		this.hex.setStyle(style);
	}

	setArrow(dir) {
		if (DIR_ANGLES[dir]) {
			this.arrowDir = dir;
			const face = DIR_COLORS[dir];
			if (face) this.hex.setStyle({ fill: face });
		}
	}

	draw(p) {
		this.hex.draw(p);
		this.arrow.draw(p, { x: this.hex.x, y: this.hex.y, radius: this.hex.radius, angleDeg: DIR_ANGLES[this.arrowDir] ?? 270 });
	}
}
