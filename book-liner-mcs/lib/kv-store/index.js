'use strict'

const config = require('config')

const KVStoreRedis = require('../kv-store-redis')
const redisOptions = config.get('redis')

module.exports = KVStore

async function KVStore () {
  return KVStoreRedis(redisOptions)
}
