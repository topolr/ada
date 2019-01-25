class ViewHadRemovedError extends Error {
	constructor(message) {
		super(message);
		this.name = "ViewHadRemovedError";
	}
}

export {ViewHadRemovedError};