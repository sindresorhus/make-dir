import fs from 'fs';
import path from 'path';
import tempy from 'tempy';
import pathType from 'path-type';

export const getFixture = () => path.join(tempy.directory(), 'a/b/c/unicorn_unicorn_unicorn/d/e/f/g/h');

export const assertDir = (t, dir, mode = 0o777 & (~process.umask())) => {
	// Setting `mode` on `mkdir` on Windows doesn't seem to work
	if (process.platform === 'win32') {
		mode = 0o666;
	}

	t.true(pathType.dirSync(dir));
	t.is(fs.statSync(dir).mode & 0o777, mode);
};

/* Using this forces test coverage of legacy method on latest versions of node. */
export const customFsOpt = {
	fs: {
		mkdir: (...args) => fs.mkdir(...args),
		stat: (...args) => fs.stat(...args),
		mkdirSync: (...args) => fs.mkdirSync(...args),
		statSync: (...args) => fs.statSync(...args)
	}
};
