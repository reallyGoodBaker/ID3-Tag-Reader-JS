class TagHeader {
      __ver = '';
      __rev = '';
      version = '';
      flag = '';
      size = 0;
}

class FrameHeader {
      frameID = '';
      size = 0;
      flags = '';
      flag1 = null;
      flag2 = null;
}

class TagFrame {
      header = null;
      content = null;
}

class ExtendedHeader {
      size = null;
      flags = null;
      sizeOfPadding = null
}

class Tag {
      header = null;
      extendedHeader = null;
      frames = {};
      padding = null;
}


class Reader {
      /**
       * @private
       */
      pointer = -1;
      constructor(buffer){
            this.load(buffer);
      }
      /**
       * 将一段buffer装入reader
       * @privtae
       * @param {Uint8Array} buffer 
       */
      load(buffer){
            this.data = buffer;
            this.pointer = 0;
            this.init();
      }
      /**
       * 初始化接口
       */
      init(){

      }
      /**
       * 读取接口
       */
      read(){}
      /**
       * 读取特定位置元素
       */
      readAt(){}
      reset(){
            this.pointer = 0;
      }
      toArrayBuffer(){
            return new Uint8Array(this.data).buffer;
      }
}

class BufferReader extends Reader {
      /**
       * @param {number} length 
       * @returns {ByteReader|ByteReader[]}
       */
      read(length = 1){
            if (this.pointer == -1) return false;
            let res = [];
            for (let i = 0; i < length; i++) {
                  res.push(new ByteReader(this.data[this.pointer++]));
            }
            return res.length == 1 ? res[0]: res;
      }

      readAt(index, length = 1){
            this.pointer = index < 0? -1: 
                  index >= this.data.length? -1: index;
            this.read(length);
      }
}

class ByteReader extends Reader {

      init(){
            let hexStr = this.data.toString(2), _i = 8 - hexStr.length;
            for (let i = 0; i < _i; i++) {
                  hexStr = '0' + hexStr;
            }
            hexStr = hexStr.split('');
            hexStr.forEach((num, i, arr) => arr[i] = parseInt(num));
            this.data = hexStr;
      }

      read(length = 1){
            if (this.pointer == -1) return false;
            let res = [];
            for (let i = 0; i < length; i++) {
                  res.push(this.data[this.pointer++]);
            }
            return res.length == 1 ? res[0]: res;
      }

      readAt(index, length = 1){
            this.pointer = index < 0? -1: 
                  index >= this.data.length? -1: index;
            this.read(length);
      }

      toNumber(){
            return parseInt(this.data.join(''), 2);
      }

      toChar(){
            return String.fromCharCode(this.toNumber());
      }

      toHexString(){
            return this.data.join('');
      }

}

/**
 * 初始化Tag
 * @param {ArrayBuffer} arrayBuffer 
 */
function getRawId3v2Tag (arrayBuffer) {
      //生成标签头
      let buffer = new BufferReader([...new Uint8Array(arrayBuffer)]);
      let headerData = buffer.read(10);
      let tag = new Tag();
      tag.header = createTagHeader(headerData);

      //截取标签
      /**
       * @type {ByteReader[]}
       */
      buffer = buffer.read(tag.header.size - 10);

      //选择性跳过拓展头
      if (tag.header.Extendedheader) {
            tag.extendedHeader = new ExtendedHeader();
            let size = buffer.read(4);
            
      } ;

      //读取帧
      while (buffer.length > 0) {
            let frame = createFrame(buffer);
            if (frame.header.frameID === '\u0000\u0000\u0000\u0000' || frame.header.frameID == undefined) continue;
            tag.frames[frame.header.frameID] = frame;
      }

      return tag;
}

/**
 * @param {ByteReader[]} headerData 
 */
function createTagHeader (headerData) {
      let tagHeader = new TagHeader();
      let tag = '';
      let TAG = headerData.splice(0, 3);
      TAG.forEach(el => tag += el.toChar());
      if (tag !== 'ID3') throw Error(`not ID3v2 tag, type: ${tag}`);

      //计算版本号
      let _ver = tagHeader.__ver = headerData.splice(0, 1)[0].toNumber();
      let _rev = tagHeader.__rev =  headerData.splice(0, 1)[0].toNumber();
      tagHeader.version = _ver + '.' + _rev;

      //flag相关
      let _flag = headerData.splice(0, 1)[0];
      const [Unsynchronisation, Extendedheader, Experimemtalindicator] = _flag.data;
      tagHeader.Unsynchronisation = !!Unsynchronisation;
      tagHeader.Experimemtalindicator = !!Experimemtalindicator;
      tagHeader.Extendedheader = !!Extendedheader;
      tagHeader.flag = _flag.toHexString();

      //size
      tagHeader.size = (headerData[0].toNumber() << 21
                | headerData[1].toNumber() << 14
                | headerData[2].toNumber() << 7
                | headerData[3].toNumber());


      return tagHeader
}

/**
 * @param {ByteReader[]} headerData 
 */
function createFrameHeader (headerData) {
      let frameHeader = new FrameHeader();
      let frameID = headerData.splice(0, 4), size = headerData.splice(0, 4), flags = headerData.splice(0, 2);

      //frameID
      frameID.forEach((el, i, arr) => arr[i] = el.toChar());
      frameID = frameID.join('');

      //size
      if (size.length < 4) return false;
      size = (size[0].toNumber() << 24
                | size[1].toNumber() << 16
                | size[2].toNumber() << 8
                | size[3].toNumber());

      //flags
      let [flag1, flag2] = flags;
      flags.forEach((el, i, arr) => arr[i] = el.toHexString());

      frameHeader = {
            flag1,
            flag2,
            flags,
            frameID,
            size
      }

      return frameHeader;
}

/**
 * @param {ByteReader[]} content 
 */
function createFrameContent (content) {
      //encoding
      if (content.length < 1) return false;
      let __encoding = content.splice(0, 1)[0].toNumber(), encoding;
      switch (__encoding) {
            case 0:
                  encoding = 'ISO-8859-1';
            break;
            case 1:
                  encoding = 'UTF-16LE';
            break;
            case 2:
                  encoding = 'UTF-16BE';
            break;
            case 3:
                  encoding = 'UTF-8';
            break;
      }

      //content
      content.forEach((el, i, arr) => arr[i] = el.toNumber());
      //content.splice(0, 2);

      return {encoding, __encoding, data: content}
}

/**
 * @param {ByteReader[]} frame 
 */
function createFrame (frame) {
      let tagFrame = new TagFrame();
      tagFrame.header = createFrameHeader(frame.splice(0, 10));
      tagFrame.content = createFrameContent(frame.splice(0, tagFrame.header.size));
      return tagFrame;
}

const {Byte} = require('./binary-operate/bytes.js');
const {UTF16Buffer, UTF8Buffer} = require('./binary-operate/string_decode.js');

const parsers = {
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
      USLT: function (data, encoding) {
            let start = data.indexOf(255);
            data.splice(0, start);
            let text = this[encoding](data);
            data = text.split('\n');
            data.forEach((el, i, arr) => {
                  let regArr = /\[(.+)\](.+)/g.exec(el);
                  if(regArr && regArr.length == 2) arr[i] = {time: regArr[1], text: regArr[2]};
            });
            return {text, data};
      },
      APIC: function (data, encoding) {//255, 216
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
            for (let i = 0; i < data.length; i++) blob += String.fromCharCode(data[i]);
            let mime = info.slice(0, info.indexOf('\u0000'));
            return {
                  __mime: type,
                  mime, 
                  buffer: data
            };
      },
}

function parse(tag){
      for (const key in tag.frames) {
            let encoding = tag.frames[key].content.__encoding;
            if (parsers[key]) tag.frames[key].content.data = parsers[key](tag.frames[key].content.data, encoding);
            else if (parsers[encoding]) tag.frames[key].content.data = parsers[encoding](tag.frames[key].content.data);
      }
      const val = (attrName) => tag.frames[attrName] && tag.frames[attrName].content.data
      return {
            header: tag.header,
            Album: val('TALB'),
            Title: val('TIT2'),
            Performers: val('TPE1'),
            TrackNumber: val('TRCK'),
            'Tool for encoding': val('TSSE'),
            Year: val('TYER'),
            Lyrics: val('USLT'),
            Picture: val('APIC'),
      };
}

function getID3v2Tag (arrayBuffer){
      return parse(getRawId3v2Tag(arrayBuffer));
}

module.exports = getID3v2Tag;