let updater = require("./updater");
let bar = require("./ui/controlbar");
let teminal = require("./ui/teminal");
let manager = require("./../manager");

const tryTime = 100;

let client = {
    state: true,
    tryTime: tryTime,
    start() {
        let context = manager._context;
        if (context.window.EventSource) {
            context.window.addEventListener("load", () => {
                bar.start(context);
                teminal.init(context);
                let source = new context.window.EventSource('/ada/sse');
                source.addEventListener('message', (e) => {
                    this.tryTime = 0;
                    try {
                        let data = JSON.parse(e.data), log = data.log;
                        console.log(data);
                        let app = data.app;
                        let _context = manager.getContext(app);
                        if (_context) {
                            if (log && log.length === 0) {
                                teminal.hide();
                                if (bar.getState(_context)) {
                                    if (data.type === "edit") {
                                        bar.actionStart();
                                        updater.refresh(_context, data.files, data.map).then(() => {
                                            bar.actionDone();
                                        }).catch((e) => {
                                            console.log(1, e);
                                            // context.window.location.reload();
                                        });
                                    } else if (data.type !== "start") {
                                        context.window.location.reload();
                                    }
                                } else {
                                    console.log(`%c[Ada] HMR is stopped`, "color:#3D78A7;font-weight:bold");
                                }
                            } else {
                                teminal.showError(context, log || []);
                            }
                            if (data.type === "reload") {
                                context.window.location.reload();
                            }
                        }
                    } catch (e) {
                        console.log(2, e);
                        // context.window.location.reload();
                    }
                });
                source.addEventListener('error', (e) => {
                    if (this.tryTime === tryTime) {
                        source.close();
                        console.log("%c- [Ada] SSE is closed,Try to reload page when needed", "color:#3D78A7;font-weight:bold");
                    } else {
                        this.tryTime++;
                    }
                });
            });
            let MutationObserver = context.window.MutationObserver || context.window.WebKitMutationObserver || context.window.MozMutationObserver;
            if (MutationObserver) {
                new MutationObserver((mutations) => {
                    let has = false;
                    mutations.forEach((mutation) => {
                        [...mutation.removedNodes].forEach(target => {
                            if (target.querySelectorAll && target.querySelectorAll(".ada-hmr-controllbar").length > 0) {
                                has = true;
                            }
                            if (!has) {
                                has = target.classList ? target.classList.contains("ada-hmr-controllbar") : false;
                            }
                        });
                    });
                    if (has) {
                        bar.start(context);
                        teminal.init();
                    }
                }).observe(context.document, { childList: true, subtree: true });
            } else {
                context.document.body.addEventListener("DOMNodeRemoved", (e) => {
                    let target = e.target, has = false;
                    if (target.querySelectorAll && target.querySelectorAll(".ada-hmr-controllbar").length > 0) {
                        has = true;
                    }
                    if (!has) {
                        has = target.classList ? target.classList.contains("ada-hmr-controllbar") : false;
                    }
                    if (has) {
                        bar.start(context);
                        teminal.init();
                    }
                });
            }
            context.window.addEventListener("resize", () => {
                bar.resetPosition(context);
            });
        }
    }
};

module.exports = {
    client,
    status() {
        return bar.isRunning(context);
    },
    hideControllbar() {
        bar.hide();
    },
    showControllbar() {
        bar.show();
    },
    setPosition(x, y) {
        bar.setPosition(context, x, y);
    },
    resetPosition() {
        bar.resetPosition(context);
    }
};