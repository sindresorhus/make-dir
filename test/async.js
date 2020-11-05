import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempy from 'tempy';
import gracefulFs from 'graceful-fs';
import semver from 'semver';
import {getFixture, assertDirectory, customFsOptions} from './_util';
import makeDirectory from '..';

test('main', async t => {
	const directory = getFixture();
	const madeDirectory = await makeDirectory(directory);
	t.true(madeDirectory.length > 0);
	assertDirectory(t, madeDirectory);
});

test('`fs` option - graceful-fs', async t => {
	const directory = getFixture();
	await makeDirectory(directory, {fs: gracefulFs});
	assertDirectory(t, directory);
});

test('`fs` option - custom', async t => {
	const directory = getFixture();
	const madeDirectory = await makeDirectory(directory, customFsOptions);
	t.true(madeDirectory.length > 0);
	assertDirectory(t, madeDirectory);
});

test('`mode` option', async t => {
	const directory = getFixture();
	const mode = 0o744;
	await makeDirectory(directory, {mode});
	assertDirectory(t, directory, mode);

	// Ensure it's writable
	await makeDirectory(directory);
	assertDirectory(t, directory, mode);
});

test('dir exists', async t => {
	const directory = await makeDirectory(tempy.directory());
	t.true(directory.length > 0);
	assertDirectory(t, directory);
});

test('file exits', async t => {
	const filePath = tempy.file();
	fs.writeFileSync(filePath, '');
	await t.throwsAsync(makeDirectory(filePath), {code: 'EEXIST'});
});

test('parent dir is file', async t => {
	const filePath = tempy.file();
	fs.writeFileSync(filePath, '');
	const error = await t.throwsAsync(makeDirectory(filePath + '/sub/dir'));
	t.regex(error.code, /ENOTDIR|EEXIST/);
});

test('root dir', async t => {
	if (process.platform === 'win32') {
		// Do not assume that `C:` is current drive
		await t.throwsAsync(makeDirectory('/'), {
			code: 'EPERM',
			message: /operation not permitted, mkdir '[A-Za-z]:\\'/
		});
	} else {
		const mode = fs.statSync('/').mode & 0o777;
		const directory = await makeDirectory('/');
		t.true(directory.length > 0);
		assertDirectory(t, directory, mode);
	}
});

test('race two', async t => {
	const directory = getFixture();
	await Promise.all([makeDirectory(directory), makeDirectory(directory)]);
	assertDirectory(t, directory);
});

test('race many', async t => {
	const directory = getFixture();
	const all = [];

	for (let i = 0; i < 100; i++) {
		all.push(makeDirectory(directory));
	}

	await Promise.all(all);
	assertDirectory(t, directory);
});

test('handles null bytes in path', async t => {
	const directory = path.join(tempy.directory(), 'foo\u0000bar');
	const error = await t.throwsAsync(makeDirectory(directory), /null bytes/);
	t.regex(error.code, /ERR_INVALID_ARG_VALUE|ENOENT/);
});

test.serial('handles invalid path characters', async t => {
	// We do this to please `nyc`
	const {platform} = process;
	Object.defineProperty(process, 'platform', {
		value: 'win32'
	});

	// Also to please `nyc`
	await makeDirectory(tempy.directory());

	const directory = path.join(tempy.directory(), 'foo"bar');

	await t.throwsAsync(makeDirectory(directory), {
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
		await t.throwsAsync(makeDirectory('o:\\foo'), expectedError);
	});
}
