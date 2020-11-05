import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempy from 'tempy';
import gracefulFs from 'graceful-fs';
import semver from 'semver';
import {getFixture, assertDirectory, customFsOptions} from './_util';
import makeDirectory from '..';

test('main', t => {
	const directory = getFixture();
	const madeDirectory = makeDirectory.sync(directory);
	t.true(madeDirectory.length > 0);
	assertDirectory(t, madeDirectory);
});

test('`fs` option - graceful-fs', t => {
	const directory = getFixture();
	makeDirectory.sync(directory, {fs: gracefulFs});
	assertDirectory(t, directory);
});

test('`fs` option - custom', t => {
	const directory = getFixture();
	const madeDirectory = makeDirectory.sync(directory, customFsOptions);
	t.true(madeDirectory.length > 0);
	assertDirectory(t, madeDirectory);
});

test('`mode` option', t => {
	const directory = getFixture();
	const mode = 0o744;
	makeDirectory.sync(directory, {mode});
	assertDirectory(t, directory, mode);

	// Ensure it's writable
	makeDirectory.sync(directory);
	assertDirectory(t, directory, mode);
});

test('dir exists', t => {
	const directory = makeDirectory.sync(tempy.directory());
	t.true(directory.length > 0);
	assertDirectory(t, directory);
});

test('file exits', t => {
	const filePath = tempy.file();
	fs.writeFileSync(filePath, '');
	t.throws(() => {
		makeDirectory.sync(filePath);
	}, {code: 'EEXIST'});
});

test('parent dir is file', t => {
	const filePath = tempy.file();
	fs.writeFileSync(filePath, '');
	const error = t.throws(() => {
		makeDirectory.sync(filePath + '/sub/dir');
	});
	t.regex(error.code, /ENOTDIR|EEXIST/);
});

test('root dir', t => {
	if (process.platform === 'win32') {
		// Do not assume that `C:` is current drive
		t.throws(() => {
			makeDirectory.sync('/');
		}, {
			code: 'EPERM',
			message: /operation not permitted, mkdir '[A-Za-z]:\\'/
		});
	} else {
		const mode = fs.statSync('/').mode & 0o777;
		const directory = makeDirectory.sync('/');
		t.true(directory.length > 0);
		assertDirectory(t, directory, mode);
	}
});

test('race two', t => {
	const directory = getFixture();
	makeDirectory.sync(directory);
	makeDirectory.sync(directory);
	assertDirectory(t, directory);
});

test('race many', t => {
	const directory = getFixture();

	for (let i = 0; i < 100; i++) {
		makeDirectory.sync(directory);
	}

	assertDirectory(t, directory);
});

test('handles null bytes in path', t => {
	const directory = path.join(tempy.directory(), 'foo\u0000bar');

	const error = t.throws(() => {
		makeDirectory.sync(directory);
	}, /null bytes/);
	t.regex(error.code, /ERR_INVALID_ARG_VALUE|ENOENT/);
});

if (process.platform === 'win32') {
	test('handles non-existent root', t => {
		const expectedError = semver.satisfies(process.version, '>=12') ? {
			code: 'ENOENT',
			message: /no such file or directory, mkdir/
		} : {
			code: 'EPERM',
			message: /operation not permitted, mkdir/
		};

		// We assume the `o:\` drive doesn't exist on Windows.
		t.throws(() => {
			makeDirectory.sync('o:\\foo');
		}, expectedError);
	});
}
