import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempy from 'tempy';
import gracefulFs from 'graceful-fs';
import {getFixture, assertDir} from './helpers/util';
import m from '..';

test('main', async t => {
	const dir = getFixture();
	const madeDir = await m(dir);
	t.true(madeDir.length > 0);
	assertDir(t, madeDir);
});

test('`fs` option', async t => {
	const dir = getFixture();
	await m(dir, {fs: gracefulFs});
	assertDir(t, dir);
});

test('`mode` option', async t => {
	const dir = getFixture();
	const mode = 0o744;
	await m(dir, {mode});
	assertDir(t, dir, mode);

	// Ensure it's writable
	await m(dir);
	assertDir(t, dir, mode);
});

test('dir exists', async t => {
	const dir = await m(tempy.directory());
	t.true(dir.length > 0);
	assertDir(t, dir);
});

test('file exits', async t => {
	const fp = tempy.file();
	fs.writeFileSync(fp, '');
	const err = await t.throwsAsync(m(fp));
	t.is(err.code, 'EEXIST');
});

test('root dir', async t => {
	const mode = fs.statSync('/').mode & 0o777;
	const dir = await m('/');
	t.true(dir.length > 0);
	assertDir(t, dir, mode);
});

test('race two', async t => {
	const dir = getFixture();
	await Promise.all([m(dir), m(dir)]);
	assertDir(t, dir);
});

test('race many', async t => {
	const dir = getFixture();
	const all = [];

	for (let i = 0; i < 100; i++) {
		all.push(m(dir));
	}

	await Promise.all(all);
	assertDir(t, dir);
});

test('handles null bytes in path', async t => {
	const dir = path.join(tempy.directory(), 'foo\u0000bar');
	const err = await t.throwsAsync(m(dir), /null bytes/);
	t.regex(err.code, /ERR_INVALID_ARG_VALUE|ENOENT/);
});

test.serial('handles invalid path characters', async t => {
	// We do this to please `nyc`
	const {platform} = process;
	Object.defineProperty(process, 'platform', {
		value: 'win32'
	});

	// Also to please `nyc`
	await m(tempy.directory());

	const dir = path.join(tempy.directory(), 'foo"bar');
	const err = await t.throwsAsync(m(dir), /invalid characters/);
	t.is(err.code, 'EINVAL');

	Object.defineProperty(process, 'platform', {
		value: platform
	});
});

if (process.platform === 'win32') {
	test('handles non-existent root', async t => {
		// We assume the `o:\` drive doesn't exist on Windows
		const err = await t.throwsAsync(m('o:\\foo'), /no such file or directory/);
		t.is(err.code, 'ENOENT');
	});
}
