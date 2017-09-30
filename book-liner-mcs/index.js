'use strict'

// restify stuff
const restify = require('restify')
const ERRS = require('restify-errors')
const logger = require('morgan')
const multiparty = require('multiparty')

const config = require('config')

const contentStoreAPI = require('./api/api-content-store')()

const BookLiner = require('./lib/book-liner')

async function BookLinerHttp (options) {
  options = Object.assign({ name: 'BookLiner' }, options)

  // 1. Create book-liner app

  const bookLiner = await BookLiner()

  // 2. Create http server wrapping the app

  const server = restify.createServer({ name: options.name })

  server.use(logger('dev'))
  server.use(restify.plugins.acceptParser(server.acceptable))

  // 3. Set up routes

  server.get('/', function (req, res, next) {
    res.send(200, {result: `Hi, this is a ${server.name}. Use POST /upload to send a book`})
    next()
  })

  server.get('/:digest', function (req, res, next) {
    const digest = req.params.digest

    bookLiner.getText(digest)
    .then(result => {
      if (result === null) {
        res.send(new ERRS.NotFoundError('key not found'))
      } else {
        res.send(200, { result })
      }
      next()
    })
    .catch(err => {
      res.send(new ERRS.InternalServerError(err))
      next()
    })
  })

  server.post('/upload', contentStoreAPI.uploadRedirectMiddleware)

  server.post('/split/:digest', async (req, res, next) => {
    const digest = req.params.digest

    const paraDigests = await bookLiner.sliceToParagraphs(digest)

    res.send(200, { paragraphs: paraDigests })
    next()
  })

  server.del('/:digest', (req, res, next) => {
    const digest = req.params.digest

    contentStoreAPI.del(digest)
    .then(numDelleted => {
      if (numDelleted !== 0) {
        res.send(200)
      } else {
        res.send(new ERRS.NotFoundError())
      }
      next()
    })
    .catch(err => {
      res.send(new ERRS.InternalServerError(err))
      next()
    })
  })

  server.on('uncaughtException', function (req, res, route, err) {
    res.send(500, 'Unexpected error occured')
  })

  return server
}

const PORT = config.get('port') || 8001

async function start () {
  const server = await BookLinerHttp(config.get('book_server'))

  server.listen(PORT, (err) => {
    if (err) {
      return console.log('something bad happened', err)
    }

    console.log(`Server ${server.name} is listening on ${server.url}`)
  })
}

start()
.catch(console.error)
