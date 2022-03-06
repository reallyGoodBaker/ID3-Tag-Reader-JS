export const types = {
    uchar: 'Uint8',
    char: 'Int8',
    short: 'Int16',
    ushort: 'Uint16',
    int: 'Int32',
    uint: 'Uint32',
    long: 'Int32',
    ulong: 'Uint32',
    float: 'Float32',
    double: 'Float64',
}

const type_size = {
    Uint8: 1,
    Int8: 1,
    Int16: 2,
    Uint16: 2,
    Int32: 4,
    Uint32: 4,
    Float32: 4,
    Float64: 8
}

export const TypedArrays = {
    Uint8: Uint8Array,
    Int8: Int8Array,
    Int16: Int16Array,
    Uint16: Uint16Array,
    Int32: Int32Array,
    Uint32: Uint32Array,
    Float32: Float32Array,
    Float64: Float64Array
}

let Global = typeof window !== 'undefined'? window:
    typeof global !== 'undefined'? global:
        typeof globalThis !== 'undefined'? globalThis:
            typeof self !== 'undefined'? self: {};

//Global = Object.assign(Global, types);

export function sizeof(type) {
    if(!type) return 0;
    if (type && typeof type === 'object') return type.sizeOf();
    return type_size[type];
}

export function malloc(size_t) {
    return new ArrayBuffer(size_t);
}

export class Struct {
    offsets = [0];

    constructor(view) {
        this.view = view;
        this.sizeOf();
    }

    sizeOf() {
        this.offsets = [0];
        let offset = 0;
        for (const v of this.view) {
            if(Array.isArray(v)) offset += sizeof(v[0]) * v[1];
            else offset += sizeof(v);
            this.offsets.push(offset);
            
        }
        this.offsets.pop();
        return offset;
    }

    create(dataArr) {
        const size = this.sizeOf();
        let mem = malloc(size);
        let dv = new DataView(mem);
        let view = this.view;
        let offsets = this.offsets;
        const len = view.length;

        for(let i = 0, offset; i < len; i++) {
            let dataToWrite = dataArr[i] || 0;
            let dataType = view[i];
            offset = offsets[i];

            if (Array.isArray(dataType)) {
                const [type, count] = dataType;
                for (let i = 0; i < count; i++) 
                    dv[`set${type}`](offset, dataToWrite[i]);
                continue;
            }

            dv[`set${dataType}`](offset, dataToWrite);
        }

        return dv;
    }

    static from(iterabale) {
        return new Struct(iterabale);
    }

    getValues(dataView) {
        let values = [];
        let view = this.view;
        let offsets = this.offsets;
        let len = view.length;

        for(let i = 0, offset; i < len; i++) {
            let dataType = view[i];
            offset = offsets[i];

            if (Array.isArray(dataType)) {
                let arr = [];
                const type = dataType[0];
                const count = dataType[1]
                const size = sizeof(type);
                
                for (let i = 0; i < count; i++) {
                    arr.push(dataView[`get${type}`](offset + i*size));
                }
                
                arr = this.arrayDecorator(arr);
                values.push(arr);
                continue;
            }

            values.push(dataView[`get${dataType}`](offset));

        }

        return values;
    }

    arrayDecorator(arr) {
        return arr;
    }

}

