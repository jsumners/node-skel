#!/usr/bin/env node
'use strict'

const {spawn} = require('child_process')
const fs = require('fs')
const path = require('path')
const {which} = require('@cedx/which')
const NpmApi = require('npm-api')
const npm = new NpmApi()
const files = {
  editorconfig: { src: path.join(__dirname, 'files', 'editorconfig'), name: '.editorconfig' },
  gitignore: { src: path.join(__dirname, 'files', 'gitignore'), name: '.gitignore' },
  travis: { src: path.join(__dirname, 'files', 'travis.yml'), name: '.travis.yml' }
}

const pkg = require('./package.json')
const prog = require('sade')('nskel')

// TODO: allow specifying package manager binary
prog
  .version(pkg.version)
  .describe('A utility to help bootstrap a Node.js project.')

prog
  .command('run', 'Generate files and/or create scripts and install packages', {default: true})
  .example('-A')
  .option('--all, -a', 'Generate all dot files, add scripts, and install packages', true)
  .option('--all-files, -A', 'Generate all dot files', false)
  .option('--editorconfig, -e', 'Generate .editorconfig file', false)
  .option('--gitignore, -g', 'Generate .gitignore file', false)
  .option('--scripts, -s', 'Add standard scripts to package.json and install packages', false)
  .option('--travis, -t', 'Generate .travis.yml file', false)
  .action(run)

prog.parse(process.argv)

async function getPkgManager () {
  console.log('Looking up package manager')
  let manager
  try {
    manager = await which('pnpm')
    console.log('Using pnpm via %s', manager)
  } catch (e) {}
  if (manager) return manager

  try {
    manager = await which('npm')
    console.log('Using npm via %s', manager)
  } catch (e) {
    console.error('Cannot find compatible package manager in PATH.')
    process.exit(1)
  }
  return manager
}

async function run (options) {
  const cwd = process.cwd()
  try {
    require(path.join(cwd, 'package.json'))
  } catch (err) {
    if (options.all || options.scripts) {
      console.error('Must have existing package.json to continue. Use `npm init` first.')
      process.exit(1)
    }
  }

  if (options.all || options.scripts) {
    writeScriptsAndVersions(async (err) => {
      if (err) {
        console.error('Could not write package.json: %s', err.message)
        process.exit(1)
      }
      const manager = await getPkgManager()
      console.log('Installing packages')
      const child = spawn(manager, ['install'], {cwd})
      child.on('close', (code, signal) => {
        if (code !== 0) {
          console.error('Error installing packages. Got code: %s', code)
          process.exit(code)
        }

        console.log(require(require.resolve(cwd + '/package.json')))

        deployFiles()
      })
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
    })
  } else {
    deployFiles()
  }

  function deployFiles () {
    if (options.all || options.A) {
      return deployAllFiles()
    }
    if (options.editorconfig) deployFile(files.editorconfig)
    if (options.gitignore) deployFile(files.gitignore)
    if (options.travis) deployFile(files.travis)
  }
}

async function writeScriptsAndVersions (cb) {
  console.log('Adding scripts')
  const cwd = process.cwd()
  const packageFile = path.join(cwd, 'package.json')
  const pkg = require(packageFile)
  pkg.scripts = {
    'lint': 'standard | snazzy',
    'lint-ci': 'standard',
    'test': `tap --no-cov 'test/**/*.test.js'`,
    'test-ci': `tap --cov --coverage-report=text 'test/**/*.test.js'`
  }
  pkg.precommit = ['lint', 'test']
  const deps = Object.create(pkg.dependencies || {})
  const devDeps = Object.create(pkg.devDependencies || {})
  delete pkg.dependencies
  delete pkg.devDependencies

  try {
    const standard = await npm.repo('standard').package()
    const snazzy = await npm.repo('snazzy').package()
    const tap = await npm.repo('tap').package()
    const preCommit = await npm.repo('pre-commit').package()

    devDeps['pre-commit'] = `^${preCommit.version}`
    devDeps.snazzy = `^${snazzy.version}`
    devDeps.standard = `^${standard.version}`
    devDeps.tap = `^${tap.version}`

    pkg.dependencies = deps
    pkg.devDependencies = devDeps

    var data = JSON.stringify(pkg, null, 2) + '\n'
    fs.writeFile(packageFile, data, 'utf8', function (err) {
      return cb(err)
    })
  } catch (e) {
    console.error('Could not get package versions: %s', e.message)
    process.exit(1)
  }
}

function deployAllFiles () {
  Object.keys(files).forEach((key) => {
    deployFile(files[key])
  })
}

function deployFile (file) {
  console.log('Generating %s', file.name)
  const cwd = process.cwd()
  const outs = fs.createWriteStream(path.join(cwd, file.name))
  const ins = fs.createReadStream(file.src)
  ins.pipe(outs)
}
