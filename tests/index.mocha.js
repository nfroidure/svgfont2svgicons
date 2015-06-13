var assert = require('assert');
var svgfont2svgicons = require(__dirname + '/../src/index.js');
var Fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
var Path = require("path");

// Tests
describe('Parsing fonts', function() {

  it("should work for simple SVG fonts", function(done) {
    var fontStream = Fs.createReadStream(__dirname + '/fixtures/cleanicons.svg');
    var iconProvider = svgfont2svgicons();
    var icons = [];
    var bufferedIcons = 0;
    var ended = false;

    fontStream.pipe(iconProvider);

    iconProvider.on('readable', function() {
      var icon;
      var content = '';
      do {
        icon = iconProvider.read();
        if(icon) {
          icons.push(icons);
          icon.on('readable', (function(icon) {
            return function() {
              var chunk;
              do {
                chunk = icon.read();
                if(chunk) {
                  content += chunk.toString('utf-8');
                }
              } while(null !== chunk);
            };
          })(icon));
          icon.once('end', (function(icon) {
            return function() {
              assert.equal(
                Fs.readFileSync(__dirname + '/expected/cleanicons/' + icon.metadata.name + '.svg'),
                content
              );
              bufferedIcons++;
              if(ended && icons.length == bufferedIcons) {
                done();
              }
            };
          })(icon));
        }
      } while(null !== icon);
    }).once('end',function() {
      ended = true;
      if(icons.length == bufferedIcons) {
        done();
      }
    });

  });

});
