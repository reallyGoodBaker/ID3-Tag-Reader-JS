const getID3v1Tag = (arrayBuffer) => {
      let buffer = new Uint8Array(arrayBuffer);
      let tagBuffer = [...buffer].splice(-128, 128);
      let tag = {
            title: '',
            artist: '',
            album: '',
            year: '',
            comment: '',
            track: '',
            genreId: ''
      };

      //判断标记位
      if (String.fromCharCode(...tagBuffer.splice(0, 3)).replace(/\u0000/g, '') !== 'TAG') return null;

      //读取title
      tag.title = String.fromCharCode(...tagBuffer.splice(0, 30)).replace(/\u0000/g, '')

      //读取artist
      tag.artist = String.fromCharCode(...tagBuffer.splice(0, 30)).replace(/\u0000/g, '')

      //读取album
      tag.album = String.fromCharCode(...tagBuffer.splice(0, 30)).replace(/\u0000/g, '')

      //读取year
      tag.year = String.fromCharCode(...tagBuffer.splice(0, 4)).replace(/\u0000/g, '')

      //读取comment
      tag.comment = String.fromCharCode(...tagBuffer.splice(0, 28)).replace(/\u0000/g, '')

      //删除标记位
      tagBuffer.splice(0, 1);

      //读取track
      tag.track = tagBuffer.splice(0, 1)[0]

      //读取genre
      tag.genreId = tagBuffer.splice(0, 1)[0]

      return tag;
}

module.exports = getID3v1Tag;