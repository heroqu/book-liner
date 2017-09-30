const { Transform } = require('stream')

module.exports = StreamCollector

function StreamCollector (collect) {
  if (typeof collect !== 'function') {
    throw new TypeError('constructor parameter must be a function')
  }

  const s = new Transform({ objectMode: true })

  s._transform = function (chunk, encoding, done) {
    setImmediate(_ => {
      collect(chunk)
      s.push(chunk)
      done()
    })
  }

  return s
}
