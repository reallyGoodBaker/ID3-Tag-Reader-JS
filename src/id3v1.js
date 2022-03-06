import {types, Struct} from './bytes.js'

// 不需要花多少时间，所以不异步也没关系
/**
 * @param {ArrayBuffer} arrayBuffer 
 */
export function getID3v1Tag(arrayBuffer) {
    let dataView = new DataView(arrayBuffer.slice(-128));
    let struct = Struct.from(id3v1Tag);
    struct.arrayDecorator = arr => String.fromCodePoint(...arr).replace(/\u0000/g, '');
    let vals = struct.getValues(dataView);
    let [
        TAG, title, artist, album, year, comment, sign, track, genre
    ] = vals;
    if(!TAG) return null;
    return { title, artist, album, year, comment, track, genre }
}

var id3v1Tag = [
    [types.uchar, 3],//标记位
    [types.uchar, 30], //title
    [types.uchar, 30], // artist
    [types.uchar, 30], // album
    [types.uchar, 4], // year
    [types.uchar, 28], // comment
    [types.uchar, 1], // sign
    [types.uchar, 1], // track
    [types.uchar, 1] // genre
]

export default getID3v1Tag;