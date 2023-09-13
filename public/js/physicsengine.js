const PROBABILITY = 0.5;

export default class PhysicsEngine {
    constructor(grid) {
        this._grid = grid;
    }
    doPhysics() {
        for (let coords in this._grid.pxs) {
            let px = this._grid.getPx(coords);
            if (px.type.isGravity) {
                this._doGravity(px);
            }
            this._grid.updateCoords(coords, px.coords);
        }
    }
    _doGravity(px) {
        if (this._grid.isValidMove(px.coords, [px.x, px.y + px.size])) {
            px.updatePosition([px.x, px.y + px.size]);
        } else {
            if (px.type.isBrownian) {
                this._doBrownian(px);
                return;
            }
            if (this._grid.isValidMove(px.coords, [px.x - px.size, px.y + px.size])
                && this._grid.isClear([px.x - px.size, px.y])) {
                px.updatePosition([px.x - px.size, px.y + px.size]);
            } else if (this._grid.isValidMove(px.coords, [px.x + px.size, px.y + px.size])
                && this._grid.isClear([px.x + px.size, px.y])) {
                px.updatePosition([px.x + px.size, px.y + px.size]);
            }
        }
    }
    _doBrownian(px) {
        if (Math.random() >= PROBABILITY) {
            if (this._grid.isValidMove(px.coords, [px.x + px.size, px.y])) {
                px.updatePosition([px.x + px.size, px.y]);
            } else if (this._grid.isValidMove(px.coords, [px.x - px.size, px.y])) {
                px.updatePosition([px.x - px.size, px.y]);
            }
        } else {
            if (this._grid.isValidMove(px.coords, [px.x - px.size, px.y])) {
                px.updatePosition([px.x - px.size, px.y]);
            } else if (this._grid.isValidMove(px.coords, [px.x + px.size, px.y])) {
                px.updatePosition([px.x + px.size, px.y]);
            }
        }
    }
}