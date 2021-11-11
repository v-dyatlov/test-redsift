/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import EventEmitter from 'events';

export function useFunctionalState(possibleNullState) {
	const [shadow, setShadow] = React.useState(
		possibleNullState && possibleNullState.getValue(),
	);

	React.useEffect(() => {
		const cb = ({ value }) => setShadow(value);
		if (possibleNullState) {
			possibleNullState.on('changed', cb);
		}

		return () => {
			if (possibleNullState) {
				possibleNullState.off('changed', cb);
			}
		};
	}, [possibleNullState]);

	return shadow;
}
export default class FunctionalState extends EventEmitter {
	constructor(value = undefined, changeCallback) {
		super();

		this.callbacks = [];
		this.value = value;
		this.changeCallback = changeCallback;
	}

	destroy() {
		this.callbacks = [];
	}

	useState() {
		const [state, setState] = React.useState(this.value);
		React.useEffect(() => {
			this.callbacks.push(setState);
			return () => {
				this.callbacks = this.callbacks.filter((x) => x !== setState);
			};
		}, [state]);

		return state;
	}

	setState(value, { force } = {}) {
		// Since react won't rerender if the exact same,
		// don't bother hitting callbacks if the same
		if (value === this.value && !force) {
			return;
		}

		// console.log(`set state:`, value);

		this.callbacks.forEach((setState) => setState(value));
		this.value = value;

		if (this.changeCallback) {
			this.changeCallback(value);
		}

		this.emit('changed', { value, state: this });
	}

	setValue(value) {
		this.setState(value);
	}

	getValue() {
		return this.value;
	}
}
