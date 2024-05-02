import type * as fs from 'node:fs';

export type Options = {
	/**
	The directory [permissions](https://x-team.com/blog/file-system-permissions-umask-node-js/).

	@default 0o777
	*/
	readonly mode?: number;

	/**
	Use a custom `fs` implementation. For example [`graceful-fs`](https://github.com/isaacs/node-graceful-fs).

	Using a custom `fs` implementation will block the use of the native `recursive` option if `fs.mkdir` or `fs.mkdirSync` is not the native function.

	Default: `import fs from 'node:fs'`
	*/
	readonly fs?: typeof fs;
};

/**
Make a directory and its parents if needed - Think `mkdir -p`.

@param path - The directory to create.
@returns The path to the created directory.

@example
```
import {makeDirectory} from 'make-dir';

const path = await makeDirectory('unicorn/rainbow/cake');

console.log(path);
//=> '/Users/sindresorhus/fun/unicorn/rainbow/cake'

// Multiple directories:
const paths = await Promise.all([
	makeDirectory('unicorn/rainbow'),
	makeDirectory('foo/bar')
]);

console.log(paths);
// [
// 	'/Users/sindresorhus/fun/unicorn/rainbow',
// 	'/Users/sindresorhus/fun/foo/bar'
// ]
```
*/
export function makeDirectory(path: string, options?: Options): Promise<string>;

/**
Synchronously make a directory and its parents if needed - Think `mkdir -p`.

@param path - The directory to create.
@returns The path to the created directory.

@example
```
import {makeDirectorySync} from 'make-dir';

const path = makeDirectorySync('unicorn/rainbow/cake');

console.log(path);
//=> '/Users/sindresorhus/fun/unicorn/rainbow/cake'
```
*/
export function makeDirectorySync(path: string, options?: Options): string;
