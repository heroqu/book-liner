'use strict'

const { Writable } = require('stream')

module.exports = DevNull

function DevNull (opts) {
  const s = new Writable(opts)

  s._write = function (chunk, encoding, cb) {
    cb()
  }

  return s
}
