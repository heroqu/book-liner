'use strict'

module.exports = StringToFileStream

const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)

const os = require('os')
const defer = require('./defer')
const { randomBytes } = require('crypto')

const TMPDIR = os.tmpdir()

function TmpPath () {
  const dfd = defer()

  randomBytes(8, (err, buf) => {
    if (err) {
      dfd.reject(err)
    } else {
      dfd.resolve(path.resolve(TMPDIR, buf.toString('hex')))
    }
  })

  return dfd
}

async function StringToFileStream (txt, options) {
  const filepath = await TmpPath()

  options = Object.assign({}, options)

  await writeFile(filepath, txt, options)

  return fs.createReadStream(filepath, options)
}
