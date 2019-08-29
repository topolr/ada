class Session {
    constructor(context) {
        this.context = context;
        this.client_id = "0ea02b5fbb12611bee89";
        this.client_secret = "0614d360a2b37b0df55fcb6ae6eee422fa182ddd";
        this.scope = "public_repo";
        this.resp = "topolr/ada";
        this.token = undefined;
        this.userinfo = undefined;
        try {
            let a = context.window.localStorage.getItem("gitoken");
            this.token = !a || a === "undefined" ? undefined : a;
            a = context.window.localStorage.getItem("gituser");
            if (a) {
                this.userinfo = JSON.parse(a);
            } else {
                this.userinfo = undefined;
            }
            a = context.window.location.href.split("?");
            let c = {};
            if (a.length > 1) {
                a[1].split("#")[0].split("&").forEach(key => {
                    let b = key.split("=");
                    c[b[0]] = b[1];
                });
            }
            this.code = c.code;
        } catch (e) {
        }
    }

    getLoginInfo() {
        return {
            client_id: this.client_id,
            client_secret: this.client_secret,
            scope: this.scope
        }
    }

    isLogin() {
        return this.token !== undefined;
    }
}

class Comment {
    constructor(context) {
        this.context = context;
        this._session = new Session(context);
    }

    get session() {
        return this._session;
    }

    get(url, data) {
        return this.context.request.fetch({
            url:`https://api.github.com${url}`,
            method:"get",
            headers: {
                Accept: "application/vnd.github.squirrel-girl-preview, application/vnd.github.html+json",
                Authorization: `token ${this.session.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }

    post(url, data) {
        return this.context.request.fetch({
            url:`https://api.github.com${url}`,
            method:"post",
            body: JSON.stringify(data),
            headers: {
                Accept: "application/vnd.github.squirrel-girl-preview, application/vnd.github.html+json",
                Authorization: `token ${this.session.token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    getLoginURL(redirect_uri) {
        let ops = Object.assign({}, this.session.getLoginInfo(), {redirect_uri: redirect_uri || "http://adajs.io/dist/"});
        let paras = Reflect.ownKeys(ops).map(key => {
            return `${key}=${ops[key]}`;
        }).join("&");
        return `https://github.com/login/oauth/authorize?${paras}`;
    }

    login() {
        if (!this.session.token) {
            return this.context.request.fetch({
                url:`https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token`,
                method:"post",
                data: Object.assign({}, this.session.getLoginInfo(), {code: this.session.code}),
                dataType: "text"
            }).then((info) => {
                if (info.split) {
                    let c = {};
                    info.split("&").forEach(a => {
                        let b = a.split("=");
                        c[b[0]] = b[1];
                    });
                    this.session.token = c.access_token;
                    try {
                        this.context.window.localStorage.setItem("gitoken", this.session.token);
                    } catch (e) {
                    }
                    return this.get(`/user`).then((info) => {
                        try {
                            this.context.window.localStorage.setItem("gituser", info);
                            this.session.userinfo = info;
                        } catch (e) {
                        }
                    });
                }
            });
        } else {
            return Promise.resolve(this.session.token);
        }
    }

    getIssueCommentsById(id) {
        return this.context.request.get(`https://api.github.com/repos/${this.session.resp}/issues/${id}/comments?client_id=0ea02b5fbb12611bee89&client_secret=0614d360a2b37b0df55fcb6ae6eee422fa182ddd&t=${new Date().getTime()}`);
    }

    getMarkdownContent(content) {
        return this.context.request.fetch({
            url:`https://api.github.com/markdown?client_id=0ea02b5fbb12611bee89&client_secret=0614d360a2b37b0df55fcb6ae6eee422fa182ddd`,
            method:"post",
            body: JSON.stringify({
                "text": content || "",
                "mode": "gfm",
                "context": "github/gollum"
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    comment(id, data) {
        return this.post(`/repos/${this.session.resp}/issues/${id}/comments`, {body: data});
    }
}

export default Comment;