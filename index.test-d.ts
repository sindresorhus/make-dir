import * as fs from 'node:fs';
import {expectType} from 'tsd';
import * as gfs from 'graceful-fs';
import {makeDirectory, makeDirectorySync} from './index.js';

// MakeDir
expectType<Promise<string>>(makeDirectory('path/to/somewhere'));

expectType<Promise<string>>(
	makeDirectory('path/to/somewhere', {mode: 0o777}),
);
expectType<Promise<string>>(makeDirectory('path/to/somewhere', {fs}));
expectType<Promise<string>>(makeDirectory('path/to/somewhere', {fs: gfs}));

// MakeDir (sync)
expectType<string>(makeDirectorySync('path/to/somewhere'));

expectType<string>(
	makeDirectorySync('path/to/somewhere', {mode: 0o777}),
);
expectType<string>(makeDirectorySync('path/to/somewhere', {fs}));
expectType<string>(makeDirectorySync('path/to/somewhere', {fs: gfs}));
