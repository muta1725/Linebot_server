'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const crypto = require('crypto'); // cryptoモジュールをインポート
const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

const app = express();

app.get('/', (req, res) => res.send('Hello LINE BOT!(GET)')); // ブラウザ確認用(無くても問題ない)

app.post('/webhook', (req, res) => {
    const body = JSON.stringify(req.body);
    const signature = req.get('X-Line-Signature');

    // Verify the signature
    if (!isValidSignature(body, signature, config.channelSecret)) {
        console.error('Invalid signature');
        return res.sendStatus(400);
    }

    console.log(req.body.events);

    // LINEアカウントの検証が成功したことをログに記録
    console.log('LINEアカウントの検証が成功しました。');

    // Handle events asynchronously
    Promise
      .all(req.body.events.map(handleEvent)) // イベントを非同期に処理
      .then((result) => {
        // 応答が全て完了したらレスポンスを返す
        res.json(result);
      })
      .catch((error) => {
        console.error('Error:', error);
        res.sendStatus(500);
      });
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

function isValidSignature(body, signature, channelSecret) {
    const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
    return hash === signature;
}
