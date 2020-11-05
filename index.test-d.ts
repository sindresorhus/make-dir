import {expectType} from 'tsd';
import makeDir = require('.');
import {sync as makeDirSync} from '.';
import * as fs from 'fs';
import * as gfs from 'graceful-fs';

// MakeDir
expectType<Promise<string>>(makeDir('path/to/somewhere'));

expectType<Promise<string>>(
	makeDir('path/to/somewhere', {mode: 0o777})
);
expectType<Promise<string>>(makeDir('path/to/somewhere', {fs}));
expectType<Promise<string>>(makeDir('path/to/somewhere', {fs: gfs}));

// MakeDir (sync)
expectType<string>(makeDirSync('path/to/somewhere'));

expectType<string>(
	makeDirSync('path/to/somewhere', {mode: 0o777})
);
expectType<string>(makeDirSync('path/to/somewhere', {fs}));
expectType<string>(makeDirSync('path/to/somewhere', {fs: gfs}));
