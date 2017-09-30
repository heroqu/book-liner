'use strict'

const request = require('request-promise-native')
const url = require('url')
const defer = require('../lib/defer')
const StringToFileStream = require('../lib/string-2-fstream')
const multiparty = require('multiparty')
const ERRS = require('restify-errors')

const config = require('config')

module.exports = ContentStoreAPI

function ContentStoreAPI () {

  let options = Object.assign(
    { url: 'http://localhost:8002' },
    config.get('content_store')
  )

  const baseUrl = options.url

  return {
    get,
    put,
    del,
    uploadRedirectMiddleware,
    streamFile,
    upload
  }

  /**
  * Redirect external upload request
  */
  function uploadRedirectMiddleware (req, res, next) {
    let files = []
    let taskCounter = 0

    function taskPlus () {
      taskCounter++
    }

    function taskMinus () {
      taskCounter--
      if (taskCounter === 0) {
        if (files.length === 0) {
          res.send(200,
            {
              result: 'no files to upload',
              files
            }
          )
        } else {
          res.send(201,
            {
              result: 'upload OK',
              files
            }
          )
        }
        next()
      }
    }

    const form = new multiparty.Form({ autoFields: true })

    function onAnyError (err) {
      res.send(new ERRS.InternalServerError(err))
      next()
    }

    form.on('part', async function (part) {
      part.on('error', onAnyError)

      try {
        if (part.filename) {
          taskPlus()

          const opts = {
            method: 'POST',
            url: url.resolve(baseUrl, 'upload'),
              // resolveWithFullResponse: true,
            json: true,
            formData: {
              file: {
                value: part,
                options: {
                  filename: part.filename,
                    // contentType: contentType,
                  knownLength: part.byteCount
                }
              }
            }
          }

          const responseBody = await request(opts)

          for (let file of responseBody.files) {
            files.push(file)
          }

          taskMinus()
        }
      } catch (err) {
        onAnyError(err)
      }
    })

    form.on('close', function () {
      taskMinus()
    })

    form.on('error', onAnyError)

    form.parse(req)

    taskPlus()
  }

  /**
  * Download a file identified by digest
  */
  async function get (digest) {
    return request.get(url.resolve(baseUrl, digest))
  }

  /**
  * Send text
  */
  async function put (text, options) {
    return streamFile(StringToFileStream(text, options))
  }

  /**
  * Delete entry
  */
  async function del (digest) {
    return request.del(url.resolve(baseUrl, digest))
  }

  /**
  * Pipe a file stream
  */
  async function streamFile (source) {
    source = await Promise.resolve(source)

    let reqUrl = url.resolve(baseUrl, 'upload')

    let opts = {
      url: reqUrl,
      resolveWithFullResponse: true,
      json: true,
      formData: {
        piped_data: source
      }
    }

    let req = await request.post(opts)
    let digest = req.body.files[0][1]

    return digest
  }

  /**
  * Upload local file
  */
  async function upload (path, options) {
    return streamFile(fs.createReadStream(path, options))
  }
}
