'use strict'

const config = require('config')

const ContentStoreAPI = require('../../api/api-content-store')
const TripleStore = require('../triple-store')

const StreamSplitter = require('../stream-splitter')
const StreamCollector = require('../stream-collector')
const DevNull = require('../devnull')
const eventPromise = require('../event-promise')
const String2Stream = require('../string-2-stream')

module.exports = BookLiner

async function BookLiner () {
  const contentStoreAPI = ContentStoreAPI()

  const tripleStore = await TripleStore()

  /**
  * Add single relation to a digest
  * Params: (digest, rel, value)
  */
  const addRel = tripleStore.set

  /**
  * Get single relation for a digest
  * Params: (digest, rel)
  */
  const getRel = tripleStore.get

  /**
  * Get a text from content store by its digest
  */
  async function getText (digest) {
    return await contentStoreAPI.get(digest)
  }

  /**
  * Save a text to content store
  */
  async function addText (text) {
    return await contentStoreAPI.put(text)
  }

  /**
  * Save a book content to the content store
  * and add appropriate relation
  */
  async function addBook (fileStream) {
    const digest = await contentStoreAPI.streamFile(fileStream)
    await addRel(digest, 'is_book', true)
    const paraDigest = await sliceToParagraphs(digest)

    // return digest
    return [digest, paraDigest]
  }

  /**
  * Slice text into paragraphs (with '\n' as delimeter),
  * save each paragraph as separate entity
  * and return the list of paragraphs' digests
  */
  async function sliceToParagraphs (digest) {
    // make a readable stream out of entire text
    const text = await contentStoreAPI.get(digest)
    const textStream = String2Stream(text)

    // prepare helper streams to extract paragraphs
    const txtParts = []
    const partCollector = StreamCollector(
      chunk => txtParts.push(chunk.toString())
    )
    const splitter = StreamSplitter('\n')
    const devnull = DevNull()

    textStream
    .pipe(splitter)        // cut text into parts
    .pipe(partCollector)   // collect the parts
    .pipe(devnull)         // black hole to consume it

    await eventPromise(devnull, 'finish')

    // save paragraphs and get their respective digests
    let partDigests = await Promise.all(
      txtParts.map(contentStoreAPI.put)
    )

    // relate each paragraph to the entire text
    // and the paragraph's ordinal number
    let counter = 0
    await Promise.all(
      partDigests.map(
        partDigest =>
        addRel(digest, `para_#_${counter++}`, partDigest)
      )
    )

    // Save the list as a standalone entity to the store
    const paragraphList = partDigests.join(',')
    const paragraphListDigest = await contentStoreAPI.put(paragraphList)

    await addRel(digest, 'paragraphs', paragraphListDigest)

    // the digest of list of paragraphs' digest
    return paragraphListDigest
  }

  /**
  * Get list parapraph's digests
  * The result is a string of digests joined with comma
  */

  async function getParagraphList (digest) {
    let paragraphListDigest = await getRel(digest, 'paragraphs')
    return contentStoreAPI.get(paragraphListDigest)
  }

  /**
  * Get parapraph text by book digest and paragraph index
  */
  async function getParagraph (digest, index) {
    let paragraphList = await getParagraphList(digest)
    let paragraphDigests = paragraphList.split(',')
    if (typeof index === 'number' && index >= 0
        && index < paragraphDigests.length) {
      let digest = paragraphDigests[index]
      return contentStoreAPI.get(digest)
    }
  }

  return {
    addRel,
    addText,
    addBook,
    sliceToParagraphs,
    getText,
    getParagraphList,
    getParagraph
  }
}
