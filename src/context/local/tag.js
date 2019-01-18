let {isFunction} = require("./../../util/helper");
let {isRegularTag} = require("./../util");

class Tag {
    constructor() {
        this.regularTags = [];
        this.selfCloseTags = ["br", "hr", "img", "input", "param", "link", "meta", "area", "base", "basefont", "param", "col", "frame", "embed", "keygen", "source"];
        this.tags = {
            icon: {
                template({attrs, props}) {
                    return `<svg class="${attrs.class || "ada-icon"}"><use xlink:href="#${props.id}"></use></svg>`;
                },
                selfClose: true
            }
        }
    }

    get(tagName) {
        return this.tags[tagName];
    }

    set(tagName, generator) {
        this.tags[tagName] = generator;
        if (!isFunction(generator)) {
            if (generator.selfClose) {
                this.selfCloseTags.push(tagName);
            }
        }
    }

    has(tagName) {
        return this.get(tagName) !== undefined;
    }

    remove(viewClass) {
        Reflect.ownKeys(this.tags).filter(tagName => this.tags[tagName] === viewClass).forEach(tagName => delete this.tags[tagName]);
    }

    isRegularTag(tagName) {
        let result = true;
        if (this.regularTags.indexOf(tagName) === -1) {
            if (isRegularTag(tagName)) {
                this.regularTags.push(tagName);
            } else {
                result = false;
            }
        }
        return result;
    }
}

module.exports = Tag;