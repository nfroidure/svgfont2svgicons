import { Transform, PassThrough, type TransformOptions } from 'node:stream';
import Sax from 'sax';
import { SVGPathData } from 'svg-pathdata';
import { StreamQueue } from 'streamqueue';

export type SVGFont2SVGIconsOptions = {
  nameMap: Record<string, string>;
};
export type IconMetadata = {
  name: string;
  codepoint: string;
  width: number;
  height: number;
  unicode: string[];
};

export class SVGFont2SVGIconsStream extends Transform {
  _options: SVGFont2SVGIconsOptions;
  _saxStream: Sax.SAXStream;
  _ascent = 0;
  _descent = 0;
  _horizontalAdv = 0;
  _glyphCount = 0;

  constructor(
    options: Partial<SVGFont2SVGIconsOptions> &
      Omit<TransformOptions, 'writableObjectMode' | 'readableObjectMode'> = {},
  ) {
    super({ ...options, writableObjectMode: false, readableObjectMode: true });

    this._options = {
      nameMap: {},
      ...options,
    };

    this._saxStream = Sax.createStream(true);
    this._saxStream.once('end', () => {
      this.push(null);
    });

    // Listening to new tags
    this._saxStream.on('opentag', (tag) => {
      // Save the default sizes
      if ('font' === tag.name) {
        if (
          'horiz-adv-x' in tag.attributes &&
          typeof tag.attributes['horiz-adv-x'] === 'string'
        ) {
          this._horizontalAdv = parseFloat(tag.attributes['horiz-adv-x']);
        }
      }
      if ('font-face' === tag.name) {
        if (
          'ascent' in tag.attributes &&
          typeof tag.attributes.ascent === 'string'
        ) {
          this._ascent = parseFloat(tag.attributes.ascent);
        }
        if (
          'descent' in tag.attributes &&
          typeof tag.attributes.descent === 'string'
        ) {
          this._descent = parseFloat(tag.attributes.descent);
        }
      }
      // Detect glyphs
      if ('glyph' === tag.name) {
        // Fill the glyph object
        const iconStream = new StreamQueue() as StreamQueue & {
          metadata: IconMetadata;
        };

        iconStream.metadata = {
          name: '',
          codepoint: '',
          width: this._horizontalAdv,
          height: Math.abs(this._descent) + this._ascent,
          unicode: [],
        };

        if (
          'glyph-name' in tag.attributes &&
          typeof tag.attributes['glyph-name'] === 'string'
        ) {
          iconStream.metadata.name = tag.attributes['glyph-name'];
        } else {
          iconStream.metadata.name = 'icon' + ++this._glyphCount;
        }
        if (
          'horiz-adv-x' in tag.attributes &&
          typeof tag.attributes['horiz-adv-x'] === 'string'
        ) {
          iconStream.metadata.width = parseFloat(tag.attributes['horiz-adv-x']);
        }
        if (
          'unicode' in tag.attributes &&
          typeof tag.attributes.unicode === 'string'
        ) {
          iconStream.metadata.unicode = [tag.attributes.unicode];
          if (
            this._options.nameMap &&
            tag.attributes.unicode in this._options.nameMap
          ) {
            iconStream.metadata.name =
              this._options.nameMap[tag.attributes.unicode];
          }
        }

        const startContent = new PassThrough();

        iconStream.queue(startContent);
        startContent.write(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns:svg="http://www.w3.org/2000/svg"
    xmlns="http://www.w3.org/2000/svg" version="1.1" width="${iconStream.metadata.width}" height="${iconStream.metadata.height}" viewBox="0 0 ${iconStream.metadata.width} ${iconStream.metadata.height}">
    <path
        d="`);
        startContent.end();
        // Transform the glyph content
        if ('d' in tag.attributes && typeof tag.attributes.d === 'string') {
          let pathData = new SVGPathData(tag.attributes.d);

          pathData = pathData.ySymmetry(iconStream.metadata.height);
          pathData = pathData.translate(0, this._descent);

          const pathDataStream = new PassThrough();

          iconStream.queue(pathDataStream);

          pathDataStream.write(pathData.encode());
          pathDataStream.end();
        }
        const endContent = new PassThrough();
        iconStream.queue(endContent);
        endContent.write(
          `"
        id="${iconStream.metadata.name}" />
</svg>`,
        );
        endContent.end();
        iconStream.done();
        this.push(iconStream);
      }
    });
  }
  _transform(chunk, encoding, cb) {
    this._saxStream.write(chunk, encoding);
    cb();
  }
  _flush(cb) {
    this._saxStream.end();
    cb();
  }
}
