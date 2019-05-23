let Metadata = require("./lib/metadata");
let {
	DATASETACTION,
	DATASETCOMMITCOUNT,
	DATASETCOMPUTE,
	DATASETDATA,
	DATASETEDITS,
	DATASETISCOMMIT,
	DATASETLISTENER,
	DATASETOWNER,
	DATASETRANSACTION,
	DATASETRANSACTIONSTATE,
	DATASETRANSACTIONSTEP,
	DATASETSERVICE,
	CONTEXT,
	PRIMEKEY
} = require("./util/const");
let Collector = require("./base/collector");
let { isPropsChange, protectData, setProp } = require("./util/helper");

class Service {
	get context() {
		return this[CONTEXT];
	}

	get request() {
		return this[CONTEXT].request;
	}

	defaultData() {
		return {};
	}

	assign(current, ...objects) {
		let keys = this[PRIMEKEY];
		if (keys.length > 0) {
			let r = objects.filter(a => typeof a === 'object').map(obj => {
				let t = {};
				Reflect.ownKeys(obj || {}).filter(key => keys.indexOf(key) !== -1).forEach(key => {
					t[key] = obj[key];
				});
				return t;
			});
			Object.assign(current, ...r);
		} else {
			Object.assign(current, ...objects);
		}
	}

	onupdate(current, data) {
		this.assign(current, data);
	}
}

class DataSet {
	constructor() {
		setProp(this, DATASETOWNER, null);
		setProp(this, DATASETDATA, null);
		setProp(this, DATASETSERVICE, null);
		setProp(this, DATASETLISTENER, []);
		setProp(this, DATASETEDITS, []);
		setProp(this, DATASETISCOMMIT, null);
		setProp(this, DATASETCOMMITCOUNT, 0);
	}

	get context() {
		return this[DATASETOWNER].context;
	}

	commit(type, data) {
		this.context.logger.group(`COMMIT [${type}] FROM [${this[DATASETOWNER].getClassName()}]`);
		this[DATASETCOMMITCOUNT]++;
		if (!this[DATASETISCOMMIT]) {
			this[DATASETISCOMMIT] = DataSetHelper.commit(this, type, data);
		} else {
			this[DATASETISCOMMIT] = this[DATASETISCOMMIT].then(() => {
				return DataSetHelper.commit(this, type, data);
			});
		}
		return this[DATASETISCOMMIT].then(a => {
			this.context.logger.groupEnd();
			return a;
		});
	}

	getData() {
		if (!this[DATASETDATA]) {
			this[DATASETDATA] = this[DATASETSERVICE].defaultData();
			this[DATASETSERVICE][PRIMEKEY] = Reflect.ownKeys(this[DATASETDATA] || {}).filter(key => !key.startsWith('_'));
		}
		return this[DATASETDATA];
	}

	getComputeData(name, parameter) {
		let method = this[DATASETSERVICE][DATASETCOMPUTE][name];
		if (method && this[DATASETSERVICE][method]) {
			return this[DATASETSERVICE][method](this.getData(), parameter);
		} else {
			throw Error("[ada] servie");
		}
	}

	toggleService(serviceClass) {
		if (serviceClass.prototype instanceof this.defaultService()) {
			this[DATASETSERVICE] = new serviceClass();
		} else {
			throw Error("[ada] toggle service must be a subclass of this dataset default service class");
		}
	}

	getChangedProps() {
		return this[DATASETEDITS];
	}

	_addListener(view, getter, setter) {
		let result = {};
		let index = this[DATASETLISTENER].findIndex(item => item.view === view);
		if (index === -1) {
			let collector = new Collector({ data: this[DATASETDATA], fn: getter });
			result = collector.invoke();
			setTimeout(() => {
				this[DATASETLISTENER].push({
					useprops: collector.getUsedProps(),
					view,
					getter,
					setter
				});
			});
		} else {
			throw Error("ViewConnector can only invoke connect once with the same DataSet filter");
		}
		return result;
	}

	_removeListener(view) {
		let index = this[DATASETLISTENER].findIndex(item => item.view === view);
		if (index !== -1) {
			this[DATASETLISTENER].splice(index, 1);
		}
	}

	_remove() {
		this[DATASETDATA] = null;
		this[DATASETOWNER] = null;
		this[DATASETSERVICE] = null;
		this[DATASETLISTENER] = [];
	}

	_setState(state) {
		this[DATASETDATA] = state;
	}
}

class TransactDataSet extends DataSet {
	constructor() {
		super();
		setProp(this, DATASETRANSACTION, []);
		setProp(this, DATASETRANSACTIONSTATE, []);
		setProp(this, DATASETRANSACTIONSTEP, 0);
	}

	commit(type, data) {
		this[DATASETRANSACTION].unshift({ type, data });
		return super.commit(type, data);
	}

	getTransactionSize() {
		return Infinity;
	}

	getCommitSize() {
		return this[DATASETRANSACTIONSTATE].length;
	}

	getCurrentStep() {
		return this[DATASETRANSACTIONSTEP];
	}

	getCurrentCommit() {
		return this[DATASETRANSACTION][this.getCurrentStep()];
	}

	getTransactionList() {
		return this[DATASETRANSACTION];
	}

	rollback(step = 1) {
		if (this[DATASETRANSACTIONSTATE].length > 0) {
			this[DATASETRANSACTION].splice(0, step);
			this[DATASETRANSACTIONSTATE].splice(0, step);
			this[DATASETRANSACTIONSTEP] = this[DATASETRANSACTIONSTATE].length;
			this[DATASETDATA] = this[DATASETRANSACTIONSTATE][0];
			this.context.logger.group(`ROLLBACK FROM [${this[DATASETOWNER].getClassName()}]`);
			return this[DATASETOWNER]._updateForceFromDataSet().then(() => {
				return DataSetHelper.dispatchForce(this).then(() => {
					this[DATASETEDITS] = [];
					this.context.logger.groupEnd();
					return this[DATASETDATA];
				});
			});
		} else {
			return Promise.resolve(this.getData());
		}
	}

	travel(step = 0) {
		step = this[DATASETRANSACTIONSTATE].length - step;
		if (this[DATASETRANSACTIONSTATE].length > 0 && this[DATASETRANSACTIONSTATE][step]) {
			this[DATASETRANSACTIONSTEP] = step;
			this[DATASETDATA] = this[DATASETRANSACTIONSTATE][step];
			this.context.logger.group(`TRAVEL FROM [${this[DATASETOWNER].getClassName()}]`);
			return this[DATASETOWNER]._updateForceFromDataSet().then(() => {
				return DataSetHelper.dispatchForce(this).then(() => {
					this[DATASETEDITS] = [];
					this.context.logger.groupEnd();
					return this[DATASETDATA];
				});
			});
		} else {
			return Promise.resolve(this.getData());
		}
	}

	resetHistory() {
		setProp(this, DATASETRANSACTION, []);
		setProp(this, DATASETRANSACTIONSTATE, []);
		setProp(this, DATASETRANSACTIONSTEP, 0);
	}

	_setState(state) {
		if (this[DATASETRANSACTIONSTATE].length > this.getTransactionSize()) {
			this[DATASETRANSACTIONSTATE].shift();
		}
		this[DATASETRANSACTIONSTATE].unshift(state);
		this[DATASETRANSACTIONSTEP] = this[DATASETRANSACTIONSTATE].length - 1;
		this[DATASETDATA] = state;
	}
}

class DataSetHelper {
	static getDataSet({ type = DataSet, service = Service }, owner) {
		let _dataset = new type();
		_dataset[DATASETOWNER] = owner;
		if (service.prototype instanceof Service) {
			_dataset[DATASETSERVICE] = new service();
		} else {
			throw Error("[ada] must be a Service class");
		}
		_dataset[DATASETSERVICE][DATASETACTION] = Object.assign({ update: "onupdate" }, Metadata.getMetadataExtends("action", _dataset[DATASETSERVICE].constructor.prototype) || {});
		_dataset[DATASETSERVICE][DATASETCOMPUTE] = Metadata.getMetadataExtends("compute", _dataset[DATASETSERVICE].constructor.prototype) || {};
		_dataset[DATASETSERVICE][CONTEXT] = owner.context;
		return _dataset;
	}

	static commit(dataset, type, data) {
		return Promise.resolve().then(() => dataset[DATASETOWNER].onbeforecommit(type)).then(() => {
			return DataSetHelper.trigger(dataset, type, data).then(info => {
				dataset[DATASETCOMMITCOUNT]--;
				if (dataset[DATASETCOMMITCOUNT] === 0) {
					dataset[DATASETISCOMMIT] = null;
				}
				return Promise.resolve().then(() => dataset[DATASETOWNER] && dataset[DATASETOWNER].oncommited(type)).then(() => info);
			}, info => {
				console.error(info);
				dataset[DATASETCOMMITCOUNT]--;
				if (dataset[DATASETCOMMITCOUNT] === 0) {
					dataset[DATASETISCOMMIT] = null;
				}
				return Promise.resolve().then(() => dataset[DATASETOWNER] && dataset[DATASETOWNER].oncommited(type)).then(() => info);
			});
		});
	}

	static trigger(dataset, type, data) {
		let method = dataset[DATASETSERVICE][DATASETACTION][type];
		if (method && dataset[DATASETSERVICE][method]) {
			let collector = new Collector({
				data: dataset.getData(),
				fn: dataset[DATASETSERVICE][method]
			});
			return Promise.resolve().then(() => collector.invoke(protectData(data), dataset[DATASETSERVICE])).then(info => {
				if (dataset[DATASETOWNER]) {
					dataset._setState(info || {});
					dataset[DATASETEDITS] = collector.getChangedProps();
					return dataset[DATASETOWNER]._updateFromDataSet().then(() => {
						return DataSetHelper.dispatch(dataset).then(() => {
							dataset[DATASETEDITS] = [];
							return info;
						});
					});
				}
			});
		}
		return Promise.reject(`[ada] service action is undefined name is ${type}`);
	}

	static dispatch(dataset) {
		return DataSetHelper.dispatchDatasetListeners(dataset, dataset[DATASETLISTENER].filter(info => {
			return isPropsChange(dataset.getChangedProps(), info.useprops, dataset[DATASETOWNER]);
		}));
	}

	static dispatchForce(dataset) {
		return DataSetHelper.dispatchDatasetListeners(dataset, dataset[DATASETLISTENER]);
	}

	static dispatchDatasetListeners(dataset, list) {
		return list.reduce((a, b) => {
			return a.then(() => {
				if (!b.view.isRemoved()) {
					let collector = new Collector({
						data: dataset.getData(),
						fn: b.getter
					});
					let result = collector.invoke();
					b.useprops = collector.getUsedProps();
					return b.view._updateFromConnect({ data: result, setter: b.setter });
				} else {
					return Promise.resolve();
				}
			});
		}, Promise.resolve());
	}
}

module.exports = {
	Service,
	DataSet,
	TransactDataSet,
	DataSetHelper
};