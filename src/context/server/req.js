let request = require("request");

module.exports = function (context, ops) {
    let cancel = null, _request = null;
    let promise = new Promise((resolve, reject) => {
        cancel = reject;
        let url = ops.url;
        if (url.indexOf("http") !== 0) {
            if (url[0] === "/") {
                let location = context.window.location;
                url = location.origin + url.replace(/[\/]+/g, "/");
            } else {
                url = context.window.location.href.replace(/[\/]+/g, "/") + "/" + url.replace(/[\/]+/g, "/");
            }
        }
        let option = {
            uri: url,
            method: ops.method,
            headers: Object.assign(ops.headers, {
                "Origin": context.window.location.origin,
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
            }),
            forever: false,
            jar: context._cookie,
            timeout: ops.timeout
        };
        if (ops.method === "get") {
            option.qs = ops.data;
        } else {
            if (ops.encodeURI) {
                option.headers["Content-type"] = "application/x-www-form-urlencoded";
                option.form = data;
            } else {
                option.headers["Content-type"] = "application/json";
                option.json = true;
                option.body = ops.data;
            }
        }
        _request = request(option, (error, response, body) => {
            _request = null;
            let status = response.statusCode;
            if (!error) {
                if ((status >= 200 && status < 300) || status === 304 || status === 0) {
                    resolve({
                        data: body,
                        status,
                        statusText: status,
                        headers: response.headers,
                        option: ops
                    });
                } else {
                    reject({
                        status,
                        headers: response.headers,
                        option: ops,
                        error
                    });
                }
            } else {
                reject({
                    status,
                    option: ops,
                    error
                });
            }
        });
        _request.on("abort", () => {
            reject(`[ada] request abort`);
        });
    });
    return {
        promise, cancel: () => {
            if (_request) {
                _request.abort();
                _request = null;
                cancel(`[ada] request abort`);
            }
        }
    }
};