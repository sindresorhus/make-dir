'use strict';
const fs = require('fs');
const path = require('path');
const pify = require('pify');

const defaults = {
	mode: 0o777 & (~process.umask()),
	fs
};

// https://github.com/nodejs/node/issues/8987
// https://github.com/libuv/libuv/pull/1088
const checkPath = pth => {
	if (process.platform === 'win32') {
		const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path.parse(pth).root, ''));

		if (pathHasInvalidWinCharacters) {
			const error = new Error(`Path contains invalid characters: ${pth}`);
			error.code = 'EINVAL';
			throw error;
		}
	}
};

module.exports = (input, options) => Promise.resolve().then(() => {
	checkPath(input);
	options = Object.assign({}, defaults, options);

	// TODO: Use util.promisify when targeting Node.js 8
	const mkdir = pify(options.fs.mkdir);
	const stat = pify(options.fs.stat);

	const make = pth => {
		return mkdir(pth, options.mode)
			.then(() => pth)
			.catch(error => {
				if (error.code === 'ENOENT') {
					if (error.message.includes('null bytes') || path.dirname(pth) === pth) {
						throw error;
					}

					return make(path.dirname(pth)).then(() => make(pth));
				}

				return stat(pth)
					.then(stats => stats.isDirectory() ? pth : Promise.reject())
					.catch(() => {
						throw error;
					});
			});
	};

	return make(path.resolve(input));
});

module.exports.sync = (input, options) => {
	checkPath(input);
	options = Object.assign({}, defaults, options);

	const make = pth => {
		try {
			options.fs.mkdirSync(pth, options.mode);
		} catch (error) {
			if (error.code === 'ENOENT') {
				if (error.message.includes('null bytes') || path.dirname(pth) === pth) {
					throw error;
				}

				make(path.dirname(pth));
				return make(pth);
			}

			try {
				if (!options.fs.statSync(pth).isDirectory()) {
					throw new Error('The path is not a directory');
				}
			} catch (_) {
				throw error;
			}
		}

		return pth;
	};

	return make(path.resolve(input));
};
