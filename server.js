const express = require('express');
const line = require('@line/bot-sdk');
const crypto = require('crypto'); // cryptoモジュールをインポート
const bodyParser = require('body-parser'); // body-parserモジュールをインポート
const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

const app = express();

// body-parserミドルウェアを使用してリクエストボディをパース
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hello LINE BOT!(GET)'));

// LINEチャネルの署名検証を行うミドルウェアを追加
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

    // メッセージの処理
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

// 以下はそのままです


const client = new line.Client(config);

async function handleEvent(event) {
    if (event.type == 'beacon') {
        console.log('ビーコンを受信');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'ビーコンを受信しました。',
        });
    } else if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    if (event.type === 'message' && event.message.type === 'text' && event.message.text === '画像') {
        const response = await client.replyMessage(event.replyToken, {
            type: 'image',
            originalContentUrl: 'https://picsum.photos/200/300',
            previewImageUrl: 'https://picsum.photos/200/300',
        });

        console.log('画像を送信しました:', response);
    }

    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: event.message.text,
    });
}

app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});
