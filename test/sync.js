import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempy from 'tempy';
import gracefulFs from 'graceful-fs';
import {getFixture, assertDir} from './helpers/util';
import makeDir from '..';

test('main', t => {
	const dir = getFixture();
	const madeDir = makeDir.sync(dir);
	t.true(madeDir.length > 0);
	assertDir(t, madeDir);
});

test('`fs` option', t => {
	const dir = getFixture();
	makeDir.sync(dir, {fs: gracefulFs});
	assertDir(t, dir);
});

test('`mode` option', t => {
	const dir = getFixture();
	const mode = 0o744;
	makeDir.sync(dir, {mode});
	assertDir(t, dir, mode);

	// Ensure it's writable
	makeDir.sync(dir);
	assertDir(t, dir, mode);
});

test('dir exists', t => {
	const dir = makeDir.sync(tempy.directory());
	t.true(dir.length > 0);
	assertDir(t, dir);
});

test('file exits', t => {
	const fp = tempy.file();
	fs.writeFileSync(fp, '');
	t.throws(() => {
		makeDir.sync(fp);
	}, {code: 'EEXIST'});
});

test('root dir', t => {
	const mode = fs.statSync('/').mode & 0o777;
	const dir = makeDir.sync('/');
	t.true(dir.length > 0);
	assertDir(t, dir, mode);
});

test('race two', t => {
	const dir = getFixture();
	makeDir.sync(dir);
	makeDir.sync(dir);
	assertDir(t, dir);
});

test('race many', t => {
	const dir = getFixture();

	for (let i = 0; i < 100; i++) {
		makeDir.sync(dir);
	}

	assertDir(t, dir);
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
		// We assume the `o:\` drive doesn't exist on Windows
		t.throws(() => {
			makeDir.sync('o:\\foo');
		}, {
			code: 'ENOENT',
			message: /no such file or directory/
		});
	});
}
