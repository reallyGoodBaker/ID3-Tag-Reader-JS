const {Bytes, Byte, symLE, symBE} = require('./bytes.js');

class StringBuffer {

      /**
       * @type {Byte[]}
       */
      buffer = null;
      pointer = -1;
      /**
       * @param  {...Byte} bytes
       */
      constructor (...bytes) {
            if (Array.isArray(bytes[0])) this.buffer = bytes[0];
            else this.buffer = bytes;
            this.pointer = 0;
      }

      /**
       * @param {number} len byte length you want to get
       */
      readBytes(len){
            if (this.pointer === -1) throw Error('uninitialized buffer');
            let start = this.pointer;
            return new Bytes(...this.buffer.slice(start, start + len));
      }

      getBytes(len){
            let res = this.readBytes(len);
            this.pointer += len;
            return res;
      }

      setptr(index){
            if (index < 0 || index > this.buffer.length -1) return ;
            this.pointer = index;
      }

      reset(){
            this.setptr(0);
      }

}

class UTF16Buffer extends StringBuffer {

      /**
       * @param  {...Byte} bytes 
       */
      constructor(...bytes){
            super(...bytes);
      }

      LEEncoding = false;

      getOneUTF16Cell(){
            return super.getBytes(2);
      }

      /**
       * @param {string} type only 'LE' or 'BE', if not, the type will be inferred by first two characters
       * @returns 
       */
      setUTF16Type(type){
            if (type === 'BE') return this.pointer += 2, this.LEEncoding = false;
            if (type === 'LE') return this.pointer += 2, this.LEEncoding = true;
            let tag = this.readBytes(2);
            this.LEEncoding = tag.toUTF16Char() === symLE;
            this.pointer += 2;
      }

      getOneUTF16Char(){
            let char = this.getOneUTF16Cell();
            if (this.LEEncoding) char.reverse();
            char = char.toUTF16Char();
            if (char == symBE || char == symLE) return '';
            return char;
      }

      hasNext(){
            return this.buffer.length > this.pointer - 2;
      }

      getUTF16String(type){
            this.setUTF16Type(type);
            let str = '';
            while (this.hasNext()) {
                  let char = this.getOneUTF16Char();
                  str += char;
            }
            return str;
      }

}

class UTF8Buffer extends StringBuffer {

      constructor(...bytes){
            super(...bytes);
      }

      nextUTF8CharCell(){
            if (this.buffer.length < 3) return null;
            let preload = this.readBytes(3);
            return preload.UTF8length();
      }

      readOneUTF8Char(){
            if (!this.nextUTF8CharCell()) return null;
            return this.getBytes(this.nextUTF8CharCell());
      }

      getUTF8String(){
            let res = '',
            char = null;
            while (char = this.readOneUTF8Char()) res += char.toUTF8Char();
            return res;
      }

}

module.exports = {
      UTF16Buffer, UTF8Buffer
}