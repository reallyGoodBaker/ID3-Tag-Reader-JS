# ID3-Tag-Reader
菜鸟作品



使用：
```js
import getID3v2Tag from './src/es6/id3v2.js';

fetch('音乐路径')
.then(res => res.arrayBuffer())
.then(buffer => console.log(getID3v2Tag(buffer)));
```
传入一首歌曲的ArrayBuffer, 函数将返回一个包含众多信息的对象

