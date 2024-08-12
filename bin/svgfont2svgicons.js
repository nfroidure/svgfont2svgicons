#! /usr/bin/env node

import { SVGFont2SVGIconsStream } from '../dist/index.js';
import { createReadStream, createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { argv, exit } from 'node:process';
import program from 'commander';

program
  .version('2.0.0')
  .usage('[options] <font file> <destination path>')
  .option('--namemap <json file>', 'get unicode to name map from json file', '')
  .parse(argv);

if (program.args.length < 2) {
  console.log('Usage: node svgfont2svgicons', program.usage());
  exit(1);
}

const srcFile = program.args[0],
  destPath = program.args[1],
  options = {};

if (program.namemap)
  options.nameMap = JSON.parse(await readFile(program.namemap));

const fontStream = createReadStream(srcFile);
const iconProvider = new SVGFont2SVGIconsStream(options);

fontStream.pipe(iconProvider);

iconProvider.on('readable', function () {
  let glyph;
  while ((glyph = iconProvider.read()) !== null) {
    const glyphName = glyph.metadata.name;
    const glyphPath = join(destPath, glyphName + '.svg');

    console.log('Saving glyph "' + glyphName + '" to "' + glyphPath + '"');
    glyph.pipe(createWriteStream(glyphPath));
  }
});

