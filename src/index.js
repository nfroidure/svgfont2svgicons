/*
 * svgfont2svgicons
 * https://github.com/nfroidure/svgfont2svgicons
 *
 * Copyright (c) 2013 Nicolas Froidure
 * Licensed under the MIT license.
 */
"use strict";

// Required modules
var Path = require("path");
var util = require("util");
var Stream = require("readable-stream");
var Sax = require("sax");
var SVGPathData = require("svg-pathdata");
var Plexer = require('plexer');
var StreamQueue = require('streamqueue');

// Inherit of stream duplexer
util.inherits(SVGFont2SVGIcons, Plexer);

// Constructor
function SVGFont2SVGIcons(options) {
  var inputStream = null;
  var outputStream = null;
  var saxStream = null;
  var pathParser = null;
  var startContent = null;
  var endContent = null;
  var ascent = 0;
  var descent = 0;
  var horizontalAdv = 0;
  var glyphCount = 0;
  var d = '';
  options = options || {};

  // Ensure new were used
  if(!(this instanceof SVGFont2SVGIcons)) {
    return new SVGFont2SVGIcons(options);
  }

  // Initialize streams
  inputStream = new Stream.PassThrough()
  outputStream = new Stream.PassThrough({objectMode: true})
  saxStream = Sax.createStream(true)

  // Parent constructor
  Plexer.call(this, {
    objectMode: true
  }, inputStream, outputStream);

  // Setting objectMode separately
  this._writableState.objectMode = false;
  this._readableState.objectMode = true;

  // Listening to new tags
  saxStream.on('opentag', function(tag) {
    var stream = null;
    // Save the default sizes
    if('font' === tag.name) {
      if('horiz-adv-x' in tag.attributes) {
        horizontalAdv = parseFloat(tag.attributes['horiz-adv-x'], 10);
      }
    }
    if('font-face' === tag.name) {
      if('ascent' in tag.attributes) {
        ascent = parseFloat(tag.attributes.ascent, 10);
      }
      if('descent' in tag.attributes) {
        descent = parseFloat(tag.attributes.descent, 10);
      }
    }
    // Detect glyphs
    if('glyph' === tag.name) {
      // Fill the glyph object
      var stream = new StreamQueue();
      stream.metadata = {
        name: '',
        codepoint: '',
        width: horizontalAdv,
        height: Math.abs(descent) + ascent
      };
      if('glyph-name' in tag.attributes) {
        stream.metadata.name = tag.attributes['glyph-name'];
      } else {
        stream.metadata.name = 'icon' + (++glyphCount);
      }
      if('horiz-adv-x' in tag.attributes) {
        stream.metadata.width = tag.attributes['horiz-adv-x'];
      }
      if('unicode' in tag.attributes) {
        stream.metadata.unicode = [tag.attributes.unicode];
        if(options.nameMap && tag.attributes.unicode in options.nameMap) {
          stream.metadata.name = options.nameMap[tag.attributes.unicode];
        }
      }
      d = '';
      if('d' in tag.attributes) {
        d = tag.attributes.d;
      }
      outputStream.write(stream);
      startContent = new Stream.PassThrough();
      stream.queue(startContent);
      startContent.write('<?xml version="1.0" encoding="UTF-8" standalone="no"?>\
<svg\
   xmlns:svg="http://www.w3.org/2000/svg"\
   xmlns="http://www.w3.org/2000/svg"\
   version="1.1"\
   width="' + stream.metadata.width + '"\
   height="' + stream.metadata.height + '"\
   viewBox="0 0 ' + stream.metadata.width + ' ' + stream.metadata.height + '">\
  <path\
     d="');
      startContent.end();
      // Transform the glyph content
      if(d) {
        pathParser = new SVGPathData.Parser();
        stream.queue(
          pathParser.pipe(new SVGPathData.Transformer(
            SVGPathData.Transformer.Y_AXIS_SIMETRY, stream.metadata.height
          )).pipe(new SVGPathData.Transformer(
            SVGPathData.Transformer.TRANSLATE, 0, descent
          )).pipe(new SVGPathData.Encoder())
        );
        pathParser.write(d);
        pathParser.end();
      }
      endContent = new Stream.PassThrough()
      stream.queue(endContent);
      endContent.write('"\
     id="' + stream.metadata.name + '" />\
</svg>');
      endContent.end();
      stream.done();
    }
  });

  inputStream.pipe(saxStream);
  saxStream.once('end', function() {
    outputStream.end();
  });
}

module.exports = SVGFont2SVGIcons;
