const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
(async () => {
  const apiId = Number.parseInt(process.env.TELEGRAM_API_ID, 10);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 5 });
  await client.start({
    phoneNumber: () => input.text('Phone number: '),
    password: () => input.text('2FA password: '),
    phoneCode: () => input.text('Code: '),
    onError: (err) => console.error(err)
  });
  console.log('TELEGRAM_SESSION=' + client.session.save());
  await client.disconnect();
})();
