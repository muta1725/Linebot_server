'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

const app = express();

//認証部分
const crypto = require("crypto");

const channelSecret = "..."; // Channel secret string
const body = "..."; // Request body string
const signature = crypto
  .createHmac("SHA256", channelSecret)
  .update(body)
  .digest("base64");
// Compare x-line-signature request header and the signature

app.get('/', (req, res) => res.send('Hello LINE BOT!(GET)')); //ブラウザ確認用(無くても問題ない)
app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events);

    //ここのif分はdeveloper consoleの"接続確認"用なので削除して問題ないです。
    if(req.body.events[0].replyToken === '00000000000000000000000000000000' && req.body.events[1].replyToken === 'ffffffffffffffffffffffffffffffff'){
        res.send('Hello LINE BOT!(POST)');
        console.log('疎通確認用');
        return; 
    }

    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);


async function handleEvent(event) {
  if (event.type == 'beacon') {
    console.log('ビーコンを受信');
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ビーコンを受信しました。' // ビーコン受信時のメッセージ
    });
  }

  else if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  if (event.type === 'message' && event.message.type === 'text' && event.message.text === '画像') {
    // ユーザーが「画像」というテキストメッセージを送信した場合
    const response = await client.replyMessage(event.replyToken, {
      type: 'image',
      originalContentUrl: 'https://picsum.photos/200/300', // 送信する画像のURL
      previewImageUrl: 'https://picsum.photos/200/300' // プレビュー用の画像URL
    });

    // メッセージ送信の結果をログに記録
    console.log('画像を送信しました:', response);
  }

  //その他の場合、メッセージをオウム返し
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: event.message.text //実際に返信の言葉を入れる箇所
  });
}



app.listen(PORT);
console.log(`Server running at ${PORT}`);