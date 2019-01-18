const EVENTTYPES = {
    HTMLEvents: "load,unload,abort,error,select,change,submit,reset,focus,blur,resize,scroll",
    MouseEvent: "click,mousedown,mouseup,mouseover,mousemove,mouseout",
    UIEvent: "DOMFocusIn,DOMFocusOut,DOMActivate",
    MutationEvent: "DOMSubtreeModified,DOMNodeInserted,DOMNodeRemoved,DOMNodeRemovedFromDocument,DOMNodeInsertedIntoDocument,DOMAttrModified,DOMCharacterDataModified"
};
const UNBUBBLINGEVENT = ["load", "unload", "focus", "blur", "pointerenter", "pointerleave", "beforeunload", "stop", "start", "finish", "bounce", "beforeprint", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture", "dragenter", "dragexit", "draggesture", "dragover", "CheckboxStateChange", "RadioStateChange", "close", "command", "contextmenu", "overflow", "overflowchanged", "popuphidden", "popuphiding", "popupshowing", "popupshown", "broadcast", "commandupdate"];

function eventHandler(e) {
    let events = e.currentTarget.events[e.type];
    for (let i in events) {
        events[i].call(e.currentTarget, e);
    }
}

let helper = {
    isEvent(type) {
        let result = {
            type: type,
            interfaceName: null
        };
        for (let i in EVENTTYPES) {
            if (EVENTTYPES[i].indexOf(type) !== -1) {
                result.interfaceName = i;
                break;
            }
        }
        return result;
    },
    trigger(dom, type, data) {
        let a = this.isEvent(type);
        if (a.interfaceName) {
            let eventx = document.createEvent(a.interfaceName);
            switch (a.interfaceName) {
                case "MouseEvent":
                    eventx.initMouseEvent(type, true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                    break;
                case "HTMLEvents":
                    eventx.initEvent(type, true, false, window);
                    break;
                case "UIEvents":
                    eventx.initUIEvents(type, true, false, window, null);
                    break;
                case "MutationEvent ":
                    eventx.initMutationEvent(type, true, false, window, null, null, null, null);
                    break;
            }
            dom.dispatchEvent(eventx);
        } else {
            let evt = document.createEvent("CustomEvent");
            evt.initCustomEvent(type, true, true, data);
            dom.dispatchEvent(evt);
        }
        return dom;
    },
    canBubbleUp(type) {
        return UNBUBBLINGEVENT.indexOf(type) === -1;
    },
    bind(dom, type, fn, capt = false) {
        if (!dom.events) {
            dom.events = {};
        }
        if (dom.events[type]) {
            dom.events[type].push(fn);
        } else {
            dom.events[type] = [];
            dom.events[type].push(fn);
        }
        dom.addEventListener(type, eventHandler, capt);
        return dom;
    },
    unbind(dom, type, fn) {
        if (dom.events) {
            if (type && type !== "") {
                let events = dom.events[type];
                if (events) {
                    dom.removeEventListener(type, eventHandler, false);
                    if (fn) {
                        events.splice(events.indexOf(fn), 1);
                    } else {
                        events.length = 0;
                    }
                }
            } else {
                let c = dom.events;
                Reflect.ownKeys(dom.events).forEach(type => {
                    dom.removeEventListener(type, eventHandler, false);
                    dom.events[type].length = 0;
                });
            }
        }
        return dom;
    }
};

module.exports = helper;