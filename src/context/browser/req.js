let {postData, queryString} = require("../../util/helper");

let util = {
    parseHeaders(str) {
        let r = {};
        str.split('\n').forEach(t => {
            let e = t.split(":");
            if (e[0]) {
                r[e[0]] = e[1];
            }
        });
        return r;
    }
};

const CONTENTYPE = {
    json: "application/json",
    uri: "application/x-www-form-urlencoded"
};

module.exports = function (context, ops) {
    let cancel = null, _xhr = null;
    let promise = new Promise((resolve, reject) => {
        cancel = reject;
        _xhr = new XMLHttpRequest();
        if (ops.mimeType) {
            _xhr.overrideMimeType(ops.mimeType);
        }
        let url = ops.url, data = ops.data;
        if (!ops.body) {
            if (ops.method === "get") {
                let querystr = queryString(ops.data);
                url += (url.indexOf("?") !== -1 ? (querystr === "" ? "" : "&" + querystr) : (querystr === "" ? "" : "?" + querystr));
            } else {
                data = postData(data, ops.encodeURI);
            }
        }
        _xhr.open(ops.method, url);
        _xhr.responseType = ops.responseType;
        _xhr.timeout = ops.timeout;
        if (ops.credentials !== null) {
            _xhr.withCredentials = ops.credentials;
        }
        _xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        Reflect.ownKeys(ops.headers).forEach(key => {
            _xhr.setRequestHeader(key, ops.headers[key]);
        });

        if (ops.method !== "get") {
            if (ops.contentType !== false) {
                _xhr.setRequestHeader("Content-Type", CONTENTYPE[ops.contentType] || ops.contentType);
            }
        }
        _xhr.addEventListener("readystatechange", (e) => {
            if (_xhr.readyState === 4) {
                let status = _xhr.status;
                let responseHeaders = 'getAllResponseHeaders' in _xhr ? (_xhr.getAllResponseHeaders()) : null;
                if ((status >= 200 && status < 300) || status === 304 || status === 0) {
                    let responseData = !ops.responseType || ops.responseType === 'text' ? _xhr.responseText : _xhr.response;
                    let statusText = _xhr.statusText || "";
                    resolve({
                        status,
                        statusText,
                        data: responseData,
                        headers: util.parseHeaders(responseHeaders),
                        option: ops
                    });
                } else {
                    _xhr = null;
                    reject({
                        status,
                        headers: util.parseHeaders(responseHeaders),
                        option: ops,
                        error: e
                    });
                }
            }
        });
        _xhr.addEventListener('onabort', (e) => reject({status: _xhr.status, option: ops, error: e}));
        _xhr.addEventListener('onerror', (e) => reject({status: _xhr.status, option: ops, error: e}));
        _xhr.addEventListener('ontimeout', (e) => reject({status: _xhr.status, option: ops, error: e}));
        if (ops.ondownloadprogress) {
            _xhr.addEventListener('progress', ops.ondownloadprogress);
        }
        if (ops.onuploadprogress) {
            _xhr.upload.addEventListener('progress', ops.onuploadprogress);
        }
        _xhr.send(ops.body ? ops.body : data);
    });
    return {
        promise, cancel: () => {
            if (_xhr) {
                _xhr.abort();
                _xhr = null;
                cancel(`[ada] request abort`);
            }
        }
    }
};