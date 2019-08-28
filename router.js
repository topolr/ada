"use strict";

let serialize = {
  isEmptyObject(obj) {
    return Reflect.ownKeys(obj).length > 0;
  },

  getURLInfo: function (str) {
    let a = str.indexOf("?"),
        b = str.indexOf("#"),
        querystring = "",
        hashstring = "",
        qo = null,
        ho = null,
        host = str,
        port = null,
        protocol = null;

    if (a !== -1 && b !== -1) {
      host = str.substring(0, a);

      if (a > b) {
        hashstring = str.substring(b + 1, a);
        querystring = str.substring(a + 1);
      } else {
        querystring = str.substring(a + 1, b);
        hashstring = str.substring(b + 1);
      }
    } else if (a !== -1) {
      querystring = str.substring(a + 1);
      host = str.substring(0, a);
    } else if (b !== -1) {
      hashstring = str.substring(b + 1);
      host = str.substring(0, b);
    }

    let _port = str.match(/:[0-9]+/g),
        _protocol = str.match(/[a-z]+:\/\//);

    port = _port ? _port[_port.length - 1].substring(1) : null;
    protocol = _protocol ? _protocol[0].substring(0, _protocol[0].length - 3) : null;

    if (protocol) {
      host = host.substring(protocol.length + 3);
    }

    if (port) {
      host = host.substring(0, host.length - port.length - 1);
    }

    let _host = host.substring(0, host.indexOf("/"));

    host = _host === "" ? host : _host;

    if (querystring !== "") {
      qo = {};
      let c = querystring.split("&");

      for (let i = 0; i < c.length; i++) {
        let d = c[i].split("=");
        qo[d[0]] = d[1];
      }
    }

    if (hashstring !== "") {
      ho = {};
      let c = hashstring.split("&");

      for (let i = 0, len = c.length; i < len; i++) {
        let d = c[i].split("=");
        ho[d[0]] = d[1];
      }
    }

    return {
      query: qo,
      hash: ho,
      host: host,
      port: port,
      protocol: protocol
    };
  },
  queryObject: function (str) {
    return serialize.getURLInfo(str).query;
  },
  hashObject: function (str) {
    return serialize.getURLInfo(str).hash;
  }
};

class Agent {
  constructor(context) {
    this._context = context;
  }

  add(data, title, url) {
    this._context.window.history.pushState(data, title, url);

    return this;
  }

  replace(data, title, url) {
    this._context.window.history.replaceState(data, title, url);

    return this;
  }

  onChange(fn) {
    this._context.window.onpopstate = function (e) {
      fn && fn(e);
    };
  }

}

class Router {
  constructor(context) {
    this._context = context;
    this.map = [];
    this.list = [];
    this.hasDot = /\{\w*\}/g;
    this.url = this._context.window.location.href;
  }

  add(path, fn) {
    if (path[path.length - 1] !== "/") {
      path = path + "/";
    }

    let has = false,
        count = 0,
        start = 0,
        pars = [];
    let pathx = path.replace(this.hasDot, function (a, b) {
      has = true;

      if (count === 0) {
        start = b;
      }

      pars.push(a.substring(1, a.length - 1));
      count++;
      return "((?!/).)*";
    });

    if (has) {
      let info = {};
      info.originalpath = path;
      info.pattern = new RegExp("^" + pathx + "$");
      info.count = count;
      info.patternString = "^" + pathx + "/$";
      info.firstposition = start;
      info.keys = pars;
      info.callback = fn;
      let aStrings = path.split("\\.");

      if (aStrings.length > 1) {
        info.suffix = aStrings[1];
      }

      this.list.push(info);
    } else {
      this.map[path] = fn;
    }
  }

  check(path) {
    let result = {
      found: false,
      hasParas: false,
      path: path,
      matchpath: "",
      map: {},
      query: serialize.queryObject(path),
      hash: serialize.hashObject(path),
      callback: null
    };
    let t = path.split("?");

    if (t.length > 1) {
      path = t[0];
    }

    let suffix = "",
        bString = path.split("\\.");

    if (bString.length > 1) {
      suffix = bString[1];
      path = path + "/";
    } else {
      if (bString[0][bString[0] - 1] !== "/") {
        path = bString[0] + "/";
      }
    }

    if (this.map[path]) {
      result.path = path;
      result.matchpath = path;
      result.callback = this.map[path];
      result.found = true;
      return result;
    } else {
      let a = null;

      for (let i in this.list) {
        let info = this.list[i];

        if (info.pattern.test(path)) {
          if (null === a) {
            a = info;
          } else if (info.suffix === suffix) {
            if (info.count <= a.count) {
              if (info.firstposition > a.firstposition) {
                a = info;
              }
            }
          }
        }
      }

      if (null !== a) {
        let p = path.split("/"),
            pp = a.originalpath.split("/");
        let cd = 0;

        for (let i = 0; i < pp.length; i++) {
          if (pp[i][0] === "{") {
            result.map[a.keys[cd]] = p[i];
            cd++;
          }
        }

        result.hasParas = true;
        result.path = a.originalpath;
        result.matchpath = path;
        result.callback = info.callback;
        result.found = true;
      }

      return result;
    }
  }

}

class History {
  constructor(context) {
    this._context = context;
    this.url = this._context.window.location.origin;
    this._stack = [1];
    this._currentIndex = 0;
    this._handler = {};
    this.router = new Router(context);
    this.agent = new Agent(context);
    this.agent.onChange(e => {
      History._run.call(this, e.state, e);
    });
  }

  static _run(data, e) {
    try {
      if (!data || serialize.isEmptyObject(data)) {
        data = {
          __page__: this._context.window.location.href.split("#")[0].substring(this.url.length),
          __index__: 0
        };
      }

      data.__page__ = data.__page__.split("?")[0];

      if (data.__page__ === "") {
        data.__page__ = "/";
      } else {
        if (data.__page__[data.__page__.length - 1] === "/") {
          data.__page__ = data.__page__.substring(data.__page__.length - 1);
        }
      }

      if (data.__page__ === "/") {
        data.__page__ = "";
      }

      let r = this.router.check(data.__page__),
          isback = false,
          isforward = false;
      let info = {};

      if (e) {
        Object.assign(data, e.state);
      }

      if (data.__index__ !== undefined && data.__index__ !== null) {
        if (data.__index__ < this._currentIndex) {
          isback = true;
        }

        if (data.__index__ > this._currentIndex) {
          isforward = true;
        }

        this._currentIndex = data.__index__;
      }

      for (let i in data) {
        if (i !== "__page__" && i !== "__title__" && i !== "__index__") {
          info[i] = data[i];
        }
      }

      let _pdata = {
        founded: r.found,
        action: r.path,
        path: r.path,
        back: isback,
        forward: isforward,
        keys: r.hasParas ? r.map : null,
        query: r.query,
        hash: r.hash,
        info: info,
        e: e === undefined ? null : e,
        baseInfo: r
      };
      let _cannext = true;

      if (this._handler.beforeopen) {
        let r = this._handler.beforeopen.call(this, _pdata);

        if (r === false) {
          _cannext = false;
        }
      }

      if (r.found) {
        if (_cannext) {
          r.callback && r.callback.call(this, _pdata);
        }

        this._handler.endopen && this._handler.endopen.call(this, _pdata);
      } else {
        this._handler.nofound && this._handler.nofound.call(this, _pdata);
      }
    } catch (e) {
      console.log(e);
    }
  }

  run() {
    let page = this._context.window.location.href.substring(this.url.length);

    History._run.call(this, {
      __page__: page
    });

    return this;
  }

  open(url, data, title) {
    if (!data) {
      data = {};
    }

    data["__page__"] = url;
    data["__title__"] = title;
    data["__index__"] = this._stack.length;
    this.agent.add(data, title, this.url + url);

    this._stack.push(1);

    this._currentIndex = data.__index__;

    History._run.call(this, data);

    return this;
  }

  edit(url, data, title) {
    if (!data) {
      data = {};
    }

    data["__page__"] = url;
    this.agent.replace(data, title, this.url + url);

    History._run.call(this, data);

    return this;
  }

  bind(obj, fn) {
    if (arguments.length === 1) {
      for (let i in obj) {
        this.router.add(i, obj[i]);
      }
    } else if (arguments.length === 2) {
      this.router.add(obj, fn);
    }

    return this;
  }

  watch(type, fn) {
    this._handler[type] = fn;
    return this;
  }

}

module.exports = History;
//# sourceMappingURL=router.js.map