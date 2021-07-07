# ID3-Tag-Reader


使用：
```js
import getID3v2Tag from './src/es6/id3v2.js';

fetch('音乐路径')
.then(res => res.arrayBuffer())
.then(buffer => console.log(getID3v2Tag(buffer)));
```
传入一首歌曲的ArrayBuffer, 函数将返回一个包含众多信息的对象



# Tag

基本结构

```html
<Tag>
    <header/>
    <ExtendedHeader/> //可能没有
    <frames/>
    <Album/>
    <Title/>
    <Performers/>
    <TrackNumber/>
    <ToolForEncoding/>
    <Year/>
    <Lyrics/>
    <Picture/>
    <padding/> //可能没有，暂时没什么用，以后用来添加Tag数据
</Tag>
```



通过 `frames` 可以取出已经提取出的标签帧(Frame)

```js
const {
    TIT2, //歌手
    USLT, //非同步歌词
    TXXX //自定义标签
      } = tag.frames;
```



部分Frame已经过处理，无需手动提取

```js
//val函数用于取出相应Frame的数据
{
    Album: string, //专辑名称
    Title: string,  //歌曲标题
    Performers: string,  //歌手
    TrackNumber: number,  //专辑中的位置
    ToolForEncoding: string,  //编码工具
    Year: string,  //年份
    Lyrics: object,  //歌词
    Picture: object,  //图片
}
```



部分经过处理的属性并不会直接将原始值暴露出来，比如 `Picture` 

```js
Picture = {
    __mime: number,  //解析过程中的实际mime类型  0/1/2 -> jpeg/gif/png
    mime: string,  //标注的mime类型
    blob: string,  //base64字符串
    getImage: function,  //返回一个src属性已经赋值的<img>元素
}
```



`Lyrics`  

```js
{
    text: string,  //文本形式
    data: Array<{time: string, text: string}>  //带时间戳和对应数据的数组
}
```



