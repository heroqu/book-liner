const { Transform } = require('stream')

module.exports = StreamSplitter

function StreamSplitter (delimeter) {
  const s = new Transform({ objectMode: true })

  delimeter = delimeter || '\n'

  let buffer = ''
  let items = []

  s._transform = function (chunk, encoding, done) {
    buffer += chunk.toString()

    // convert from string to items
    items = buffer.split(delimeter)

    // put the very last item back into buffer as string
    // for now, as it can be incomplete
    buffer = items.splice(-1, 1)[0]

    for (let item of items) {
      s.push(item)
    }

    done()
  }

  s._flush = function (done) {
    if (buffer) {
      s.push(buffer)
      buffer = ''
    }
    done()
  }

  return s
}
