const [symLE, symBE] = [Symbol('LE'), Symbol('BE')];

class Byte {
      /**
       * @private
       * @type {Array<number>}
       */
      byteData = null;

      /**
       * @param {string|number|number[]} bit8data 
       */
      constructor (bit8data) {
            this.byteData = Array.isArray(bit8data) && this.bitArrayConstructor(bit8data)
            || typeof bit8data === 'number' && this.int8Constructor(bit8data)
            || typeof bit8data === 'string' && this.asciiConstructor(bit8data);
            if (!this.byteData) throw Error('Illegal param: ' + bit8data);
      }

      /**
       * @private
       */
      bitArrayConstructor(bit8data){
            if (bit8data.length !== 8) return null;
            bit8data.forEach(el => {
                  if (el > 1 || el < 0) return null;
            });
            return bit8data;
      }

      /**
       * @private
       */
      int8Constructor(bit8data){
            let binstr = bit8data.toString(2);
            let needToAdd = 8 - binstr.length;
            for (let i = 0; i < needToAdd; i++) binstr = '0' + binstr;
            return binstr.split('').reduce((pre, cur) => [...pre, parseInt(cur)], []);
      }

      /**
       * @private
       */
      asciiConstructor(bit8data){
            return this.int8Constructor(bit8data.charCodeAt(0));
      }

      toBinStr(){
            return this.byteData.join('');
      }

      toInt8Number(){
            return parseInt(this.toBinStr(), 2);
      }

      toASCIIChar(){
            return String.fromCharCode(this.toInt8Number());
      }

      bitAt(index){
            if (index < 0 || index > 8) return null;
            return this.byteData[index];
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
            let needToConvert = this.slice(0, bit/8).reduce((pre, cur) => pre = pre + cur.toBinStr(), '');

            //int
            if (!type) {
                  //unsigned
                  if (!signed) return parseInt(needToConvert, 2);

                  //signed
                  let us = parseInt(needToConvert, 2);
                  let mp = 2 ** (bit - 1);
                  if (us <= mp) return us;
                  if (us > mp) return us - mp *2;
            }

            //float
            if (bit < 32) return NaN;
            return parseFloat(needToConvert);
      }

      toIntNumber(bit=8,signed=false){
            return this.toNumber(0, bit, signed);
      }

      toFloatNumber(bit=32,signed=false){
            if (bit < 32) return NaN;
            return this.toNumber(1, bit, signed);
      }

      /**
       * @returns 
       */
      toUTF16Char(){
            if (this.length < 2) return '';
            let binArr = this.slice(0, 2);
            let binCode = binArr.reduce((pre, cur) => pre = pre + cur.toBinStr(), '');
            if (binCode == '1111111011111111') return symLE;
            if (binCode == '1111111111111110') return symBE;
            return String.fromCharCode(parseInt(binCode,2));
      }

      UTF8length(){

            //null
            if (!this[0]) return 0;

            //ANSCII
            if (this[0].byteData[0] === 0) return 1;

            //length > 1
            let charByte = [this[0].byteData, this[1].byteData];

            //length = 2
            if (charByte[0].slice(0, 3).join('') === '110' && charByte[1].slice(0, 2).join('') === '10') return 2;

            //length = 3
            charByte.push(this[3]);
            if (charByte[0].slice(0, 4).join('') === '1110' && charByte[1].slice(0, 3).join('') === '110' && charByte[2].slice(0, 3).join('') === '10') return 3;

            //not a utf-8 char
            return 0;

      }

      toUTF8Char(){
            let len = this.UTF8length();
            if (!len) return Symbol('not utf-8');

            //length = 1
            if (len === 1) return this[0].toASCIIChar();

            //length = 2
            if (len === 2) return String.fromCharCode(parseInt([
                  this[0].byteData.slice(3, 5), 
                  this[1].byteData.slice(2, 6)
            ].flat().join(''), 2));

            //length = 3
            return String.fromCharCode(parseInt([
                  this[0].byteData.slice(4, 4), 
                  this[1].byteData.slice(3, 5),
                  this[2].byteData.slice(2, 6)
            ].flat().join(''), 2));
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
            for (let i = 0; i < attrNames.length; i++) {
                  let count = bitsLenArr[i];
                  let bytes = new Bytes();
                  for (let i = 0; i < count; i++) {
                        let data = this.shift();
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
            for (let i = 0; i < lengthAll/lengthEach; i++) {
                  let by = new Bytes();
                  for (let i = 0; i < lengthEach; i++) {
                        by.push(new Byte(this.shift()));
                  }
                  res.push(by);
            }
            return res;
      }

}

module.exports = {Byte, Bytes, BytesStream, symBE, symLE};