import a from "./module";
import b from "./module2";
import { Renderer } from "./../server";

let renderer = new Renderer();
renderer.env.develop = false;
renderer.context.onsnapshoot = () => {
    console.log(renderer.getCurrentHTML());
};
renderer.getRootView(a).then(root => {
    // root.addChild(b);
});

/**
 * render from any code from root view
 * load from dist folder to render
 * */

// import Router from "./lib/router";
// import Renderer from "../server/index";

// let renderer = new Renderer();
// let router = new Router(renderer.context);
// router.bind("/test", (a) => console.log(a));
// router.run();
// setTimeout(() => {
//     router.open("/test");
//     console.log(renderer.context.window.location.href);
//     setTimeout(()=>{
//         renderer.context.window.history.back();
//         console.log(renderer.context.window.location.href);
//         debugger;
//     },2000);
// }, 2000);
