'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const crypto = require('crypto'); // cryptoモジュールを追加

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

    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));


      // リクエストヘッダーからx-line-signatureを取得
    const xLineSignature = req.headers['x-line-signature'];

    // リクエストボディ
    const body = JSON.stringify(req.body);

    // チャネルシークレットを使用してダイジェスト値を計算
    const signature = crypto
        .createHmac('SHA256', config.channelSecret)
        .update(body)
        .digest('base64');

    // x-line-signatureと計算した署名を比較
    if (xLineSignature === signature) {
        // 署名が一致した場合の処理
        Promise
            .all(req.body.events.map(handleEvent))
            .then((result) => res.json(result));
    } else {
        // 署名が一致しない場合の処理
        console.error('Signature validation failed');
        res.status(400).send('Signature validation failed');
    }
    console.log(req.body.events);

    // LINEアカウントの検証が成功したことをログに記録
    console.log('LINEアカウントから送信されました', response);
    // The rest of your webhook code goes here...

    // If all checks pass, respond with success status
    res.sendStatus(200);
});

const client = new line.Client(config);

async function handleEvent(event) {
    if (event.type == 'beacon') {
        console.log('ビーコンを受信');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'ビーコンを受信しました。', // ビーコン受信時のメッセージ
        });
    } else if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }
    if (event.type === 'message' && event.message.type === 'text' && event.message.text === '画像') {
        // ユーザーが「画像」というテキストメッセージを送信した場合
        const response = await client.replyMessage(event.replyToken, {
            type: 'image',
            originalContentUrl: 'https://picsum.photos/200/300', // 送信する画像のURL
            previewImageUrl: 'https://picsum.photos/200/300', // プレビュー用の画像URL
        });

        // メッセージ送信の結果をログに記録
        console.log('画像を送信しました:', response);
    }

    // その他の場合、メッセージをオウム返し
    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: event.message.text, // 実際に返信の言葉を入れる箇所
    });
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);

function isValidSignature(body, signature, channelSecret) {
    const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
    return hash === signature;
}
