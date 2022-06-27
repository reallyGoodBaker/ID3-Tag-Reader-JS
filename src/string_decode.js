const decoder = (label='utf8') => new TextDecoder(label);

export function utf8(iterable) {
    return decoder().decode(new Uint8Array(iterable))
}

export function utf16(iterable, le=true) {
    return decoder(`utf-16${le? '': 'be'}`).decode(new Uint16Array(iterable));
}