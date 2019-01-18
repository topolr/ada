let request = require("request");
let Node = require("./node");

class Document extends Node {
    constructor(html) {
        super();
        this._cookie = request.jar();
        this._html = html;
        if (!this._html) {
            let html = new Node("html");
            let head = new Node("head");
            let body = new Node("body");
            this.appendChild(html);
            html.appendChild(head);
            html.appendChild(body);
            this.html = html;
            this.head = head;
            this.body = body;
        } else {
            this.innerHTML = this._html;
            this.html = this.querySelector("html");
            this.head = this.querySelector("head");
            this.body = this.querySelector("body");
            this.body.innerHTML = "";
        }
    }

    get cookie() {
        return this._cookie;
    }

    get documentElement() {
        return this;
    }
}

module.exports = Document;