import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempy from 'tempy';
import gracefulFs from 'graceful-fs';
import semver from 'semver';
import {getFixture, assertDirectory, customFsOptions} from './helpers/util';
import makeDir from '..';

test('main', t => {
	const dir = getFixture();
	const madeDir = makeDir.sync(dir);
	t.true(madeDir.length > 0);
	assertDirectory(t, madeDir);
});

test('`fs` option - graceful-fs', t => {
	const dir = getFixture();
	makeDir.sync(dir, {fs: gracefulFs});
	assertDirectory(t, dir);
});

test('`fs` option - custom', t => {
	const dir = getFixture();
	const madeDir = makeDir.sync(dir, customFsOptions);
	t.true(madeDir.length > 0);
	assertDirectory(t, madeDir);
});

test('`mode` option', t => {
	const dir = getFixture();
	const mode = 0o744;
	makeDir.sync(dir, {mode});
	assertDirectory(t, dir, mode);

	// Ensure it's writable
	makeDir.sync(dir);
	assertDirectory(t, dir, mode);
});

test('dir exists', t => {
	const dir = makeDir.sync(tempy.directory());
	t.true(dir.length > 0);
	assertDirectory(t, dir);
});

test('file exits', t => {
	const fp = tempy.file();
	fs.writeFileSync(fp, '');
	t.throws(() => {
		makeDir.sync(fp);
	}, {code: 'EEXIST'});
});

test('parent dir is file', t => {
	const fp = tempy.file();
	fs.writeFileSync(fp, '');
	const error = t.throws(() => {
		makeDir.sync(fp + '/sub/dir');
	});
	t.regex(error.code, /ENOTDIR|EEXIST/);
});

test('root dir', t => {
	if (process.platform === 'win32') {
		// Do not assume that `C:` is current drive
		t.throws(() => {
			makeDir.sync('/');
		}, {
			code: 'EPERM',
			message: /operation not permitted, mkdir '[A-Za-z]:\\'/
		});
	} else {
		const mode = fs.statSync('/').mode & 0o777;
		const dir = makeDir.sync('/');
		t.true(dir.length > 0);
		assertDirectory(t, dir, mode);
	}
});

test('race two', t => {
	const dir = getFixture();
	makeDir.sync(dir);
	makeDir.sync(dir);
	assertDirectory(t, dir);
});

test('race many', t => {
	const dir = getFixture();

	for (let i = 0; i < 100; i++) {
		makeDir.sync(dir);
	}

	assertDirectory(t, dir);
});

test('handles null bytes in path', t => {
	const dir = path.join(tempy.directory(), 'foo\u0000bar');

	const error = t.throws(() => {
		makeDir.sync(dir);
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
			makeDir.sync('o:\\foo');
		}, expectedError);
	});
}
