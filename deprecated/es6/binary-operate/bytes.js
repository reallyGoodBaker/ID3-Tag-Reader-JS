const [symLE, symBE] = [Symbol('LE'), Symbol('BE')];

class Byte {

      static {
            this.b1 = 1;
            this.b2 = 2;
            this.b3 = 4;
            this.b4 = 8;
            this.b5 = 16;
            this.b6 = 32;
            this.b7 = 64;
            this.b8 = 128;
      }

      /**
       * @private
       * @type {number}
       */
      byteData = null;

      /**
       * @param {string|number|number[]} bit8data 
       */
      constructor (bit8data) {
            this.byteData = Array.isArray(bit8data) && this.bitArrayConstructor(bit8data)
            || typeof bit8data === 'number' && this.int8Constructor(bit8data)
            || typeof bit8data === 'string' && this.asciiConstructor(bit8data);
            if (this.byteData === null || this.byteData === undefined) throw Error('Illegal param: ' + bit8data);
      }

      /**
       * @private
       */
      bitArrayConstructor(bit8data){
            if (bit8data.length !== 8) return null;
            return parseInt(bit8data.join(''), 2);
      }

      /**
       * @private
       */
      int8Constructor(bit8data){
            return bit8data;
      }

      /**
       * @private
       */
      asciiConstructor(bit8data){
            return this.int8Constructor(bit8data.charCodeAt(0));
      }

      toBinStr(){
            return this.byteData.toString(2);
      }

      toInt8Number(){
            return this.byteData;
      }

      toASCIIChar(){
            return String.fromCharCode(this.byteData);
      }

      bitAt(index){
            let data = this.byteData;
            return !!((data << index) & Byte.b8);
      }

}

class Bytes extends Array {

      toBinStr(){
            return this.reduce((pre, cur) => pre + cur.toBinStr(), '');
      }

      /**
       * convert these bytes to a signed/unsigned int number
       * @param {number|boolean} type 0/false: int ,  1/true: float
       * @param {number} bit bit length you want to convert, only 8, 16, 32, 64
       * @param {boolean} signed convert to a unsigned integar
       */
      toNumber(type=0, bit=8, signed=false){
            if (bit != 8 && bit != 16 && bit != 32 && bit != 64) return NaN;
            const size = bit/8;
            

            //int
            if (!type) {

                  let needToConvert = this.slice(0, size).reduce((pre, cur) => [...pre, cur.toInt8Number()], []);

                  //unsigned
                  if (!signed) {
                        let res = 0;
                        for(let i = size; i--;) {
                              res <<= 8;
                              res += needToConvert[i];
                        }
                        return res
                  }

                  //signed
                  let us = 0;
                  for(let i = size; i--;) {
                        us <<= 8;
                        us += needToConvert[i];
                  }
                  let mp = 1 << (bit - 1);
                  if (us <= mp) return us;
                  if (us > mp) return us - mp *2;
            }

            //float
            // let needToConvert = this.slice(0, size);

            // if (size < 4) return NaN;
            // return parseFloat(needToConvert);
      }

      toIntNumber(bit=8,signed=false){
            return this.toNumber(0, bit, signed);
      }

      // toFloatNumber(bit=32,signed=false){
      //       if (bit < 32) return NaN;
      //       return this.toNumber(1, bit, signed);
      // }

      /**
       * @returns 
       */
      toUTF16Char(){
            if (this.length < 2) return '';
            let hexNum = this.toIntNumber(16, false);
            if (hexNum == 0xEF) return symLE;
            if (hexNum == 0xEF) return symBE;
            return String.fromCharCode(hexNum);
      }

      UTF8length(){

            //null
            if (!this[0]) return 0;

            let counter = -1;
            let byte = this[0];

            for(let i = 8; i--;) {
                  if(byte.bitAt(i)) counter++;
                  else break;
            }

            return counter;

      }

      toUTF8Char(){
            let len = this.UTF8length();
            let dataSlice = ~(Byte.b8 & Byte.b7);
            if (!len) return Symbol('not utf-8');

            //ASCII
            if (!~len) return this[0].toASCIIChar();

            //length > 1
            let charCode = 0;
            for(let i = 0; i<len; i++) {
                  if (i === 0) {
                        charCode += ((this[0].byteData << (len + 1)) & 255) << (7 * (len - 1) - 2); 
                        continue;
                  }
                  charCode += (this[i].byteData & dataSlice) << 8 * (len - 1);
            }
            return String.fromCharCode(charCode);
      }

      reverse(){
            return new Bytes(...super.reverse());
      }

      toASCIIString(){
            return this.reduce((pre, cur) => pre + cur.toASCIIChar(), '');
      }

}

class BytesStream extends Array {

      getBytes(num){
            return this.splice(0, num);
      }

      readBytes(num){
            return this.slice(0, num);
      }

      /**
       * @param {Array<number>} bitsLenArr 
       * @param  {...string} attrNames 
       * @returns
       */
      template(bitsLenArr, ...attrNames){
            if (bitsLenArr.length !== attrNames.length) throw Error('length of bitsArray should equals to the count of your attrNames'); 
            let obj = {};
            for (let i = 0, count, bytes; i < attrNames.length; i++) {
                  count = bitsLenArr[i];
                  bytes = new Bytes();
                  for (let i = 0, data; i < count; i++) {
                        data = this.shift();
                        bytes.push(new Byte(data));
                  }
                  obj[attrNames[i]] = bytes;
            }
            return obj;
      }

      toByteArray(num){
            num = num || this.length;
            return this.readBytes(num).reduce((pre, cur) => [...pre, new Byte(cur)], []);
      }

      toFormedBytes(lengthEach, lengthAll){
            if (!lengthEach) throw Error('Illegal param: '+lengthEach);
            lengthAll = lengthAll || Math.floor(this.length/lengthEach);
            if(lengthEach > lengthAll) throw Error('Illegal param: '+lengthEach);
            let res = [];
            for (let i = 0, by; i < lengthAll/lengthEach; i++) {
                  by = new Bytes();
                  for (let i = 0; i < lengthEach; i++) {
                        by.push(new Byte(this.shift()));
                  }
                  res.push(by);
            }
            return res;
      }

}

export  {Byte, Bytes, BytesStream, symBE, symLE};