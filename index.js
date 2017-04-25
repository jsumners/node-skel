#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const pwd = process.env['PWD']
const files = [
  path.join(__dirname, 'files', 'editorconfig'),
  path.join(__dirname, 'files', 'gitignore')
]

files.forEach((f) => {
  const fname = path.basename(f)
  const outs = fs.createWriteStream(path.join(pwd, '.' + fname))
  const ins = fs.createReadStream(f)
  ins.pipe(outs)
})
