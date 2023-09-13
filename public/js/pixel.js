export default class Pixel {
    constructor(x, y, type, grid, canvas, size) {
        this.x = x;
        this.y = y;
        this.type = type;
        this._grid = grid;
        this._canvas = canvas;
        this.size = size;
        this.coords = [x, y];
        this.draw();
        this._grid.addPx(this);
    }
    updatePosition(coords) {
        this.drawOver();
        this._updateLabel([this.x, this.y], coords);
        this.x = coords[0];
        this.y = coords[1];
        this.coords = [this.x, this.y];
        this.draw();
    }
    /* Updates canvas aria-label for accessibility purposes. */
    _updateLabel(oldCoords, newCoords) {
        let label = this._canvas.getAttribute("aria-label");
        let oldPxLabel = `${oldCoords[0]}, ${oldCoords[1]}`;
        let newPxLabel = `${newCoords[0]}, ${newCoords[1]}`;
        if (label.includes(oldPxLabel)) {
            let replacedLabel = label.replace(oldPxLabel, newPxLabel);
            this._canvas.setAttribute("aria-label", replacedLabel);
        } else {
            label = `${label} Pixel at ${newPxLabel} of type ${this.type.name}`;
            this._canvas.setAttribute("aria-label", label);
        }
    }
    draw() {
        let ctx = this._canvas.getContext("2d");
        ctx.fillStyle = this.type.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    drawOver() {
        let ctx = this._canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}