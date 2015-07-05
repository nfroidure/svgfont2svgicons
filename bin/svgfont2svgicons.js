#! /usr/bin/env node

var svgfont2svgicons = require(__dirname + '/../src/index.js'),
  Fs = require('fs'),
  path = require('path'),
  program = require('commander');

program
  .version('2.0.0')
  .usage('[options] <font file> <destination path>')
  .option('--namemap <json file>', 'get unicode to name map from json file', '')
  .parse(process.argv);

if (program.args.length < 2) {
  console.log('Usage: node svgfont2svgicons', program.usage());
  process.exit(1);
}

var srcFile = program.args[0],
  destPath = program.args[1],
  options = {};

if (program.namemap)
  options.nameMap = JSON.parse(Fs.readFileSync(program.namemap));

var fontStream = Fs.createReadStream(srcFile);
var iconProvider = svgfont2svgicons(options);

fontStream.pipe(iconProvider);

iconProvider.on('readable', function() {
  var glyph;
  while((glyph = iconProvider.read()) !== null) {
    var glyphName = glyph.metadata.name,
      readableHex = glyph.metadata.unicode.map(function(str) {
        return '\\u' + str.charCodeAt(0).toString(16).toUpperCase();
      }).join('');

    var glyphPath = path.join(destPath, glyphName + '.svg');
    console.log('Saving glyph "' + glyphName + '" to "' + glyphPath + '"');
    glyph.pipe(Fs.createWriteStream(glyphPath));
  }
});

