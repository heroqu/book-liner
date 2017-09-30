'use strict'

const config = require('config')

const KVStoreRedis = require('../kv-store-redis')
const redisOptions = config.get('redis')

console.log(`KVStore: redisOptions:`)
console.log(redisOptions)

module.exports = KVStore

async function KVStore () {
  return KVStoreRedis(redisOptions)
}
