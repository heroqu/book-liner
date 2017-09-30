# book-liner

Content addressable store for texts / books. Support splitting a book into a list of addressable lines / paragraphs.

The goals and concepts behind the server are described in [Ideas behind section](#ideas-behind) near the end of this page.

## Running the server

To start the server do:

`docker-compose up --build`

This will build and run three containers:

- book-liner
  - main app with business logics
- content-store
  - file server to store text contents
- redis_db
  - backend for key-value storage

## API

1. Check server health

  ```
  $ curl http://localhost:9001
  {"result":"Hi, this is a BookLiner. Use POST /upload to send a book"}
  ```

2. Upload a file with text (as `multipart/form-data`), providing the file is 'sample.txt':

  ```
  $ curl -F 'samplefile=@sample.txt' http://localhost:9001/upload
  {"result":"upload OK","files":[["sample.txt","dd96142785c4d71a12d31dd9e8b7b685"]]}
  ```

3. Getting the text back from server:

  ```
  $ curl http://localhost:9001/dd96142785c4d71a12d31dd9e8b7b685
  On 25 March an unusually strange event occurred in St. Petersburg.
  For that morning Barber Ivan Yakovlevitch, a dweller on the Voznesensky Prospekt (his family name is lost now — it no longer figures on a signboard bearing a portrait of a gentleman with a soaped cheek, and the words: “Also, Blood Let Here”) — for that morning Barber Ivan Yakovlevitch awoke early, and caught the smell of newly baked bread.
  Raising himself a little, he perceived his wife (a most respectable lady, and one especially fond of coffee) to be just in the act of drawing newly baked rolls from the oven.
  ```

  The text response may vary (as no two books are usually exactly the same in terms of their text contents).

4. Splitting previously uploaded book's text into paragraphs (using new line character as delimiter):

  ```
  $ curl -X POST http://localhost:9001/split/dd96142785c4d71a12d31dd9e8b7b685
  {"paragraphs":"4c2b7e05107a1e7bfe4a0d6c2fa78eb4"}
  ```

5. To get hash digests of all just created paragraph entries use the same GET request again, but now with the digest received after splitting:

  ```
  $ curl http://localhost:9001/4c2b7e05107a1e7bfe4a0d6c2fa78eb4
  {"result":"d69dec604e749eb4bc588e26ace096a5\n434e6dec39caa1f465b66e881fb81c21\n34cdd73f3dc048fdeb217bfb3af83f4d"}
  ```

6. Now having the list of digests of all the paragraphs one can at will get the text of any particular one, e.g. the last most:

  ```
  $ curl http://localhost:9001/34cdd73f3dc048fdeb217bfb3af83f4d
  {"result":"Raising himself a little, he perceived his wife (a most respectable lady, and one especially fond of coffee) to be just in the act of drawing newly baked rolls from the oven."}
  ```


7. Deleting any entry by its digest:

  ```
  $ curl -X DELETE http://localhost:9001/dd96142785c4d71a12d31dd9e8b7b685
  ```

## Architecture

The redis container is elementary and is linked to the main app in the standard way. The BookLiner app connects to it through tcp/ip connection. Redis is used as a backend for key-value store, which in turn is a backend for higher level triple store (see lib directory where each layer is separated into a subdirectory). The main BookLiner app then using this triple store to store semantic info: the relations between book and it's parts: currently paragraphs.

The content-store container is being run as HTTP server, which wraps the content-store npm module. BookLiner connects to it though contentStoreAPI layer which goal is to wrap each functional call into a particular HTTP request to the content server. The most interesting route is uploadRedirect: when client uploads a file the initial request goes to BookLiner container, which then calls this upload redirect method which process multipart/form-data in such a way that each file part is being uploaded to the content-store container. The results of each part upload are collected and awaited. When all the files are uploaded, the full result is created and returned back to client.

## Ideas behind

The server is designed to store texts in a content-addressable fashion. When one uploads a text, one gets back its hash digest which is deterministic. Having the digest one can restore the text back. If the hash algorithm is good enough (the probability of collision is very low), then there is basically one-to-one relation between texts and digests. Send the digest around and turn it back into a text at any time.

Another feature is splitting the text (book) into meaningful chunks, e.g. paragraphs, chapters etc. The server currently supports splitting to paragraphs, but this functionality can be extended. Sub-texts are then *related* to the main text in the following manner:

book <-> digest

paragraph1 <-> digest1
paragraph2 <-> digest2
paragraph3 <-> digest3

( digest1, paragraph_1, digest )
( digest2, paragraph_2, digest )
( digest3, paragraph_3, digest )

Here the paragraph_N is the name of Relation, digest_N is Subject, digest (of the book) is Object.

These *triples* are stored in triple store, which is currently using a key-value store with redis backend. There are very advanced triple stores out there, but current setup can be considered a proof of a concept.

The goal of the this BookLiner is to ease the extracting any Line out of a Book, hence the name.

Imagine you send a person a short message with a single digest in it. This digest can be a list of N digests, which in turn can means a book each. So one can send an arbitrary set of books/texts with a single short digest, and the receiver will be able to extract everything into original texts providing those texts were stored in the server (or other servers).

This idea can be developed further. One can send any hierarchy of real data with a single digest, and the data can be restored in a predictable deterministic way.

What is limiting you? Only your own imagination.

This setup demonstrates how easy it is to build a server like that.
