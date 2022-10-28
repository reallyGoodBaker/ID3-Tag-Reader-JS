import {types as t, Struct} from './bytes.js'
import {decode, utf16, utf8} from './string_decode.js'

let splicer = {
    index: 0,
    max: 1,
    data: [],
    splice(count) {
        let s = this.index;
        let e = s + count;
        this.index += count;
        return this.data.slice(s, e);
    },
    check() {
        return this.index < this.max
    }
}

const tagHeader = Struct.from([
    [t.uchar, 3], //ID3
    t.uchar, //ver
    t.uchar, //rev
    t.uchar, //flags
    [t.uchar, 4] //size
])

export function createTagHeader(arrayBuffer) {

    let [
        ID3, ver, rev, flags, size
    ] = tagHeader.getValues(new DataView(arrayBuffer));

    let unsync = !!(flags & 0x80);
    let exp = !!(flags & 0x40);
    let ext = !!(flags & 0x20);

    size = (size[0] << 21
                | size[1] << 14
                | size[2] << 7
                | size[3]);

    return {
        id3: utf8(ID3), ver, rev, unsync, exp, ext,size
    }
}


const frameHeader = Struct.from([
    [t.uchar, 4], // id
    [t.uchar, 4], // size
    t.uchar, // flags
    t.uchar
]);

function createFrameHeader(buffer) {
    let [
        id, size, flag1, flag2
    ] = frameHeader.getValues(new DataView(buffer))

    id = utf8(id);

    size = (size[0] << 24
                | size[1] << 16
                | size[2] << 8
                | size[3]);

    return {id, size, flag1, flag2}
}

const decoders = [
    new TextDecoder('iso-8859-2'), new TextDecoder('utf-16'),
    new TextDecoder('utf-16be'), new TextDecoder()
]

function createFrameContent(buffer) {
    const encoding = new DataView(buffer, 0, 1).getUint8(0);

    if (encoding > 3) {
        return null
    }

    let data = decoders[encoding].decode(buffer.slice(1));
    
    return {encoding, data}
}

function createFrame() {
    const header = createFrameHeader(splicer.splice(10));
    if(!header.size) return (splicer.max = splicer.index), 0;

    if(header.id === 'APIC') {
        if (typeof window !== 'undefined') {
            let _data = new Uint8Array(splicer.splice(header.size))
            let mimeEnd = _data.indexOf(0, 1)
            let mimeType = _data.slice(0, mimeEnd)
            _data = _data.slice(mimeEnd + 3)
            let content = {data: URL.createObjectURL(new Blob([_data]))}
            return {header, content, mimeType};
        }
        return {header, content: {data: splicer.splice(header.size)}};
    } 

    if (header.id === 'USLT') {
        let _data = new Uint16Array(splicer.splice(header.size));
        let start = _data.indexOf(0);
        return {header, content: {data: utf16(_data.slice(start))}}
    }


    const content = createFrameContent(splicer.splice(header.size));

    return {header, content};
}

export function getID3v2Tag(arrayBuffer, onFrame) {
    const tagHeader = createTagHeader(arrayBuffer.slice(0, 10));
    arrayBuffer = arrayBuffer.slice(10, tagHeader.size);

    splicer.data = arrayBuffer;
    splicer.max = tagHeader.size - 10;

    let frames = [];
    let frame;
    while(splicer.check()) {
        frame = createFrame();
        if(frame) {
            onFrame(frame);
            frames.push(frame);
        }
    }
    
    let tag = {
        tagHeader,
        frames
    }

    return tag;
}
