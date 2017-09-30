# Content-store microservice

This is a wrapper around [content-store](https://www.npmjs.com/package/content-store) npm module, which is supposed to run a *http content-addressable file store*.

## Running inside docker container

If might be a good idea to test this microservice as such before using it as a backend for other containers. The local `docker-compose.yml` file is placed here especially for that purpose. Start the terminal in the microservice dir and issue the command:

```
$ docker-compose up
...
   some docker building steps (only when run the first time)
...
Starting contentstoremcs_store_1 ...
Starting contentstoremcs_store_1 ... done
Attaching to contentstoremcs_store_1
store_1  | Server content-store is listening on http://[::]:8002
```

So far so good. Now we can see `localhost:8002` (or `http://[::]:8002` to be exact) address of the content store. But this is what docker shows. If you look inside `docker-compose.yml` you'll see that there is a mapping involved:
```
  ports:
    - 9002:8002
```

I used different port numbers to keep things clear as to which is which. Change to any ports you like, just don't forget to update config json files that set the internal docker port number.

Now we can access port 9002 on host to reach port 8002 inside container.

Here we go:

```
$ curl -i http://localhost:9002
HTTP/1.1 200 OK
Server: content-store
Content-Type: application/json
Content-Length: 81
Date: Sat, 30 Sep 2017 19:10:54 GMT
Connection: keep-alive

{"result":"Hi, this is a content-store. Use POST /upload to feed me with files."}
```

If you see that, it's working.

Now we can also test file uploading. Suppose we have a file 'sample.txt' in current directory and issue a command (which is a curl way of uploading files as `multipart/form-data`):

```
$ curl -i -F 'somefile=@sample.txt' http://localhost:9002/upload
HTTP/1.1 100 Continue

HTTP/1.1 201 Created
Server: content-store
Content-Type: application/json
Content-Length: 82
Date: Sat, 30 Sep 2017 19:34:03 GMT
Connection: keep-alive

{"result":"upload OK","files":[["sample.txt","dd96142785c4d71a12d31dd9e8b7b685"]]}
```

Which means we've just successfully uploaded the file and got back its hash digest.

Now we can use this digest to try to get the file content back with a GET request:

```
$ curl -i http://localhost:9002/dd96142785c4d71a12d31dd9e8b7b685
HTTP/1.1 200 OK
Server: content-store
Cache-Control: public, max-age=3600
Content-Length: 593
Content-Type: application/octet-stream
Last-Modified: Sat, 30 Sep 2017 19:34:03 GMT
Date: Sat, 30 Sep 2017 19:36:50 GMT
Connection: keep-alive

On 25 March an unusually strange event occurred in St. Petersburg.
For that morning Barber Ivan Yakovlevitch, a dweller on the Voznesensky Prospekt (his family name is lost now — it no longer figures on a signboard bearing a portrait of a gentleman with a soaped cheek, and the words: “Also, Blood Let Here”) — for that morning Barber Ivan Yakovlevitch awoke early, and caught the smell of newly baked bread.
Raising himself a little, he perceived his wife (a most respectable lady, and one especially fond of coffee) to be just in the act of drawing newly baked rolls from the oven.
```

And I got back the content of my sample file here.

Finally one can delete the entry:

```
$ curl -i -X DELETE http://localhost:9002/dd96142785c4d71a12d31dd9e8b7b685
HTTP/1.1 200 OK
Server: content-store
Date: Sat, 30 Sep 2017 19:42:32 GMT
Connection: keep-alive
Transfer-Encoding: chunked

```

And this is basically how other parts of our application can interact with this content-store microservice.
