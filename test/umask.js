import test from 'ava';
import {getFixture, assertDirectory} from './helpers/util';
import makeDir from '..';

test.before(() => {
	process.umask(0);
});

test('async', async t => {
	const dir = getFixture();
	await makeDir(dir);
	assertDirectory(t, dir, 0o777 & (~process.umask()));
});

test('sync', t => {
	const dir = getFixture();
	makeDir.sync(dir);
	assertDirectory(t, dir, 0o777 & (~process.umask()));
});
