import { describe, test, expect } from '@jest/globals';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { join } from 'node:path';
import { type IconMetadata, SVGFont2SVGIconsStream } from './index.js';
import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';
import StreamTest from 'streamtest';

describe('Parsing fonts', () => {
  test('should work for simple SVG fonts', async () => {
    const [stream, result] = StreamTest.toObjects<
      Readable & { metadata: IconMetadata }
    >();

    createReadStream(join('fixtures', 'assets', 'cleanicons.svg'))
      .pipe(new SVGFont2SVGIconsStream())
      .pipe(stream);

    const icons = await result;

    expect(icons.length).toEqual(10);

    for (const icon of icons) {
      const [stream, result] = StreamTest.toChunks();

      icon.pipe(stream);

      expect(Buffer.concat(await result).toString('utf8')).toEqual(
        await readFile(
          join(
            'fixtures',
            'expected',
            'cleanicons',
            icon.metadata.name + '.svg',
          ),
          'utf8',
        ),
      );
    }
  });

  test('should be reentrant with svgicons2svgfont', async () => {
    const [stream, result] = StreamTest.toChunks();

    createReadStream(join('fixtures', 'assets', 'cleanicons2.svg'))
      .pipe(new SVGFont2SVGIconsStream())
      .pipe(
        new SVGIcons2SVGFontStream({
          fontName: 'Plop',
        }),
      )
      .pipe(stream);

    expect(Buffer.concat(await result).toString('utf8')).toEqual(
      await readFile(join('fixtures', 'assets', 'cleanicons2.svg'), 'utf8'),
    );
  });

  test('should support names mapping', async () => {
    const [stream, result] = StreamTest.toObjects<
      Readable & { metadata: IconMetadata }
    >();

    createReadStream(join('fixtures', 'assets', 'cleaniconsWithoutNames.svg'))
      .pipe(
        new SVGFont2SVGIconsStream({
          nameMap: JSON.parse(
            (
              await readFile(
                join('fixtures', 'assets', 'cleaniconsNameMap.json'),
              )
            ).toString(),
          ),
        }),
      )
      .pipe(stream);

    const icons = await result;

    expect(icons.length).toEqual(10);

    for (const icon of icons) {
      const [stream, result] = StreamTest.toChunks();

      icon.pipe(stream);

      expect(icon.metadata.name).not.toMatch(/icon\d+/);

      expect(Buffer.concat(await result).toString('utf8')).toEqual(
        await readFile(
          join(
            'fixtures',
            'expected',
            'cleanicons',
            icon.metadata.name + '.svg',
          ),
          'utf8',
        ),
      );
    }
  });
});
