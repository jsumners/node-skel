# node-skel

This is a simple CLI tool to initialize a new node project with some common
files, `npm` scripts, and dependencies.

By default the following will be added:

+ A `.editorconfig` file
+ A `.gitignore` file
+ A `.travis.yml` file
+ Development dependences: `pre-commit`, `snazzy`, `standard` and `tap`
+ Scripts for linting and testing
+ Pre-commit hooks for linting and testing

## Install and Usage

```sh
$ npm install -g @jsumners/node-skel
$ mkdir foo-project
$ cd foo-project
$ npm init
$ nskel
```

To learn about the available options, run `nskel run --help`.

> ### Note
> This utility is meant to be run *directly after* `npm init`.
> It will *overwrite* any "scripts" or "precommit" properties in the
> present `package.json` file, and any present dot files.

## License

[MIT License](http://jsumners.mit-license.org/)
