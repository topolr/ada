import {View, view} from "./../../index";
import state from "./state";

@view({
	className: "test2",
	template: "./template.html",
	style: "./style.css",
	dataset: {
		service: state
	}
})
class Test2 extends View {
}

export default Test2;