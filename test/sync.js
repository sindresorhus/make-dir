import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'ava';
import {temporaryDirectory, temporaryFile} from 'tempy';
import gracefulFs from 'graceful-fs';
import {makeDirectorySync} from '../index.js';
import {getFixture, assertDirectory, customFsOptions} from './_util.js';

test('main', t => {
	const directory = getFixture();
	const madeDirectory = makeDirectorySync(directory);
	t.true(madeDirectory.length > 0);
	assertDirectory(t, madeDirectory);
});

test('`fs` option - graceful-fs', t => {
	const directory = getFixture();
	makeDirectorySync(directory, {fs: gracefulFs});
	assertDirectory(t, directory);
});

test('`fs` option - custom', t => {
	const directory = getFixture();
	const madeDirectory = makeDirectorySync(directory, customFsOptions);
	t.true(madeDirectory.length > 0);
	assertDirectory(t, madeDirectory);
});

test('`mode` option', t => {
	const directory = getFixture();
	const mode = 0o744;
	makeDirectorySync(directory, {mode});
	assertDirectory(t, directory, mode);

	// Ensure it's writable
	makeDirectorySync(directory);
	assertDirectory(t, directory, mode);
});

test('directory exists', t => {
	const directory = makeDirectorySync(temporaryDirectory());
	t.true(directory.length > 0);
	assertDirectory(t, directory);
});

test('file exists', t => {
	const filePath = temporaryFile();
	fs.writeFileSync(filePath, '');
	t.throws(() => {
		makeDirectorySync(filePath);
	}, {code: 'EEXIST'});
});

test('parent directory is file', t => {
	const filePath = temporaryFile();
	fs.writeFileSync(filePath, '');
	const error = t.throws(() => {
		makeDirectorySync(filePath + '/sub/dir');
	});
	t.regex(error.code, /ENOTDIR|EEXIST/);
});

test('root directory', t => {
	if (process.platform === 'win32') {
		// Do not assume that `C:` is current drive
		t.throws(() => {
			makeDirectorySync('/');
		}, {
			code: 'EPERM',
			message: /operation not permitted, mkdir '[A-Za-z]:\\'/,
		});
	} else {
		const mode = fs.statSync('/').mode & 0o777; // eslint-disable-line no-bitwise
		const directory = makeDirectorySync('/');
		t.true(directory.length > 0);
		assertDirectory(t, directory, mode);
	}
});

test('race two', t => {
	const directory = getFixture();
	makeDirectorySync(directory);
	makeDirectorySync(directory);
	assertDirectory(t, directory);
});

test('race many', t => {
	const directory = getFixture();

	for (let index = 0; index < 100; index++) {
		makeDirectorySync(directory);
	}

	assertDirectory(t, directory);
});

test('handles null bytes in path', t => {
	const directory = path.join(temporaryDirectory(), 'foo\u0000bar');

	const error = t.throws(() => {
		makeDirectorySync(directory);
	}, {
		message: /null bytes/,
	});

	t.regex(error.code, /ERR_INVALID_ARG_VALUE|ENOENT/);
});

if (process.platform === 'win32') {
	test('handles non-existent root', t => {
		const expectedError = {
			code: 'ENOENT',
			message: /no such file or directory, mkdir/,
		};

		// We assume the `o:\` drive doesn't exist on Windows.
		t.throws(() => {
			makeDirectorySync('o:\\foo');
		}, expectedError);
	});
}
