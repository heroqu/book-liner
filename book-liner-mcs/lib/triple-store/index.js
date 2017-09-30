'use strict'

const KVStore = require('../kv-store')

const COMPOSE_KEY = (subject, predicate) => `${subject}:${predicate}`

module.exports = TripleStore

async function TripleStore () {
  const kvStore = await KVStore()

  async function get (subject, predicate) {
    return kvStore.get(COMPOSE_KEY(subject, predicate))
  }

  async function set (subject, predicate, object) {
    return kvStore.set(COMPOSE_KEY(subject, predicate), object)
  }

  async function del (subject, predicate) {
    return kvStore.del(COMPOSE_KEY(subject, predicate))
  }

  return { get, set, del }
}
