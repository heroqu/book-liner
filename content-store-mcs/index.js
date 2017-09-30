'use strict'

const ContentStore = require('content-store')

// Config
const config = require('config')

const PORT = config.get('port') || 8002
const storageDir = config.get('storage_dir') || 'data'

// Choose hash function implementation
// - which better be fixed once and forever, as its change would
// invalidate the addressing of all the already stored content
const { MetroHash128 } = require('metrohash')
const SEED = config.get('hash.seed') || 123
function createHash () {
  return new MetroHash128(SEED)
}

async function start () {
  const server = await ContentStore({ storageDir }, createHash)

  server.listen(PORT, (err) => {
    if (err) {
      return console.log('something bad happened', err)
    }

    console.log(`Server ${server.name} is listening on ${server.url}`)
  })
}

start()
.catch(console.error)
