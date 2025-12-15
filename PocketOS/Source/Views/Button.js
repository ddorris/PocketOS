export default class Button {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width;
        this.height = config.height;
        this.label = config.label;
        this.icon = config.icon; // Optional: Image object
        this.onClick = config.onClick;
        this.id = config.id;
        this.isActive = false;
        
        // Style config
        this.colors = {
            default: '#2a2a2c',
            active: '#4a4a4c',
            text: '#ffffff'
        };
    }

    draw(p) {
        push();
        translate(this.x, this.y);
        
        // Background
        fill(this.isActive ? this.colors.active : this.colors.default);
        stroke(0);
        rect(0, 0, this.width, this.height, 5); // Rounded corners

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
        if (mx >= this.x && mx <= this.x + this.width &&
            my >= this.y && my <= this.y + this.height) {
            if (this.onClick) this.onClick(this.id);
            return true;
        }
        return false;
    }
}