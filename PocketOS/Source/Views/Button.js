export default class Button {
	constructor(config) {
		this.x = config.x ?? 0;
		this.y = config.y ?? 0;
		this.width = config.width ?? 60;
		this.height = config.height ?? 40;
		this.label = config.label ?? '';
		this.icon = config.icon; // Optional: Image object
		this.onClick = config.onClick;
		this.id = config.id;
		this.isActive = false;
		this.cornerRadius = config.cornerRadius ?? 5;

		// Style config (defaults can be overridden per instance)
		this.colors = {
			default: config.bgColor ?? '#2a2a2c',
			active: config.hoverColor ?? config.bgColor ?? '#4a4a4c',
			text: config.textColor ?? '#ffffff',
			stroke: config.strokeColor ?? '#000000'
		};
	}

	setBounds(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	setLabel(label) {
		this.label = label;
	}

	setColors({ bgColor, hoverColor, textColor, strokeColor }) {
		if (bgColor) this.colors.default = bgColor;
		if (hoverColor) this.colors.active = hoverColor;
		if (textColor) this.colors.text = textColor;
		if (strokeColor) this.colors.stroke = strokeColor;
	}

	contains(mx, my) {
		return mx >= this.x && mx <= this.x + this.width && my >= this.y && my <= this.y + this.height;
	}

	draw() {
		push();
		translate(this.x, this.y);

		// Background
		fill(this.isActive ? this.colors.active : this.colors.default);
		stroke(this.colors.stroke);
		rect(0, 0, this.width, this.height, this.cornerRadius);

		// Icon (if loaded)
		let textY = this.height / 2;
		if (this.icon) {
			const iconSize = Math.min(this.width, this.height) * 0.6;
			imageMode(CENTER);
			image(this.icon, this.width / 2, this.height * 0.4, iconSize, iconSize);
			textY = this.height * 0.85;
		}

		// Label
		fill(this.colors.text);
		noStroke();
		textAlign(CENTER, CENTER);
		textSize(12);
		text(this.label, this.width / 2, textY);

		pop();
	}

	checkClick(mx, my) {
		if (this.contains(mx, my)) {
			if (this.onClick) this.onClick(this.id);
			return true;
		}
		return false;
	}
}