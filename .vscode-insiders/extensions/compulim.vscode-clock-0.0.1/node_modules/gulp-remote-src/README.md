# gulp-remote-src

[![Build Status](https://travis-ci.org/ddliu/gulp-remote-src.png)](https://travis-ci.org/ddliu/gulp-remote-src)

Remote `gulp.src`.

## Installation

Install package with NPM and add it to your development dependencies:

    npm install --save-dev gulp-remote-src

## Usage

```js
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var remoteSrc = require('gulp-remote-src');

gulp.task('remote', function() {
    
remoteSrc(['app.js', 'jquery.js'], {
        base: 'http://myapps.com/assets/',
    })
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));
})
```

## Options

- `base`

    Url base.

- `buffer` (default is true)

    Pipe out files as buffer or as stream. Note that some plugins does not support streaming.

## Request Options

`gulp-remote-src` uses [request](https://github.com/mikeal/request) to make HTTP request, you can specify below
options to customize your request:

* `qs` - object containing querystring values to be appended to the `uri`
* `headers` - http headers (default: `{}`)
* `auth` - A hash containing values `user` || `username`, `pass` || `password`, and `sendImmediately` (optional).  See documentation above.
* `followRedirect` - follow HTTP 3xx responses as redirects (default: `true`). This property can also be implemented as function which gets `response` object as a single argument and should return `true` if redirects should continue or `false` otherwise.
* `followAllRedirects` - follow non-GET HTTP 3xx responses as redirects (default: `false`)
* `maxRedirects` - the maximum number of redirects to follow (default: `10`)
* `timeout` - Integer containing the number of milliseconds to wait for a request to respond before aborting the request
* `proxy` - An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for the `url` parameter (by embedding the auth info in the `uri`)
* `strictSSL` - If `true`, requires SSL certificates be valid. **Note:** to use your own certificate authority, you need to specify an agent that was created with that CA as an option.
* `aws` - `object` containing AWS signing information. Should have the properties `key`, `secret`. Also requires the property `bucket`, unless you’re specifying your `bucket` as part of the path, or the request doesn’t use a bucket (i.e. GET Services)
* `gzip` - If `true`, add an `Accept-Encoding` header to request compressed content encodings from the server (if not already present) and decode supported content encodings in the response.

## Changelog

### v0.1.0 (2014-06-30)

First release.

### v0.2.0 (2014-07-01)

Fix streaming pipe.

Add tests for streaming pipe.

### v0.2.1 (2014-07-18)

Add option `strictSSL` (thank you [@Magomogo](https://github.com/Magomogo))

### v0.3.0 (2014-09-02)

Pass through [request](https://github.com/mikeal/request) options to make it flexible.