import View from '../Core/View.js';

export default class AppInfo extends View {
	constructor({ info, icon }) {
		super();
		this.info = info;
		this.icon = icon;
	}

	display(x, y, options = {}) {
		const {
			iconDisplaySize = 128,
			nameSize = 32,
			descriptionSize = 16,
			textColor = 255,
			showIcon = true,
			showName = true,
			showDescription = true,
			iconOffsetY = -50,
			nameOffsetY = 60,
			descriptionOffsetY = 100
		} = options;

		// Display app icon with explicit size
		if (showIcon && this.icon) {
			push();
			noStroke();
			image(
				this.icon,
				x - iconDisplaySize / 2,
				y - iconDisplaySize / 2 + iconOffsetY,
				iconDisplaySize,
				iconDisplaySize
			);
			pop();
		}

		// Display app name
		if (showName && this.info && this.info.name) {
			noStroke();
			fill(textColor);
			textSize(nameSize);
			textAlign(CENTER, CENTER);
			text(this.info.name, x, y + nameOffsetY);
		}

		// Display app description
		if (showDescription && this.info && this.info.description) {
			noStroke();
			fill(textColor);
			textSize(descriptionSize);
			textAlign(CENTER, TOP);
			text(this.info.description, x, y + descriptionOffsetY);
		}
	}
}
