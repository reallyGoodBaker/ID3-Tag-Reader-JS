# ID3-Tag-Reader

### 使用

#### ID3v1

```js
import getID3v1Tag from './src/id3v1.js';

fetch('音乐路径')
.then(res => res.arrayBuffer())
.then(buf => console.log(getID3v1Tag(buf)));
```

传入一首歌曲的ArrayBuffer, 返回一个包含标签信息的对象



#### ID3v2

```js
import getID3v2Tag from './src/id3v2.js';

fetch('音乐路径')
.then(res => res.arrayBuffer())
.then(buf => getID3v2Tag(buf, frame => {
    console.log(frame)
});
```

传入一首歌曲的ArrayBuffer和onFrame回调函数, 每解析出一个标签帧（Frame）时将解析出的标签帧信息作为参数传递给onFrame回调函数
