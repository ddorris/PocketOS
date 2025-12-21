export default class System {
	engine = null;
	enabled = true;
	setup() {}
	draw() {}
	windowResized() {}
	mousePressed() { return false; }
	mouseReleased() { return false; }
	mouseDragged() { return false; }
	touchStarted(event) { return false; }
	touchMoved(event) { return false; }
	touchEnded(event) { return false; }
	mouseWheel(event) { return false; }
}
