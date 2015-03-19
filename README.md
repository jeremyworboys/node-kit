# Node Kit

Node based compiler for [.kit files](http://incident57.com/codekit/kit.php).

[![NPM version](https://badge.fury.io/js/node-kit.svg)](http://badge.fury.io/js/node-kit)
[![Build Status](https://travis-ci.org/jeremyworboys/node-kit.svg?branch=master)](https://travis-ci.org/jeremyworboys/node-kit)
[![Gittip](http://img.shields.io/gittip/jeremyworboys.svg)](https://www.gittip.com/jeremyworboys/)


## Installation

Install from npm registry:

```
$ npm install node-kit
```


## Usage

```js
var kit = require('node-kit');
var html = kit('path/to/file.kit');
```


## Running Tests

```
$ npm install
$ make test
```


## License

The MIT License (MIT)

Copyright © 2015 jw@jeremyworboys.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
