var assert = require('assert');
var svgfont2svgicons = require(__dirname + '/../src/index.js');
var Fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
var Path = require("path");
var streamtest = require('streamtest');

// Tests
describe('Parsing fonts', function() {

  streamtest.versions.forEach(function(version) {

    describe('for ' + version + ' streams', function() {

      it("should work for simple SVG fonts", function(done) {
        var bufferedIcons = 0;
        var ended = false;

        Fs.createReadStream(__dirname + '/fixtures/cleanicons.svg')
          .pipe(svgfont2svgicons())
          .pipe(streamtest[version].toObjects(function(err, icons) {
            if(err) {
              return done(err);
            }
            assert.equal(icons.length, 10);
            icons.forEach(function(icon, i) {
              icon.pipe(streamtest[version].toChunks(function(err, chunks) {
                assert.equal(
                  chunks.reduce(function(content, chunk) {
                    return content + chunk.toString('utf-8');
                  }, ''),
                  Fs.readFileSync(__dirname + '/expected/cleanicons/' + icon.metadata.name + '.svg')
                );
                bufferedIcons++;
                if(bufferedIcons == icons.length) {
                  done();
                }
              }));
            });
          }));
      });

      it("should be reentrant with svgicons2svgfont", function(done) {
        var svgicons2svgfont = require('svgicons2svgfont');

        Fs.createReadStream(__dirname + '/fixtures/cleanicons2.svg')
          .pipe(svgfont2svgicons())
          .pipe(svgicons2svgfont({
            fontName: 'Plop'
          }))
          .pipe(streamtest[version].toChunks(function(err, chunks) {
            assert.equal(
              chunks.reduce(function(content, chunk) {
                return content + chunk.toString('utf-8');
              }, ''),
              Fs.readFileSync(__dirname + '/fixtures/cleanicons2.svg')
            );
            done();
          }));
      });

    });

  });

});
