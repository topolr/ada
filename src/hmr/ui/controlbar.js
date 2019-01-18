let controllbarStyle = require("./style/controllbar.less");
let controllbarHtml = require("./template/controllbar.html");
let playIcon = require("./icons/controller-play.icon");
let pauseIcon = require("./icons/controller-paus.icon");
let logoIcon = require("./icons/logo.icon");

const STOPSTATE = "ada-hmr-controllbar-stop";

let bar = {
	bar: null,
	isRunning(context) {
		let s = context.window.localStorage.getItem("ada-hmr-state");
		if (s === undefined) {
			s = true;
			context.window.localStorage.setItem("ada-hmr-state", "0");
		} else {
			if (s === "0") {
				s = true;
			} else {
				s = false;
			}
		}
		return s;
	},
	start(context) {
		controllbarStyle.active();
		playIcon.active();
		pauseIcon.active();
		logoIcon.active();
		let a = document.createElement("div");
		a.setAttribute("class", "ada-hmr-controllbar");
		a.innerHTML = controllbarHtml;
		this.bar = document.body.appendChild(a);
		let position = context.window.localStorage.getItem("ada-hmr-position");
		if (!position) {
			position = {x: 30, y: window.innerHeight - 30};
		} else {
			position = JSON.parse(position);
		}
		this.bar.style.left = `${position.x}px`;
		this.bar.style.top = `${position.y}px`;
		[...this.bar.querySelectorAll(".ada-hmr-controllerbar-btn-paus")][0].addEventListener("click", () => {
			this.bar.classList.add(STOPSTATE);
			context.window.localStorage.setItem("ada-hmr-state", "1");
		});
		[...this.bar.querySelectorAll(".ada-hmr-controllerbar-btn-play")][0].addEventListener("click", () => {
			this.bar.classList.remove(STOPSTATE);
			context.window.localStorage.setItem("ada-hmr-state", "0");
		});
		this.ismove = false;
		this.offset = {x: 0, y: 0};
		this.bar.addEventListener("mousedown", e => {
			let a = this.bar.getBoundingClientRect();
			this.ismove = true;
			this.offset = {x: e.pageX - a.x, y: e.pageY - a.y};
		});
		document.addEventListener("mousemove", e => {
			if (this.ismove) {
				this.bar.style.left = `${e.pageX - this.offset.x}px`;
				this.bar.style.top = `${e.pageY - this.offset.y}px`;
				e.stopPropagation();
				e.preventDefault();
			}
		});
		document.addEventListener("mouseup", (e) => {
			if (this.ismove) {
				this.ismove = false;
				context.window.localStorage.setItem("ada-hmr-position", JSON.stringify({
					x: e.pageX - this.offset.x,
					y: e.pageY - this.offset.y
				}));
			}
		});
		if (this.isRunning(context)) {
			this.bar.classList.remove(STOPSTATE);
		} else {
			this.bar.classList.add(STOPSTATE);
		}
		return this;
	},
	getState(context) {
		return this.isRunning(context);
	},
	hide() {
		this.bar.style.display = "none";
	},
	show() {
		this.bar.style.display = "flex";
	},
	actionStart() {
		this.bar.classList.add("ada-hmr-controllbar-action");
	},
	actionDone() {
		this.bar.classList.remove("ada-hmr-controllbar-action");
	},
	setPosition(context, x, y) {
		let position = {x: x || 10, y: y || window.innerHeight - 40};
		context.window.localStorage.setItem("ada-hmr-position", JSON.stringify(position));
		this.bar.style.left = `${position.x}px`;
		this.bar.style.top = `${position.y}px`;
	},
	resetPosition(context) {
		let position = {x: 10, y: window.innerHeight - 40};
		context.window.localStorage.setItem("ada-hmr-position", JSON.stringify(position));
		this.bar.style.left = `${position.x}px`;
		this.bar.style.top = `${position.y}px`;
	}
};

module.exports = bar;