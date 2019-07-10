let { randomid } = require("./../../util/helper");

class RequestMananger {
    constructor(context, worker) {
        this._context = context;
        this._worker = worker;
        this._requestTransformer = [];
        this._responseTransformer = [];
        this._responseDataFilter = [];
        this.addResponseDataFilter(data => {
            if (data[0] === '[' || data[0] === '{') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                }
            }
            return data;
        });
    }

    static getOption(option) {
        return Object.assign({
            url: "",
            id: randomid(),
            method: "post",
            responseType: "text",
            timeout: 3000000,
            headers: {},
            events: {},
            mimeType: '',
            data: {},
            body: "",
            credentials: null,
            contentType: "json",
            ondownloadprogress: null,
            onuploadprogress: null
        }, option);
    }

    addRequestTransformer(fn) {
        if (this._requestTransformer.indexOf(fn) === -1) {
            this._requestTransformer.push(fn);
        }
    }

    addResponseTransformer(fn) {
        if (this._responseTransformer.indexOf(fn) === -1) {
            this._responseTransformer.push(fn);
        }
    }

    removeRequestTransformer(fn) {
        let index = this._requestTransformer.indexOf(fn);
        if (index !== -1) {
            this._requestTransformer.splice(index, 1);
        }
    }

    removeResponseTransformer(fn) {
        let index = this._responseTransformer.indexOf(fn);
        if (index !== -1) {
            this._responseTransformer.splice(index, 1);
        }
    }

    addResponseDataFilter(fn) {
        if (this._responseDataFilter.indexOf(fn) === -1) {
            this._responseDataFilter.push(fn);
        }
    }

    removeResponseDataFilter(fn) {
        let index = this._responseDataFilter.indexOf(fn);
        if (index !== -1) {
            this._responseDataFilter.splice(index, 1);
        }
    }

    cleanResponseDataFilter() {
        this._responseDataFilter = [];
    }

    cleanRequestTransformer() {
        this._requestTransformer = [];
    }

    cleanResponseTransformer() {
        this._responseTransformer = [];
    }

    fetch(option) {
        return this.invoke(option);
    }

    origin(option) {
        return this._worker(this._context, RequestMananger.getOption(option));
    }

    invoke(option) {
        return Promise.resolve().then(() => {
            return this._requestTransformer.reduce((a, b) => {
                return a.then((c) => Promise.resolve().then(() => b(c)));
            }, Promise.resolve(RequestMananger.getOption(option)));
        }).then(ops => {
            let { promise } = this._worker(this._context, ops);
            return promise.then(response => {
                return this._responseTransformer.reduce((a, b) => {
                    return a.then((c) => Promise.resolve().then(() => b(c)));
                }, Promise.resolve(response));
            }).then(response => this._responseDataFilter.reduce((a, b) => b(a), response.data));
        });
    }

    get(url, data = {}) {
        return this.fetch(Object.assign({ url, data }, { method: "get" }));
    }

    post(url, data = {}) {
        return this.fetch(Object.assign({ url, data }, { method: "post" }));
    }

    put(url, data = {}) {
        return this.fetch(Object.assign({ url, data }, { method: "put" }));
    }

    patch(url, data = {}) {
        return this.fetch(Object.assign({ url, data }, { method: "patch" }));
    }

    head(url, data = {}) {
        return this.fetch(Object.assign({ url, data }, { method: "head" }));
    }

    options(url, data = {}) {
        return this.fetch(Object.assign({ url, data }, { method: "options" }));
    }

    upload(url, data = {}, onuploadprogress = null) {
        return this.origin(Object.assign({ url, data, contentType: false, onuploadprogress }, { method: "post" }));
    }
}

module.exports = RequestMananger;