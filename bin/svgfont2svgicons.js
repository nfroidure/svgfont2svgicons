#! /usr/bin/env node

var svgfont2svgicons = require(__dirname + '/../src/index.js')
  , Fs = require('fs')
  , path = require('path')
;

var fontStream = Fs.createReadStream(process.argv[2]);
var iconProvider = svgfont2svgicons();
var unamedIconCount = 0;

fontStream.pipe(iconProvider);

iconProvider.on('readable', function() {
  var glyph, steam, glyphPath;
  while(null !== glyph) {
    glyph = iconProvider.read();
    if(glyph) {
      glyphPath = path.join(
        process.argv[3],
        (glyph.name || 'icon' + (++unamedIconCount) + '.svg')
      );
      console.log('Saving glyph "' + glyph.name + '" to "' + glyphPath + '"');
      glyph.stream.pipe(Fs.createWriteStream(glyphPath));
    }
  }
});

