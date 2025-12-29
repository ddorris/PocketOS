// Manages a row of AppIconButton instances for the home screen
import View from '../Core/View.js';
import AppIconButton from './AppIconButton.js';

export default class AppDock extends View {
	constructor({ spacing = 78, size = 64, labelSize = 11, dockHeight = 120, padding = 16 } = {}) {
		super();
		this.appData = [];
		this.spacing = spacing;
		this.size = size;
		this.labelSize = labelSize;
		this.dockHeight = dockHeight;
		this.padding = padding;
		this.buttons = [];
		this.scrollOffset = 0;
		this.maxScroll = 0;
		this.isDragging = false;
		this.dragStartX = 0;
		this.dragStartOffset = 0;
		this.activeAppId = null;
		this.storageKey = 'PocketOS.activeAppId';
	}

	setup() {
		this.appData = this.engine.state.apps || [];
		this.buildButtons();
		this.onSelect(this.activeAppId);
	}

	buildButtons() {
		this.buttons.length = 0;
		for (const app of this.appData) {
			this.buttons.push(
				new AppIconButton({
					id: app.id,
					name: app.name,
					icon: loadImage(app.icon),
					onSelect: () => this.handleSelect(app.id)
				})
			);
		}
		// Default to stored id, else provided id, else first app
		const storedId = this.getStoredActiveAppId();
		if (storedId) {
			this.activeAppId = storedId;
		} else if (!this.activeAppId && this.appData.length > 0) {
			this.activeAppId = this.appData[0].id;
		}

		this.applySelectionState();
		this.layoutButtons();
	}

	draw() {
		// Draw dock background
		noStroke();
		fill(18);
		rect(0, 0, width, this.dockHeight);
		stroke(50);
		strokeWeight(1);
		line(0, this.dockHeight - 1, width, this.dockHeight - 1);

		this.layoutButtons();

		push();
		this.applyClip();
		for (const btn of this.buttons) {
			btn.update(mouseX, mouseY);
			btn.display();
		}
		this.clearClip();
		pop();
	}

	onSelect(appId) {
		for (let i = 0; i < this.engine.apps.length; i++) {
			const app = this.engine.apps[i];
			if (app) {
				app.enabled = (appId === i + 1); // app IDs are 1-based
			}
		}
	}

	handleSelect(appId) {
		const isNewSelection = this.activeAppId !== appId;
		if (isNewSelection) {
			this.activeAppId = appId;
			this.applySelectionState();
			this.persistActiveAppId(appId);
		}
		this.onSelect(appId); // Always notify, even if re-selecting same app
	}

	getStoredActiveAppId() {
		try {
			if (typeof localStorage === 'undefined') return null;
			const raw = localStorage.getItem(this.storageKey);
			const parsed = raw ? parseInt(raw, 10) : null;
			const exists = this.appData.some(app => app.id === parsed);
			return exists ? parsed : null;
		} catch (e) {
			return null;
		}
	}

	persistActiveAppId(appId) {
		try {
			if (typeof localStorage === 'undefined') return;
			localStorage.setItem(this.storageKey, String(appId));
		} catch (e) {
			// ignore storage errors in constrained environments
		}
	}

	applySelectionState() {
		for (const btn of this.buttons) {
			btn.setSelected(btn.id === this.activeAppId);
		}
	}

	layoutButtons() {
		const count = this.buttons.length;
		const contentWidth = count > 0 ? (count - 1) * this.spacing + this.size : 0;
		const availableWidth = width - this.padding * 2;
		this.maxScroll = Math.max(0, contentWidth + this.padding * 2 - width);
		this.scrollOffset = constrain(this.scrollOffset, 0, this.maxScroll);

		const fits = contentWidth <= availableWidth;
		const startX = fits ? (width - contentWidth) / 2 : this.padding - this.scrollOffset;
		const labelGap = 6; // match AppIconButton label offset
		const totalHeight = this.size + labelGap + this.labelSize;

		for (let i = 0; i < count; i++) {
			const btn = this.buttons[i];
			btn.x = startX + i * this.spacing;
			btn.y = (this.dockHeight - totalHeight) / 2;
		}
	}

	applyClip() {
		drawingContext.save();
		drawingContext.beginPath();
		drawingContext.rect(0, 0, width, this.dockHeight);
		drawingContext.clip();
	}

	clearClip() { drawingContext.restore(); }
	windowResized() { this.layoutButtons(); }

	mouseWheel(event) {
		const deltaY = event?.delta ?? 0;
		if (this.maxScroll <= 0) return false;
		this.scrollOffset += deltaY * 0.5;
		this.layoutButtons();
		return true;
	}

	mouseDragged() {
		if (!this.isDragging) return false;
		const deltaX = mouseX - this.dragStartX;
		this.scrollOffset = this.dragStartOffset - deltaX;
		this.layoutButtons();
		return true;
	}

	mousePressed() {
		if (mouseY > this.dockHeight) return false;
		this.isDragging = true;
		this.dragStartX = mouseX;
		this.dragStartOffset = this.scrollOffset;
		for (const btn of this.buttons) {
			if (btn.handlePress(mouseX, mouseY)) return true;
		}
		return false;
	}

	mouseReleased() {
		this.isDragging = false;
		if (mouseY > this.dockHeight) return false;
		for (const btn of this.buttons) {
			if (btn.handleRelease(mouseX, mouseY)) return true;
		}
		return false;
	}

	touchStarted() {
		if (mouseY > this.dockHeight) return false;
		this.isDragging = true;
		this.dragStartX = mouseX;
		this.dragStartOffset = this.scrollOffset;
		for (const btn of this.buttons) {
			if (btn.handlePress(mouseX, mouseY)) return true;
		}
		return false;
	}

	touchMoved() {
		if (!this.isDragging) return false;
		const deltaX = mouseX - this.dragStartX;
		this.scrollOffset = this.dragStartOffset - deltaX;
		this.layoutButtons();
		return true;
	}

	touchEnded() {
		this.isDragging = false;
		if (mouseY > this.dockHeight) return false;
		for (const btn of this.buttons) {
			if (btn.handleRelease(mouseX, mouseY)) return true;
		}
		return false;
	}
}
