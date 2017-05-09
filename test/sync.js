import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempy from 'tempy';
import gracefulFs from 'graceful-fs';
import {getFixture, assertDir} from './helpers/util';
import m from '..';

test('main', t => {
	const dir = getFixture();
	const madeDir = m.sync(dir);
	t.true(madeDir.length > 0);
	assertDir(t, madeDir);
});

test('`fs` option', t => {
	const dir = getFixture();
	m.sync(dir, {fs: gracefulFs});
	assertDir(t, dir);
});

test('`mode` option', t => {
	const dir = getFixture();
	const mode = 0o744;
	m.sync(dir, {mode});
	assertDir(t, dir, mode);

	// Ensure it's writable
	m.sync(dir);
	assertDir(t, dir, mode);
});

test('dir exists', t => {
	const dir = m.sync(tempy.directory());
	t.true(dir.length > 0);
	assertDir(t, dir);
});

test('file exits', t => {
	const fp = tempy.file();
	fs.writeFileSync(fp, '');
	const err = t.throws(() => {
		m.sync(fp);
	});
	t.is(err.code, 'EEXIST');
});

test('root dir', t => {
	const dir = m.sync('/');
	t.true(dir.length > 0);
	assertDir(t, dir);
});

test('race two', t => {
	const dir = getFixture();
	m.sync(dir);
	m.sync(dir);
	assertDir(t, dir);
});

test('race many', t => {
	const dir = getFixture();

	for (let i = 0; i < 100; i++) {
		m.sync(dir);
	}

	assertDir(t, dir);
});

test('handles null bytes in path', t => {
	const dir = path.join(tempy.directory(), 'foo\u0000bar');
	const err = t.throws(() => {
		m.sync(dir);
	}, /null bytes/);
	t.is(err.code, 'ENOENT');
});

if (process.platform === 'win32') {
	test('handles non-existent root', t => {
		// We assume the `o:\` drive doesn't exist on Windows
		const err = t.throws(() => {
			m.sync('o:\\foo');
		}, /no such file or directory/);
		t.is(err.code, 'ENOENT');
	});
}
