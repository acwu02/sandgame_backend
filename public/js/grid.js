export default class Grid {
    constructor(canvas, pxSize) {
        this.pxs = {};
        this._canvas = canvas,
        this._pxSize = pxSize;
    }
    getPx(coords) {
        if (this.pxs[coords]) return this.pxs[coords];
        else return -1;
    }
    isInBounds(coords) {
        let x = coords[0];
        let y = coords[1];
        return (x < this._canvas.width && x >= 0
            && y < this._canvas.height && y >= 0);
    }
   isClear(coords) {
        if (this.getPx(coords) === -1) return true;
        return false;
    }
    isValidMove(oldCoords, newCoords) {
        if (this.isInBounds(newCoords)) {
            if (this.isClear(newCoords)) {
                return true;
            } else if (this.getPx(oldCoords).type.isOpaque === true
                && this.getPx(newCoords).type.isOpaque === false) {
                return true;
            }
        }
        return false;
    }
    changeCoords(cursorX, cursorY) {
        let x = Math.ceil(cursorX / this._pxSize) * this._pxSize;
        let y = Math.ceil(cursorY / this._pxSize) * this._pxSize;
        return [x, y];
    }
    addPx(px) {
        let coords = px.coords;
        this.pxs[coords] = px;
    }
    removePx(px) {
        px.drawOver();
        delete this.pxs[px.coords];
    }
    updateCoords(oldCoords, newCoords) {
        let px = this.getPx(oldCoords);
        delete this.pxs[oldCoords];
        this.pxs[newCoords] = px;
    }
}