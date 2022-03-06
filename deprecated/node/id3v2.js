const {Byte, BytesStream} = require('./binary-operate/bytes.js');
const {UTF16Buffer, UTF8Buffer} = require('./binary-operate/string_decode.js');

const createTagHeader = stream => {
      let obj = stream.template([3, 1, 1, 1, 4], 'tag', 'ver', 'rev', 'flag', 'size');
      let TAG = obj.tag.toASCIIString(),
      __ver = obj.ver.toIntNumber(),
      __rev = obj.rev.toIntNumber(),
      flag = obj.flag,
      size = obj.size;

      //if is ID3
      if (TAG !== 'ID3') return null;

      //flag
      let Unsynchronisation = !!flag[0].bitAt(0),
      Extendedheader = !!flag[0].bitAt(1),
      Experimemtalindicator = !!flag[0].bitAt(2);

      //size
      size = (size[0].toInt8Number() << 21
                | size[1].toInt8Number() << 14
                | size[2].toInt8Number() << 7
                | size[3].toInt8Number());

      return {
            ver: '3.' + __ver + '.' + __rev,
            Unsynchronisation,
            Extendedheader,
            Experimemtalindicator,
            size
      }
}

const createExtendedHeader = stream => {
      let header = stream.template([4, 2, 4], 'size', 'flags', 'paddingSize'),
      hs = header.size.toIntNumber(32),
      ps = header.paddingSize.toIntNumber(32),
      CRCValid = !!header.flags[0].bitAt(0);
      return {
            size: hs,
            CRCValid,
            paddingSize: ps,
      }
}

const createFrameHeader = stream => {
      let header = stream.template([4, 4, 2], 'id', 'size', 'flags'),
      frameID = header.id.toASCIIString(),
      size = header.size.toIntNumber(32),
      flags = header.flags;

      //flags
      let TagAlterPreservation = !!flags[0].bitAt(0),
      FileAlterPreservation = !!flags[0].bitAt(1),
      ReadOnly = !!flags[0].bitAt(2),
      Compression = !!flags[1].bitAt(0),
      Encryption = !!flags[1].bitAt(1),
      GroupingIdentity = !!flags[1].bitAt(2);

      return {
            frameID, size, flags:{
                  TagAlterPreservation,
                  FileAlterPreservation,ReadOnly,
                  Compression,Encryption,
                  GroupingIdentity, raw: flags
            }
      }
}

const contentParser = (stream, parser, encoding) => {
      return parser(stream, encoding);
}

/**
 * @callback parser
 * @param {BytesStream} stream
 * @param {number} encoding
 * @returns
 */

const decoder = {
      0: (data) => {
            return data.reduce((pre,cur) => pre + new Byte(cur).toASCIIChar(), '');
      },
      1: (data) => {
            let utf16buffer = new UTF16Buffer(...data.reduce((pre,cur) => [...pre, new Byte(cur)], []));
            return utf16buffer.getUTF16String('LE');
      },
      2: (data) => {
            let utf16buffer = new UTF16Buffer(...data.reduce((pre,cur) => [...pre, new Byte(cur)], []));
            return utf16buffer.getUTF16String('RE');
      },
      3: (data) => {
            let utf8buffer = new UTF8Buffer(...data.reduce((pre,cur) => [...pre, new Byte(cur)], []));
            return utf8buffer.getUTF8String();
      },
}

const parsers = {

      /**
       * @type {parser}
       */
       USLT: function (data, encoding) {
            let start = data.indexOf(255);
            data.splice(0, start);
            let text = decoder[encoding](data);
            data = text.split('\n');
            data.forEach((el, i, arr) => {
                  let regArr = /\[(.+)\](.+)/g.exec(el);
                  if(regArr && regArr.length == 2) arr[i] = {time: regArr[1], text: regArr[2]};
            });
            return {text, data};
      },

      APIC: function (data) {//255, 216
            let start = 0,
            info = '',
            type = 0;

            //parse img
            for (let i = 0; i < data.length; i++) {
                  const el = data[i];

                  //jpeg
                  if(el == 255 && data[i+1] == 216) {
                        start = i;
                        break;
                  };

                  //gif
                  if(el == 71 && data[i+1] == 73 && data[i+2] == 70) {
                        start = i;
                        type = 1;
                        break;
                  };

                  //png
                  if(el == 137 && data[i+1] == 80 && data[i+2] == 78) {
                        start = i;
                        type = 2;
                        break;
                  };
            }
            data.splice(0, start).forEach(el => info += String.fromCharCode(el));
            let mime = info.slice(0, info.indexOf('\u0000'));
            return {
                  __mime: type,
                  mime, 
                  buffer: data, 
            };
      },

}

/**
 * 
 * @param {*} header 
 * @param {BytesStream} stream 
 * @returns 
 */
const createFrameContent = (header, stream) => {
      let __encoding = new Byte(stream.splice(0, 1)[0]).toInt8Number(),
      encoding = __encoding == 0 ? 'ISO-8859-1' :
            __encoding == 1? 'UTF-16LE' :
                  __encoding == 2? 'UTF-16BE': 
                        __encoding == 3? 'UTF-8' : 'Unknown';
      
      let buffer = stream.splice(0, header.size - 1),
      content = contentParser(buffer, parsers[header.frameID] || decoder[__encoding], __encoding);

      return {encoding, content, __encoding}
}

const createFrame = stream => {
      let header = createFrameHeader(stream),
      content = createFrameContent(header, stream);
      return Object.assign({header}, content);
}

function getID3v2Tag(arrayBuffer) {
      let buffer = new BytesStream(), tag = {frames:{}};
      new Uint8Array(arrayBuffer).forEach(el => buffer.push(el));

      //create a tag header
      tag.header = createTagHeader(buffer);
      buffer = buffer.splice(0, tag.header.size - 10);

      //extended header
      if (tag.header.Extendedheader) {
            tag.ExtendedHeader = createExtendedHeader(buffer);
            let paddingSize = tag.ExtendedHeader.paddingSize;
            tag.padding = buffer.splice( -paddingSize, paddingSize);
      }

      //frames
      const buildFrames = () => {
            let frame = createFrame(buffer);
            if (frame.header.frameID === '\u0000\u0000\u0000\u0000' || frame.header.frameID === undefined) return;
            tag.frames[frame.header.frameID] = frame;
      }

      while(buffer.length > 11){
            buildFrames();
      }

      const val = (attr) => tag.frames[attr] && tag.frames[attr].content;

      return Object.assign(tag, {
            Album: val('TALB'),
            Title: val('TIT2'),
            Performers: val('TPE1'),
            TrackNumber: val('TRCK'),
            ToolForEncoding: val('TSSE'),
            Year: val('TYER'),
            Lyrics: val('USLT'),
            Picture: val('APIC'),
      });;
}

module.exports = getID3v2Tag;