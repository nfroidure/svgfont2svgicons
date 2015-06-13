# svgfont2svgicons
> svgfont2svgicons is a simple tool to explode a SVG font into multiple icons.

[![NPM version](https://badge.fury.io/js/svgfont2svgicons.png)](https://npmjs.org/package/svgfont2svgicons) [![Build status](https://secure.travis-ci.org/nfroidure/svgfont2svgicons.png)](https://travis-ci.org/nfroidure/svgfont2svgicons) [![Dependency Status](https://david-dm.org/nfroidure/svgfont2svgicons.png)](https://david-dm.org/nfroidure/svgfont2svgicons) [![devDependency Status](https://david-dm.org/nfroidure/svgfont2svgicons/dev-status.png)](https://david-dm.org/nfroidure/svgfont2svgicons#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/nfroidure/svgfont2svgicons/badge.png?branch=master)](https://coveralls.io/r/nfroidure/svgfont2svgicons?branch=master) [![Code Climate](https://codeclimate.com/github/nfroidure/svgfont2svgicons.png)](https://codeclimate.com/github/nfroidure/svgfont2svgicons)

## Usage
NodeJS module:
```js
var svgfont2svgicons = require('svgfont2svgicons');
var fs = require('fs');
var iconProvider = svgfont2svgicons(options);
var fontStream = fs.createReadStream('myFont.svg');

// Piping the font
fontStream.pipe(iconProvider);

// Saving the SVG files
iconProvider.on('readable', function() {
  var icon;
  do {
    icon = iconProvider.read();
    if(icon) {
      console.log('New icon:', icon.name, icon.codepoint);
      icon.stream.pipe(fs.createWriteStream(icon.name + '.svg'));
    }
  } while(null !== icon);
}).once('end',function() {
  console.log('No more icons !')
});
```

CLI (install the module globally):
```sh
svgfont2svgicons font/src/file.svg icons/dest/directory
```

## Options

Currently no options, feel free to suggest some in
 [the issues](https://github.com/nfroidure/svgfont2svgicons/issues).

## Stats

[![NPM](https://nodei.co/npm/svgfont2svgicons.png?downloads=true&stars=true)](https://nodei.co/npm/svgicon2svgfont/)
[![NPM](https://nodei.co/npm-dl/svgfont2svgicons.png)](https://nodei.co/npm/svgicon2svgfont/)

## Contributing
Feel free to pull your code if you agree with publishing under the MIT license.

