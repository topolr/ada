let {PROXYSTATE} = require("./../util/const");
let issupportproxy = (typeof Proxy !== "undefined");
let env = require("./../env");

const util = {
	is(x, y) {
		if (x === y) {
			return x !== 0 || 1 / x === 1 / y
		} else {
			return x !== x && y !== y
		}
	},
	isProxy(value) {
		return !!value && !!value[PROXYSTATE];
	},
	isProxyable(value) {
		if (!value) return false;
		if (typeof value !== "object") return false;
		if (Array.isArray(value)) return true;
		const proto = Object.getPrototypeOf(value);
		return proto === null || proto === Object.prototype
	},
	isProxyProp(prop) {
		return typeof prop === "string" || typeof prop === "number";
	},
	has(thing, prop) {
		return Object.prototype.hasOwnProperty.call(thing, prop)
	},
	shallowCopy(value) {
		if (Array.isArray(value)) {
			return value.slice();
		} else {
			let target = value.__proto__ === undefined ? Object.create(null) : {};
			return Object.assign(target, value);
		}
	},
	setPropName(target, prop) {
		let type = "_prop";
		if (target._parent) {
			target[type] = [target._parent[type], prop].join(".");
		} else {
			target[type] = prop;
		}
	},
	finalize(base) {
		if (this.isProxy(base)) {
			let state = base[PROXYSTATE];
			if (state._modified === true) {
				if (state._finalized === true) {
					return state._copy;
				}
				state._finalized = true;
				if (Array.isArray(state._copy)) {
					state._copy.forEach((value, prop) => {
						if (value !== state._data[prop]) {
							state._copy[prop] = this.finalize(value);
						}
					})
				}
				Reflect.ownKeys(state._copy).forEach(prop => {
					let value = state._copy[prop];
					if (value !== state._data[prop]) {
						state._copy[prop] = this.finalize(value);
					}
				});
				return this.freeze(state._copy);
			} else {
				return this.finalize(state._data);
			}
		}
		this.finalizeNonProxiedObject(base);
		return base;
	},
	finalizeNonProxiedObject(parent) {
		if (!this.isProxyable(parent)) {
			return;
		}
		if (Object.isFrozen(parent)) {
			return;
		}
		this.each(parent, (i, child) => {
			if (this.isProxy(child)) {
				parent[i] = this.finalize(child)
			} else {
				this.finalizeNonProxiedObject(child)
			}
		});
		this.freeze(parent);
	},
	freeze(value) {
		if (env.develop) {
			Object.freeze(value);
		}
		return value;
	},
	cleanCollector(collector) {
		collector._revokes.forEach(i => i());
		collector._getprops = [...collector._getprops];
		collector._setprops = [...collector._setprops];
		if (collector._states.length > 0) {
			this.each(collector._states, (_, state) => {
				state.finalizing = true
			});
			for (let i = collector._states.length - 1; i >= 0; i--) {
				const state = collector._states[i];
				if (state._modified === false) {
					if (Array.isArray(state._data)) {
						if (esprop.hasArrayChanges(state)) esprop.markChanged(state)
					} else if (esprop.hasObjectChanges(state)) {
						esprop.markChanged(state)
					}
				}
			}
		}
	},
	each(value, cb) {
		if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				cb(i, value[i]);
			}
		} else {
			for (let key in value) {
				cb(key, value[key]);
			}
		}
	}
};

class State {
	constructor(parent, data, collector) {
		this._data = data;
		this._parent = parent;
		this._children = {};
		this._modified = false;
		this._copy = null;
		this._prop = "";
		this._finalized = false;
		this._collector = collector;
	}
}

class Esstate {
	constructor(parent, proxy, data, collector) {
		this._modified = false;
		this._hasCopy = false;
		this._parent = parent;
		this._data = data;
		this._proxy = proxy;
		this._copy = undefined;
		this._collector = collector;
		this._finished = false;
		this._finalizing = false;
		this._finalized = false;
		this._prop = "";
	}
}

const proxy = {
	markChanged(state) {
		if (!state._modified) {
			state._modified = true;
			state._copy = util.shallowCopy(state._data);
			Object.assign(state._copy, state._children);
			if (state._parent) {
				this.markChanged(state._parent);
			}
		}
	},
	createProxy(collector, parent, data) {
		const {proxy, revoke} = Proxy.revocable(new State(parent, data, collector), handler);
		collector._revokes.push(revoke);
		return proxy;
	}
};

const esprop = {
	createProxy(collector, parent, base) {
		const proxy = util.shallowCopy(base);
		util.each(base, i => {
			Object.defineProperty(proxy, "" + i, this.createPropertyProxy("" + i))
		});
		const state = new Esstate(parent, proxy, base, collector);
		this.createHiddenProperty(proxy, PROXYSTATE, state);
		collector._states.push(state);
		return proxy
	},
	createPropertyProxy(prop) {
		return {
			configurable: true,
			enumerable: true,
			get() {
				return eshandler.get(this[PROXYSTATE], prop);
			},
			set(value) {
				eshandler.set(this[PROXYSTATE], prop, value);
			}
		};
	},
	createHiddenProperty(target, prop, value) {
		if (target) {
			Object.defineProperty(target, prop, {
				value: value,
				enumerable: false,
				writable: true
			});
		}
	},
	hasObjectChanges(state) {
		const baseKeys = Object.keys(state._data);
		const keys = Object.keys(state._proxy);
		return !this.shallowEqual(baseKeys, keys);
	},
	hasArrayChanges(state) {
		const {_proxy} = state;
		if (_proxy.length !== state._data.length) return true;
		const descriptor = Object.getOwnPropertyDescriptor(_proxy, _proxy.length - 1);
		if (descriptor && !descriptor.get) return true;
		return false
	},
	prepareCopy(state) {
		if (state._hasCopy) return;
		state._hasCopy = true;
		state._copy = util.shallowCopy(state._data)
	},
	shallowEqual(objA, objB) {
		if (util.is(objA, objB)) return true;
		if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
			return false;
		}
		const keysA = Object.keys(objA);
		const keysB = Object.keys(objB);
		if (keysA.length !== keysB.length) return false;
		for (let i = 0; i < keysA.length; i++) {
			if (!hasOwnProperty.call(objB, keysA[i]) || !util.is(objA[keysA[i]], objB[keysA[i]])) {
				return false;
			}
		}
		return true;
	},
	source(state) {
		return state._hasCopy ? state._copy : state._data
	},
	markChanged(state) {
		if (!state._modified) {
			state._modified = true;
			if (state._parent) this.markChanged(state._parent)
		}
	}
};

const handler = {
	get(target, prop) {
		if (prop === PROXYSTATE) {
			return target;
		} else {
			let val = target._data[prop], _proxy = false;
			if (target._modified) {
				val = target._copy[prop];
				if (val === target._data[prop] && util.isProxyable(val)) {
					val = target._copy[prop] = proxy.createProxy(target._collector, target, val);
					util.setPropName(val[PROXYSTATE], prop);
					target._collector._addUseProp(val[PROXYSTATE]._prop);
					_proxy = true;
				}
			} else {
				if (target._children[prop]) {
					val = target._children[prop];
					_proxy = true;
				} else {
					let _value = target._data[prop];
					if (!util.isProxy(_value) && util.isProxyable(_value)) {
						val = target._children[prop] = proxy.createProxy(target._collector, target, _value);
						util.setPropName(val[PROXYSTATE], prop);
						target._collector._addUseProp(val[PROXYSTATE]._prop);
						_proxy = true;
					}
				}
			}
			if (!_proxy) {
				if (util.isProxyProp(prop)) {
					target._collector._addUseProp(target._prop + "." + prop);
				}
			}
			return val;
		}
	},
	set(target, prop, value) {
		if (target._data[prop] !== value) {
			target._collector._addSetProp(target._prop + "." + prop);
		} else {
			target._collector._removeSetProp(target._prop + "." + prop);
		}
		if (!target._modified) {
			if (prop in target._data && util.is(target._data[prop], value) || util.has(target._children, prop) && target._children[prop] === value) {
				return true;
			}
			if (target._collector._immutable) {
				proxy.markChanged(target);
			}
		}
		if (target._collector._immutable) {
			target._copy[prop] = value;
		} else {
			target._data[prop] = value;
		}
		return true;
	},
	has(target, prop) {
		return prop in target._data;
	},
	ownKeys(target) {
		return Reflect.ownKeys(target._data);
	},
	deleteProperty(target, prop) {
		return true;
	},
	getOwnPropertyDescriptor(target, prop) {
		const owner = target._modified ? target._copy : util.has(target._children, prop) ? target._children : target._data;
		const descriptor = Reflect.getOwnPropertyDescriptor(owner, prop);
		if (descriptor) {
			descriptor.configurable = true;
		}
		return descriptor;
	},
	defineProperty() {
		throw new Error("[ada] can not define property on this object")
	}
};

const eshandler = {
	get(state, prop) {
		if (state._finished === true) {
			throw new Error("Cannot use a proxy that has been revoked." + JSON.stringify(state._copy || state._data));
		}
		const value = esprop.source(state)[prop], _proxy = false;
		if (!state._finalizing && value === state._data[prop] && util.isProxyable(value)) {
			esprop.prepareCopy(state);
			return (state._copy[prop] = esprop.createProxy(state._collector, state, value));
			util.setPropName(esprop.source(value), prop);
			state._collector._addUseProp(esprop.source(value)._prop);
			_proxy = true;
		}
		if (!_proxy) {
			if (util.isProxyProp(prop)) {
				state._collector._addUseProp(state._prop + "." + prop);
			}
		}
		return value
	},
	set(state, prop, value) {
		if (state._finished === true) {
			throw new Error("Cannot use a proxy that has been revoked." + JSON.stringify(state._copy || state._data));
		}
		if (state._data[prop] !== value) {
			state._collector._addSetProp(state._prop + "." + prop)
		} else {
			target._collector._removeSetProp(target._prop + "." + prop);
		}
		if (!state._modified) {
			if (util.is(esprop.source(state)[prop], value)) {
				state._collector._removeSetProp(state._prop + "." + prop);
				return;
			}
			esprop.markChanged(state);
			esprop.prepareCopy(state);
		}
		if (state._collector._immutable) {
			state._copy[prop] = value;
		} else {
			state._data[prop] = value;
		}
	}
};

class Collector {
	constructor({data, fn, immutable = true, collect = true}) {
		this.fn = fn;
		this._revokes = [];
		this._states = [];
		this._root = issupportproxy ? proxy.createProxy(this, null, data) : esprop.createProxy(this, null, data);
		this._getprops = new Set();
		this._setprops = new Set();
		this._immutable = immutable;
		this._collect = collect;
	}

	getUsedPros() {
		return this._getprops;
	}

	getChangedProps() {
		return this._setprops;
	}

	invoke(parameter, scope) {
		let _returnValue = null, result = null, isCollector = false;
		if (parameter instanceof Collector) {
			isCollector = true;
			_returnValue = this.fn.call(scope || {}, this._root, parameter._root);
		} else {
			_returnValue = this.fn.call(scope || {}, this._root, parameter);
		}
		if (_returnValue !== undefined && _returnValue !== this._root) {
			if (_returnValue.then) {
				return _returnValue.then(data => {
					result = util.finalize(data || this._root);
					util.cleanCollector(this);
					if (isCollector) {
						util.finalize(parameter._root);
						util.cleanCollector(parameter);
					}
					return result;
				})
			} else {
				result = util.finalize(_returnValue);
				util.cleanCollector(this);
				if (isCollector) {
					util.finalize(parameter._root);
					util.cleanCollector(parameter);
				}
				return result;
			}
		} else {
			result = util.finalize(this._root);
			util.cleanCollector(this);
			if (isCollector) {
				util.finalize(parameter._root);
				util.cleanCollector(parameter);
			}
			return result;
		}
	}

	_addUseProp(prop) {
		if (this._collect) {
			this._getprops.add(prop);
		}
	}

	_addSetProp(prop) {
		if (this._collect) {
			this._setprops.add(prop);
		}
	}

	_removeSetProp(prop) {
		if (this._collect) {
			this._setprops.delete(prop);
		}
	}
}

module.exports = Collector;