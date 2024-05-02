import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import {temporaryDirectory} from 'tempy';
import {isDirectorySync} from 'path-type';

export const getFixture = () => path.join(temporaryDirectory(), 'a/b/c/unicorn_unicorn_unicorn/d/e/f/g/h');

let lastMask = 0;

function umask() {
	// Avoid deprecation warning in v14+
	lastMask = process.umask(lastMask);
	process.umask(lastMask);
	return lastMask;
}

// Get the initial value before any async operations start
umask();

export const assertDirectory = (t, directory, mode = 0o777 & (~umask())) => { // eslint-disable-line no-bitwise
	// Setting `mode` on `fs.mkdir` on Windows doesn't seem to work
	if (process.platform === 'win32') {
		mode = 0o666;
	}

	t.true(isDirectorySync(directory));
	t.is(fs.statSync(directory).mode & 0o777, mode); // eslint-disable-line no-bitwise
};

// Using this forces test coverage of legacy method on latest versions of Node.js
export const customFsOptions = {
	fs: {
		mkdir: (...arguments_) => fs.mkdir(...arguments_), // eslint-disable-line n/prefer-promises/fs
		stat: (...arguments_) => fs.stat(...arguments_), // eslint-disable-line n/prefer-promises/fs
		mkdirSync: (...arguments_) => fs.mkdirSync(...arguments_),
		statSync: (...arguments_) => fs.statSync(...arguments_),
	},
};
