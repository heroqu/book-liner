'use strict'

module.exports = StringToStream

const { Readable } = require('stream')

/**
* String to stream constructor done right
*/
function StringToStream (str, options) {
  options = Object.assign({ encoding: 'utf8' }, options)

  if (options.objectMode) {
    throw new new RangeError('objectMode is not supported')()
  }

  let buffer = Buffer.from(String(str), options.encoding)

  const s = new Readable(options)

  let chunk

  s._read = function (size) {
    if (!(
      (Number.isFinite(size) && size >= 1) || (size === Infinity)
    )) {  // normalize size
      size = 16384
    }

    while (true) {
      chunk = buffer.slice(0, size)

      if (chunk.length === 0) {  // the string is over
        s.push(null)
        return
      }

      buffer = buffer.slice(size)

      if (!s.push(chunk)) {
        return   // backpressure detected, stop for now
      }
    }
  }

  return s
}
