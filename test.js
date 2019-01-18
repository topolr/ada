let Path = require("path");
// let ProcessRenderer = require("adajs/process");
//
// let worker = ProcessRenderer.getWorker({
// 	distPath: Path.resolve(__dirname, "./dist"),
// 	origin: "http://localhost:8080"
// });
// worker.render("/about.html").then(content => {
// 	console.log('=>', content);
// 	worker.kill();
// });

let {DistRenderer}=require("adajs/server");
let renderer=new DistRenderer({origin:'http://localhost:8080',distPath:Path.resolve(__dirname, "./dist")});
renderer.outputURL("/about.html").then(()=>{
	console.log('---->')
});