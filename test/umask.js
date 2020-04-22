import test from 'ava';
import {getFixture, assertDirectory} from './helpers/util';
import makeDir from '..';

const mask = 0;
test.before(() => {
	process.umask(mask);
});

test('async', async t => {
	const dir = getFixture();
	await makeDir(dir);
	assertDirectory(t, dir, 0o777 & (~mask));
});

test('sync', t => {
	const dir = getFixture();
	makeDir.sync(dir);
	assertDirectory(t, dir, 0o777 & (~mask));
});
