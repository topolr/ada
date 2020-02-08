import { BondViewGroup, root } from "./../../index";
import state from "./state";

@root({
	className: "test",
	template: "./template.html",
	style: "./style.css",
	dataset: {
		service: state
	}
})
class Test extends BondViewGroup {
	onready() {
		import("./../module2").then(Test2 => {
			this.addChild(Test2.default, {
				container: this.getElement()
			}).then((test2) => {
				this.commit("change").then(() => {
					this.context.snapshot();
				});
			});
		});
	}
}

export default Test;