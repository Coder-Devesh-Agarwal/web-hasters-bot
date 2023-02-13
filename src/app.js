const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const colors = require('colors/safe');
const {
  weather,
  rememberSomething,
  addAEvent,
  news,
  showAllEvents,
} = require('./api');
const fs = require('fs');
const clock = require('date-events')();
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox'] },
});
// path.join(__dirname, 'file.json');

client.initialize();

client.on('loading_screen', (percent, message) => {
  console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  qrcode.generate(qr, { small: true });
  console.log(colors.green('QR RECEIVED'));
});

client.on('authenticated', () => {
  console.log(colors.green('AUTHENTICATED'));
});

client.on('auth_failure', (msg) => {
  // Fired if session restore was unsuccessful
  console.error(colors.green('AUTHENTICATION FAILURE'), msg);
});

client.on('ready', () => {
  console.log(colors.green('READY'));
});

console.log(colors.zebra('----------ENDING AUTH----------'));

//Initalizers
let EVENTS;
fs.readFile('./assets/files/aae.json', function (err, data) {
  // Check for errors
  if (err) throw err;

  // Converting to JSON
  const parseData = JSON.parse(data);
  EVENTS = parseData;
});
//Variables
let INP = 'OFF';
let auto = false;
let spamCount = 0;
//Listeners
client.on('message_create', async (message) => {
  if (message.fromMe) {
    if (INP === 'OFF') {
      // console.log(message);
      switch (message.body) {
        case '[help]':
          message.reply(`This is *List All Commands being Serviced* :
          1. Current Weather - *$weather*
          2. Nerd Stats About You - *$nsau*
          3. Remember Something - *$rems*
          4. Add A Event - *$aae*
          5. News - *$news*
          6. Spam - *$spam{count}*
          7. Show All Events - *$sae*`);
          break;
        case '$weather':
          message.reply('Type in the *City* Name For Weather:');
          INP = 'WEATHER';
          auto = true;
          break;
        case '$nsau':
          message.reply(JSON.stringify(message));
          break;
        case '$rems':
          //https://github.com/sindresorhus/load-json-file/issues/9
          fs.readFile('./assets/files/rems.json', function (err, data) {
            // Check for errors
            if (err) throw err;

            // Converting to JSON
            const parseData = JSON.parse(data);
            let rems = 'Here Is Your Data -\n';
            for (let i = 0; i < parseData.length; i++) {
              rems += `${i + 1}. ${parseData[i]}\n`;
            }
            rems +=
              '-----------------------\n Want To: \n1. *$add${message}* \n2. *$rem${count}*';
            message.reply(rems);
          });
          INP = 'REMS';
          auto = true;
          break;
        case '$aae':
          message.reply(
            '*ENTER THE EVENT AS FORMATED* \nMM-DD - {Message}\n\n*NOTE- EVENTS CAN"T BE REMOVED*'
          );
          INP = 'AAE';
          auto = true;
          break;
        case '$news':
          message.reply(`Here is a complete list of all categories.
                    1 - all
                    2 - national //Indian News only
                    3 - business
                    4 - sports
                    5 - world
                    6 - politics
                    7 - startup
                    8 - entertainment
                    9 - hatke
                    0 - science`);
          INP = 'NEWS';
          auto = true;
          break;
        case '$sae':
          INP = 'SAE';
          auto = true;
          message.reply('Enter *Month Code* For Events To be Listed:');
          break;
        default:
          if (message.body.slice(0, 5) === '$spam') {
            message.reply('Send the message To Be Spammed');
            INP = 'SPAM';
            auto = true;
            spamCount = parseInt(message.body.slice(5));
          }
          break;
      }
    } else {
      if (!auto) {
        switch (INP) {
          case 'WEATHER':
            weather(message);
            console.log(colors.rainbow('Weather Report Sent'));
            break;
          case 'REMS':
            rememberSomething(message);
            console.log(colors.rainbow('REMS Closed'));
            break;
          case 'AAE':
            addAEvent(message);
            console.log(colors.rainbow('AAE Closed'));
            break;
          case 'NEWS':
            news(message);
            console.log(colors.rainbow('News Posted'));
            break;
          case 'SPAM':
            //Limit to 255
            const runner = spamCount > 255 ? 255 : spamCount;
            if (message.hasMedia) {
              const media = await message.downloadMedia();
              if (media !== undefined) {
                for (let i = 0; i < runner; i++) {
                  client.sendMessage(message.to, media);
                }
              } else {
                message.reply('😅 Ooops Unable To Spam 😅');
              }
            } else {
              const spamTxt = message.body;
              for (let i = 0; i < runner; i++) {
                client.sendMessage(message.to, spamTxt);
              }
            }
            console.log(colors.red('Spam Successfull'));
            spamCount = 0;
            break;
          case 'SAE':
            showAllEvents(message);
            console.log(colors.rainbow('SAE Closed'));
            break;
        }
        INP = 'OFF';
      } else {
        auto = false;
      }
    }
  }
});

//Do Something Everydat
clock.on('*-*-* 00:00', function (date) {
  const monthCount = date.getMonth();
  const dateCount = date.getDate();
  for (const event of EVENTS[monthCount].events) {
    if (event.day === dateCount) {
      client.sendMessage(event.chatId, event.message);
    }
  }
});
