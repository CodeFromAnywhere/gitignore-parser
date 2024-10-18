# [Gitignore](https://git-scm.com/docs/gitignore#_pattern_format) Parser

A simple yet _complete_ [`.gitignore`](https://git-scm.com/docs/gitignore#_pattern_format) parser for node.js.

## Features

Supports all features listed in the [GIT SCM gitignore manpage](https://git-scm.com/docs/gitignore):

- handles the `**` _wildcard_ anywhere
  - in both the usual usage, e.g. `foo/**/bar`, _and_ also in complexes such as `yo/**la/bin`
  - can be used multiple times in a single pattern, e.g. `foo/**/rec**on`
- handles the `*` _wildcard_
- handles the `?` _wildcard_
- handles `[a-z]` style _character ranges_
- understands `!`-prefixed _negated patterns_
- understands `\#`, `\[`, `\\`, etc. filename _escapes_, thus handles patterns like `\#*#` correctly (_hint: this is NOT a comment line!_)
- deals with any _sequence_ of positive and negative patterns, like this one from the `.gitignore` manpage:

  ```
  # exclude everything except directory foo/bar
  /*
  !/foo
  /foo/*
  !/foo/bar
  ```

- handles any empty lines and _`#` comment lines_ you feed it

- we're filename agnostic: the _"`.gitignore` file"_ does not have to be named `.gitignore` but can be named anything: this parser accepts `.gitignore`-formatted content from anywhere: _you_ load the file, _we_ do the parsing, _you_ feed our `accepts()` or `denies()` APIs any filenames / paths you want filtered and we'll tell you if it's a go or a _no go_.

- extra: an additional API is available for those of you who wish to have the _complete and utter `.gitignore` experience_: use our `inspects(path)` API to know whether the given gitignore filter set did actively filter the given file or did simple allow it to pass through.

  **\*Read as**: if the `.gitignore` has a pattern which matches the given file/path, then we will return `true`, otherwise we return `false`.\*

  Use this in directory trees where you have multiple `.gitignore` files in nested directories and are implementing tooling with `git`-like `.gitignore` behaviour.

## Usage

```js
var parser = require("@cfa/gitignore-parser"),
  fs = require("fs");

var gitignore = parser.compile(fs.readFileSync(".gitignore", "utf8"));

gitignore.accepts("LICENSE.md") === true;
gitignore.denies("LICENSE.md") === false;
gitignore.inspects("LICENSE.md") === false;

gitignore.accepts("node_modules/mocha/bin") === false;
gitignore.denies("node_modules/mocha/bin") === true;
gitignore.inspects("node_modules/mocha/bin") === true;

gitignore.accepts("foo/bar") === true;
gitignore.denies("foo/bar") === false;
gitignore.inspects("foo/bar") === true; // <-- as there's a negated pattern `!foo/bar` addressing this one

var files = [
  ".gitignore",
  ".travis.yml",
  "LICENSE.md",
  "README.md",
  "package.json",
  "lib/index.js",
  "test/index.js",
  "test/mocha.opts",
  "node_modules/mocha/bin/mocha",
  "node_modules/mocha/README.md",
];

// produce only files that are not gitignored
let list = files.filter(gitignore.accepts);

// produce only files that *are* gitignored
let list = files.filter(gitignore.denies);
```

### Notes

- As the `.gitignore` spec differentiates between _patterns_ such as `foo` and `foo/`, where the latter only matches any **directory** named `foo`, you MUST pass the is-this-a-file-or-a-directory info to us when you invoke any of our `accepts()`, `denies()` and `inspects()` APIs by making sure directory paths have a trailing `/`.

  When you feed us straight from [`glob()`](https://www.npmjs.com/package/glob), you can accomplish this in the quickest possible way by using the `glob()` [**`mark`** option](https://www.npmjs.com/package/glob#user-content-options) which auto-postfixes a `/` to each directory it produces.

## See also

TBD

https://github.com/isaacs/node-glob

## License

Apache 2, see [LICENSE.md](./LICENSE.md).
