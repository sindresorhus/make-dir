# make-dir

> Make a directory and its parents if needed - Think `mkdir -p`

> [!TIP]
> You probably want the built-in [`fsPromises.mkdir('…', {recursive: true})`](https://nodejs.org/api/fs.html#fspromisesmkdirpath-options) instead.

### Advantages over `fsPromises.mkdir('…', {recursive: true})`

- Supports a custom `fs` implementation.

### Advantages over [`mkdirp`](https://github.com/substack/node-mkdirp)

- Promise API *(Async/await ready!)*
- Fixes many `mkdirp` issues: [#96](https://github.com/substack/node-mkdirp/pull/96) [#70](https://github.com/substack/node-mkdirp/issues/70) [#66](https://github.com/substack/node-mkdirp/issues/66)
- CI-tested on macOS, Linux, and Windows
- Actively maintained
- Doesn't bundle a CLI
- Uses the native `fs.mkdir/mkdirSync` [`recursive` option](https://nodejs.org/dist/latest/docs/api/fs.html#fs_fs_mkdir_path_options_callback) in Node.js unless [overridden](#fs)

## Install

```sh
npm install make-dir
```

## Usage

```console
$ pwd
/Users/sindresorhus/fun
$ tree
.
```

```js
import {makeDirectory} from 'make-dir';

const path = await makeDirectory('unicorn/rainbow/cake');

console.log(path);
//=> '/Users/sindresorhus/fun/unicorn/rainbow/cake'
```

```console
$ tree
.
└── unicorn
    └── rainbow
        └── cake
```

Multiple directories:

```js
import {makeDirectory} from 'make-dir';

const paths = await Promise.all([
	makeDirectory('unicorn/rainbow'),
	makeDirectory('foo/bar')
]);

console.log(paths);
/*
[
	'/Users/sindresorhus/fun/unicorn/rainbow',
	'/Users/sindresorhus/fun/foo/bar'
]
*/
```

## API

### makeDirectory(path, options?)

Returns a `Promise` for the path to the created directory.

### makeDirectorySync(path, options?)

Returns the path to the created directory.

#### path

Type: `string`

The directory to create.

#### options

Type: `object`

##### mode

Type: `integer`\
Default: `0o777`

The directory [permissions](https://x-team.com/blog/file-system-permissions-umask-node-js/).

##### fs

Type: `object`\
Default: `import fs from 'node:fs'`

Use a custom `fs` implementation. For example [`graceful-fs`](https://github.com/isaacs/node-graceful-fs).

Using a custom `fs` implementation will block the use of the native `recursive` option if `fs.mkdir` or `fs.mkdirSync` is not the native function.

## Related

- [make-dir-cli](https://github.com/sindresorhus/make-dir-cli) - CLI for this module
- [del](https://github.com/sindresorhus/del) - Delete files and directories
- [globby](https://github.com/sindresorhus/globby) - User-friendly glob matching
- [cpy](https://github.com/sindresorhus/cpy) - Copy files
- [cpy-cli](https://github.com/sindresorhus/cpy-cli) - Copy files on the command-line
- [move-file](https://github.com/sindresorhus/move-file) - Move a file
