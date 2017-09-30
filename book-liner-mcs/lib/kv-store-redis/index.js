const redis = require('redis')
const bluebird = require('bluebird')

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

module.exports = KVStoreRedis

async function KVStoreRedis (options) {
  options = Object.assign(
    {host:'localhost', port:6379},
    options
  )
  const redisClient = redis.createClient(options.port, options.host)

  async function get (key) {
    return redisClient.getAsync(key)
  }

  async function set (key, value) {
    return redisClient.setAsync(key, value)
  }

  async function del (key) {
    return redisClient.delAsync(key)
  }

  async function flush () {
    return redisClient.flushdbAsync()
  }

  return {
    get,
    set,
    del,
    flush
  }
}
