import Grid from "./grid.js";
import PhysicsEngine from "./physicsengine.js";
import Pixel from "./pixel.js";
import apiRequest from "./apirequest.js";
import GoogleAuth from "./googleauth.js";

const CLIENT_ID = "104576196378-e5u7o8ahfl73d344kgm8m07rpd82j0qb.apps.googleusercontent.com";

let auth = null;

const PX_SIZE = 5;
const PHYSICS_INTERVAL_DEFAULT = 20;
const CANVAS_WIDTH_DESKTOP = 500;
const CANVAS_HEIGHT_DESKTOP = 250;
const CANVAS_HEIGHT_MOBILE = 250 + 0.3 * window.innerHeight;

class Game {
    constructor() {
        this.elements = {
            sand: {
                name: "sand",
                isGravity: true,
                isBrownian: false,
                isOpaque: true,
                color: "yellow"
            },
            water: {
                name: "water",
                isGravity: true,
                isBrownian: true,
                isOpaque: false,
                color: "blue"
            },
            stone: {
                name: "stone",
                isGravity: false,
                isBrownian: false,
                isOpaque: true,
                color: "gray",
            },
            erase
        }
        this._canvas = document.querySelector("#canvas");
        this._rect = this._canvas.getBoundingClientRect();

        this._grid = new Grid(this._canvas, PX_SIZE);
        this._physicsEngine = new PhysicsEngine(this._grid);

        this._onClick = this._onClick.bind(this);
        this._onLogin = this._onLogin.bind(this);
        this._handleChangeElem = this._handleChangeElem.bind(this);
        this._handleData = this._handleData.bind(this);
        this._handleDelete = this._handleDelete.bind(this);
        this._onSpacebar = this._onSpacebar.bind(this);

        this._canvas.addEventListener("click", this._onClick);
        for (let button of document.querySelectorAll(".elementButton")) {
            button.addEventListener("click", this._handleChangeElem);
        }
        for (let button of document.querySelectorAll(".saveButton")) {
            button.addEventListener("click", this._handleData);
        }
        for (let button of document.querySelectorAll(".deleteButton")) {
            button.addEventListener("click", this._handleDelete);
        }
        this._currElem = this.elements.sand;
        this._welcome = document.querySelector("#welcome");

        this._physicsInterval = PHYSICS_INTERVAL_DEFAULT;
        this._intervalID = null;

        /* For accessibility purposes, we decrease the physics interval so screen reader can
        better capture px positions*/
        this._accessmessage = document.querySelector("#accessmessage");
        this._access = document.querySelector("#access");
        this._onAccess = this._onAccess.bind(this);
        this._access.addEventListener("click", this._onAccess);
        this._isAccessible = false;

        /* For resizing canvas for displays under 500px, since we have defined height/width in HTML
        and cannot dynamically change them with CSS */
        this._display = "desktop";
        this._initWindow();
        this._onLoad();
    }
    /* Here we check the current device's display so we can abbreviate the innerHTML content of the
    save buttons (see below), so they can fit in the actual button. */
    _initWindow() {
        if (window.innerWidth < CANVAS_WIDTH_DESKTOP) {
            this._canvas.width = window.innerWidth;
            this._canvas.height = CANVAS_HEIGHT_MOBILE;
            this._display = "mobile";
        } else if (window.innerWidth > CANVAS_WIDTH_DESKTOP) {
            this._canvas.width = CANVAS_WIDTH_DESKTOP;
            this._canvas.height = CANVAS_HEIGHT_DESKTOP
        }
    }
    _onLoad() {
        auth = new GoogleAuth(CLIENT_ID);
        auth.render(document.querySelector("#loginForm"), this._onLogin);
        this._togglePhysics(this._physicsInterval);
        this._initSaves();
    }
    async _onLogin(idToken) {
        let data = await apiRequest("POST", "/login", { idToken });
        window.API_KEY = data.apiKey;
        let name = await apiRequest("GET", "/protected", null, window.API_KEY);
        this._welcome.innerHTML = `Welcome, ${name}`;
    }
    _togglePhysics(interval) {
        if (this._intervalID === null) {
            this._intervalID = setInterval(() => {
                this._physicsEngine.doPhysics();
            }, interval);
        } else {
            clearInterval(this._intervalID);
            this._intervalID = setInterval(() => {
                this._physicsEngine.doPhysics();
            }, interval);
        }
    }
    /* Upon changing to accessibility mode, we make it so that the physics engine is manually triggered upon
    pressing spacebar, so the screen reader can read every single pixel */
    _onAccess() {
        if (this._isAccessible === false) {
            this._isAccessible = true;
            clearInterval(this._intervalID);
            document.addEventListener('keydown', this._onSpacebar);
            this._access.innerHTML = "Turn off accessibility";
            this._accessmessage.innerHTML = "Accessibility mode activated. Press spacebar to execute physics iteration.";
        } else {
            this._isAccessible = false;
            this._physicsInterval = PHYSICS_INTERVAL_DEFAULT;
            this._togglePhysics(this._physicsInterval);
            this._access.innerHTML = "Turn on accessibility";
            this._accessmessage.innerHTML = "";
        }
    }
    _onSpacebar(event) {
        if (event.key === ' ') {
            this._physicsEngine.doPhysics();
        }
    }
    async _initSaves() {
        for (let button of document.querySelectorAll(".saveButton")) {
            let id = button.id;
            let save = await apiRequest("GET", `/saves/${id}`);
            if (save.isUsed === "false") {
                button.classList.add("free");
            } else if (save.isUsed === "true") {
                button.classList.add("used");
                let date = save.dateSaved;
                // Here we slice the date if on a mobile viewport so the innerHTML can fit in the button
                if (this._display === "mobile") {
                    date = date.slice(0, 10);
                }
                button.innerHTML = button.innerHTML.slice(0, 8);
                button.innerHTML += date;
            }
        }
    }
    _onClick(event) {
        let coords = this._grid.changeCoords(
            event.clientX - this._rect.left,
            event.clientY - this._rect.top
        );
        let x = coords[0];
        let y = coords[1];
        if (this._currElem === this.elements.erase) {
            let pxToRemove = this._grid.getPx([x, y])
            if (pxToRemove != -1) {
                this._grid.removePx(pxToRemove);
            }
        } else {
            let px = new Pixel(x, y, this._currElem, this._grid, this._canvas, PX_SIZE);
        }
    }
    _handleChangeElem(event) {
        let button = event.target;
        this._currElem = this.elements[button.id];
    }
    async _handleData(event) {
        let button = event.target;
        if (button.classList.contains("free")) {
            this._handleSave(button);
        } else if (button.classList.contains("used")) {
            this._handleLoad(button);
        }
    }
    async _handleSave(button) {
        button.classList.remove("free");
        button.classList.add("used");
        let date = new Date();
        date = JSON.stringify(date);
        date = date.slice(1, date.length - 1);
        button.innerHTML = button.innerHTML.slice(0, 8);
        // Here we slice the date if on a mobile viewport so the innerHTML can fit in the button
        if (this._display === "mobile") {
            date = date.slice(0, 10);
        }
        button.innerHTML += date;
        let pxsJSON = this.toJSON(this._grid.pxs);
        let body = {
            date: date,
            pxs: pxsJSON
        };
        await apiRequest("POST", `/saves/${button.id}`, body);
    }
    toJSON() {
        let result = {}
        for (let coords of Object.keys(this._grid.pxs)) {
            let px = this._grid.pxs[coords];
            let newPx = {
                type: px.type,
                x: px.x,
                y: px.y
            }
            result[coords] = newPx;
        }
        return result;
    }
    async _handleLoad(button) {
        let save = await apiRequest("GET", `/saves/${button.id}`);
        let data = save.data;
        this._loadData(data);
        for (let coords of Object.keys(this._grid.pxs)) {
            let px = this._grid.pxs[coords];
        }
    }
    _loadData(data) {
        this._eraseWholeCanvas();
        this._grid.pxs = {};
        for (let coords of Object.keys(data)) {
            let pxData = data[coords];
            let px = new Pixel(pxData.x, pxData.y, pxData.type, this._grid, this._canvas, PX_SIZE);
            this._grid.addPx(px);
            px.draw();
        }
    }
    _eraseWholeCanvas() {
        let ctx = this._canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }
    async _handleDelete(event) {
        let button = event.target;
        let id = button.id[6];
        let saveButtonID = `save${id}`;
        let saveButton = document.querySelector(`#${saveButtonID}`);
        if (saveButton.classList.contains("free")) {
            alert("Error: save file is already empty");
            return;
        }
        saveButton.classList.add("free");
        saveButton.classList.remove("used");
        saveButton.innerHTML = saveButton.innerHTML.slice(0, 8);
        saveButton.innerHTML += "Empty";
        await apiRequest("DELETE", `/saves/${saveButtonID}`);
    }
}
let game = new Game();