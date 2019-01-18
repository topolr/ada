class LocalStorage {
    getItem(key) {
        return this[key];
    }

    setItem(key, value) {
        this[key] = value;
    }

    removeItem(key) {
        delete this[key];
    }
}

module.exports = LocalStorage;