export default class AppIconButton {
	constructor(config) {
		this.id = config.id;
		this.label = config.name;
		this.icon = config.icon;
		this.x = config.x || 0;
		this.y = config.y || 0;
		this.size = config.size || 64;
		this.labelSize = config.labelSize || 11;
		this.isHovered = false;
		this.isPressed = false;
		this.isSelected = config.isSelected || false;
		this.onSelect = config.onSelect || (() => { });
	}

	isMouseOver(mx, my) {
		return (
			mx >= this.x &&
			mx <= this.x + this.size &&
			my >= this.y &&
			my <= this.y + this.size
		);
	}
	
	handlePress(mx, my) {
		if (this.isMouseOver(mx, my)) {
			this.isPressed = true;
			return true;
		}
		return false;
	}
	
	handleRelease(mx, my) {
		if (this.isPressed && this.isMouseOver(mx, my)) {
			this.onSelect();
			this.isPressed = false;
			return true;
		}
		this.isPressed = false;
		return false;
	}

	setSelected(isSelected) { this.isSelected = isSelected; }
	update(mx, my) { this.isHovered = this.isMouseOver(mx, my);	}
	
	display() {
		push();

		const cornerRadius = this.size * 0.22; // Proportional to icon size (matches SVG viewBox ratio)

		// Icon background (selection indicator)
		if (this.isSelected) {
			// Subtle fill behind selected icon
			noStroke();
			fill(255, 255, 255, 20);
			rect(this.x, this.y, this.size, this.size, cornerRadius);

			// Clean border around selected icon
			stroke(255, 255, 255, 180);
			strokeWeight(2);
			noFill();
			rect(this.x, this.y, this.size, this.size, cornerRadius);
		} else if (this.isPressed || this.isHovered) {
			// Minimal feedback for interaction
			noStroke();
			fill(255, 255, 255, this.isPressed ? 16 : 10);
			rect(this.x, this.y, this.size, this.size, cornerRadius);
		}

		// Draw icon
		noStroke();
		if (this.icon) {
			image(this.icon, this.x, this.y, this.size, this.size);
		}

		// Draw label with selection emphasis
		fill(this.isSelected ? 255 : 200);
		noStroke();
		textAlign(CENTER, TOP);
		textSize(this.labelSize);
		text(this.label, this.x + this.size / 2, this.y + this.size + 6);

		pop();
	}
}
