import R from "./R.js";
//import getID3v2Tag from './music-tag-reader/es6/id3v2_decrypted.js'
import { getID3v2Tag } from './src/id3v2.js';


R.define('c-some', class Some extends R.Component {
    onWillMount = () => {
        console.log("成功了！！！");
    }
});

//R.mount(document.querySelector('#temp'), document.querySelector('#app'));

const changeFavicon = link => {
    let $favicon = document.querySelector('link[rel="icon"]');
    if ($favicon !== null) {
        $favicon.href = link;
    } else {
        $favicon = document.createElement("link");
        $favicon.rel = "icon";
        $favicon.href = link;
        document.head.appendChild($favicon);
    }
};

const play = (url, obj) =>
    R(url, obj)
        .then(res => res.arrayBuffer())
        .then(buffer => {
            let mp3Tagv2 = {}
            getID3v2Tag(buffer, frame => {
                if (frame.header.id === 'TIT2') {
                    mp3Tagv2.Title = frame.content.data;
                }
                if (frame.header.id === 'TPE1') {
                    mp3Tagv2.Performers = frame.content.data;
                }
                if (frame.header.id === 'TALB') {
                    mp3Tagv2.Album = frame.content.data;
                }
                if (frame.header.id === 'USLT') {
                    mp3Tagv2.Lyrics = {text: frame.content.data};
                }
                if (frame.header.id === 'APIC') {
                    mp3Tagv2.Picture = frame.content.data;
                }
            });
            //console.log(mp3Tagv2);
            document.title = mp3Tagv2.Title;
            document.body.innerHTML +=
                `
      <style>
      div::-webkit-scrollbar{
            width:0px;
      }
      </style>
      <div style="display: flex; justify-content: center; align-items: center">
      <div style="margin: 0px 40px 0px 24px; overflow: hidden; max-width: 320px">
      <img src="${mp3Tagv2.Picture}" width="300" style="border-radius: 12px">
      <h1>${mp3Tagv2.Title}<h1>
      <h3>${mp3Tagv2.Performers} - ${mp3Tagv2.Album}<h3>
      <audio src="${url}" controls="controls"></audio>
      </div>
      <div style="height: 100vh; display: flex; justify-content: center; overflow-y: scroll">
      <div style="font-size: 20px; max-width: 40vw; margin: 40vh 0px 40vh 0px; height: fit-content">
      ${mp3Tagv2.Lyrics ? mp3Tagv2.Lyrics.text.replace(/\n/g, '<br/><br/>').replace(/\[.*?\]/g, '') : '无歌词标签'}</div>
      </div>
      </div>
      `;
        });

let file = document.querySelector('#filep');
file.addEventListener('change', function (e) {
    let url = URL.createObjectURL(this.files[0])
    play(url);
    this.remove();
});