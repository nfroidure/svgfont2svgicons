#! /usr/bin/env node

var svgfont2svgicons = require(__dirname + '/../src/index.js'),
  Fs = require('fs'),
  path = require('path');

var srcFile,
  destPath,
  options = {};

for (var i = 2; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case '--namemap':
      options.namemap = JSON.parse(Fs.readFileSync(process.argv[++i]));
      break;
    case '--help':
    case '--usage':
      console.log([
        'node ' + process.argv[2] + ' <source svg file> <destination path>',
        '  --namemap <json file>'
      ].join('\n'));
      break;
    default:
      if (!srcFile)
        srcFile = process.argv[i];
      else if (!destPath)
        destPath = process.argv[i];
  }
}

if (!srcFile || !destPath)
  console.log('see --usage');

var fontStream = Fs.createReadStream(srcFile);
var iconProvider = svgfont2svgicons();
var unamedIconCount = 0;

fontStream.pipe(iconProvider);

iconProvider.on('readable', function() {
  var glyph;
  while((glyph = iconProvider.read()) !== null) {
    var glyphName = glyph.name,
      readableHex = glyph.metadata.unicode.map(function(str) {
        return '\\u' + str.charCodeAt(0).toString(16).toUpperCase();
      }).join('');

    if (options.namemap) {
      var unicode = glyph.metadata.unicode.join('');
      glyphName = options.namemap[unicode];
    }

    if (!glyphName) {
      console.log('Missing glyph name for unicode', readableHex);
      continue;
    }

    var glyphPath = path.join(destPath, glyphName + '.svg');
    console.log('Saving glyph "' + glyphName + '" to "' + glyphPath + '"');
    glyph.pipe(Fs.createWriteStream(glyphPath));
  }
});

