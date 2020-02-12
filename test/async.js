import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempy from 'tempy';
import gracefulFs from 'graceful-fs';
import semver from 'semver';
import {getFixture, assertDirectory, customFsOptions} from './helpers/util';
import makeDir from '..';

test('main', async t => {
	const dir = getFixture();
	const madeDir = await makeDir(dir);
	t.true(madeDir.length > 0);
	assertDirectory(t, madeDir);
});

test('`fs` option - graceful-fs', async t => {
	const dir = getFixture();
	await makeDir(dir, {fs: gracefulFs});
	assertDirectory(t, dir);
});

test('`fs` option - custom', async t => {
	const dir = getFixture();
	const madeDir = await makeDir(dir, customFsOptions);
	t.true(madeDir.length > 0);
	assertDirectory(t, madeDir);
});

test('`mode` option', async t => {
	const dir = getFixture();
	const mode = 0o744;
	await makeDir(dir, {mode});
	assertDirectory(t, dir, mode);

	// Ensure it's writable
	await makeDir(dir);
	assertDirectory(t, dir, mode);
});

test('dir exists', async t => {
	const dir = await makeDir(tempy.directory());
	t.true(dir.length > 0);
	assertDirectory(t, dir);
});

test('file exits', async t => {
	const fp = tempy.file();
	fs.writeFileSync(fp, '');
	await t.throwsAsync(makeDir(fp), {code: 'EEXIST'});
});

test('parent dir is file', async t => {
	const fp = tempy.file();
	fs.writeFileSync(fp, '');
	const error = await t.throwsAsync(makeDir(fp + '/sub/dir'));
	t.regex(error.code, /ENOTDIR|EEXIST/);
});

test('root dir', async t => {
	if (process.platform === 'win32') {
		// Do not assume that `C:` is current drive
		await t.throwsAsync(makeDir('/'), {
			code: 'EPERM',
			message: /operation not permitted, mkdir '[A-Za-z]:\\'/
		});
	} else {
		const mode = fs.statSync('/').mode & 0o777;
		const dir = await makeDir('/');
		t.true(dir.length > 0);
		assertDirectory(t, dir, mode);
	}
});

test('race two', async t => {
	const dir = getFixture();
	await Promise.all([makeDir(dir), makeDir(dir)]);
	assertDirectory(t, dir);
});

test('race many', async t => {
	const dir = getFixture();
	const all = [];

	for (let i = 0; i < 100; i++) {
		all.push(makeDir(dir));
	}

	await Promise.all(all);
	assertDirectory(t, dir);
});

test('handles null bytes in path', async t => {
	const dir = path.join(tempy.directory(), 'foo\u0000bar');
	const error = await t.throwsAsync(makeDir(dir), /null bytes/);
	t.regex(error.code, /ERR_INVALID_ARG_VALUE|ENOENT/);
});

test.serial('handles invalid path characters', async t => {
	// We do this to please `nyc`
	const {platform} = process;
	Object.defineProperty(process, 'platform', {
		value: 'win32'
	});

	// Also to please `nyc`
	await makeDir(tempy.directory());

	const dir = path.join(tempy.directory(), 'foo"bar');

	await t.throwsAsync(makeDir(dir), {
		code: 'EINVAL',
		message: /invalid characters/
	});

	Object.defineProperty(process, 'platform', {
		value: platform
	});
});

if (process.platform === 'win32') {
	test('handles non-existent root', async t => {
		const expectedError = semver.satisfies(process.version, '>=12') ? {
			code: 'ENOENT',
			message: /no such file or directory, mkdir/
		} : {
			code: 'EPERM',
			message: /operation not permitted, mkdir/
		};

		// We assume the `o:\` drive doesn't exist on Windows.
		await t.throwsAsync(makeDir('o:\\foo'), expectedError);
	});
}
