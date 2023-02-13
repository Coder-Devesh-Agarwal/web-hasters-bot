const got = require('got');
const fs = require('fs');
const rems = require('../assets/files/rems.json');
const aae = require('../assets/files/aae.json');
//CONSTANTS
const CH_ARR = [
  'science',
  'all',
  'national',
  'business',
  'sports',
  'world',
  'politics',
  'startup',
  'entertainment',
  'hatke',
];

//FUNCTIONS
const weather = (message) => {
  got(`https://geocoding-api.open-meteo.com/v1/search?name=${message.body}`, {
    json: true,
  })
    .then((res) => {
      // handle the response
      console.log('GEOCODES RETRIVED');
      const longitude = res.body?.results[0].longitude;
      const latitude = res.body?.results[0].latitude;
      got(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`,
        {
          json: true,
        }
      )
        .then((res) => {
          console.log('TEMP PARA RECEIVED');
          const body = res.body;
          const daily = body.daily;
          let temp = '';
          for (let i = 0; i < daily.time.length; i++) {
            temp =
              temp +
              `${daily.time[i]} | ${daily.temperature_2m_min[i]} - ${daily.temperature_2m_max[i]} °C\n`;
          }
          let sunrise = '';
          for (let i = 0; i < daily.sunrise.length; i++) {
            sunrise =
              sunrise +
              `${daily.sunrise[i].slice(0, -5)} | ${daily.sunrise[i].slice(
                -5
              )} - ${daily.sunset[i].slice(-5)}\n`;
          }

          message.reply(`☀️ Here Is Your Weather Info ☀️
Place Name - ${message.body}
Longitude: ${body.longitude}
Latitude: ${body.latitude}
Timezone: ${body.timezone}
Elevation: ${body.elevation}

*Daily Temprature - MIN  |  MAX* 
${temp}

*SUNRISE | SUNSET*
${sunrise}

😀 *ThankU For Checking Up The Weather* 😀`);
        })
        .catch(function (err) {
          // handle the error
          console.log(err);
          message.reply('😟 Something went wrong 😟');
        });
    })
    .catch(function (err) {
      // handle the error
      console.log(err);
      message.reply('😟 Something went wrong 😟');
    });
  return;
};
const rememberSomething = (message) => {
  if (message.body.slice(0, 5) === '$add$') {
    rems.push(message.body.slice(5));
    //https://github.com/sindresorhus/load-json-file/issues/9
    fs.writeFile('./assets/files/rems.json', JSON.stringify(rems), (err) => {
      // Checking for errors
      if (err) throw err;

      message.reply('Done writing');
      console.log('Done writing'); // Success
    });
  }
  if (message.body.slice(0, 5) === '$rem$') {
    const count = parseInt(message.body.slice(5));
    const resAns = rems.slice(count - 1, 1);
    //https://github.com/sindresorhus/load-json-file/issues/9
    fs.writeFile('./assets/files/rems.json', JSON.stringify(resAns), (err) => {
      // Checking for errors
      if (err) throw err;

      message.reply('Done Removing');
      console.log('Done Removing'); // Success
    });
  }
  return;
};
const addAEvent = (message) => {
  const monthCount = parseInt(message.body.slice(0, 2)) - 1;
  const dateCount = parseInt(message.body.slice(3, 5));
  if (monthCount < 12 && dateCount <= aae[monthCount].days) {
    const pushObj = {
      day: dateCount,
      message: message.body.slice(8),
      chatId: message.to,
    };
    aae[monthCount].events.push(pushObj);
    //https://github.com/sindresorhus/load-json-file/issues/9
    fs.writeFile('./assets/files/aae.json', JSON.stringify(aae), (err) => {
      // Checking for errors
      if (err) throw err;

      message.reply('Done Adding');
      console.log('Done Adding'); // Success
    });
  } else {
    message.reply('Wrong Date 📅');
  }
  return;
};
const news = (message) => {
  const num = message.body - '0';
  if (0 <= num && num <= 9) {
    got(`https://inshorts.deta.dev/news?category=${CH_ARR[num]}`, {
      json: true,
    })
      .then((res) => {
        // handle the response
        console.log('NEWS RETRIVED');
        const dataArr = res.body.data.slice(0, 9);
        const nxt = '\n--------------------------------------\n';
        let msg = nxt;
        for (let i = 0; i < dataArr.length; i++) {
          msg = msg + `*${i}. ${dataArr[i].title}*`;
          msg = msg + `\n${dataArr[i].content}`;
          msg = msg + `\n*${dataArr[i].author}* - ${dataArr[i].date}`;
          msg = msg + nxt;
        }
        message.reply(
          `Top ${dataArr.length} 📰 News Regarding *${res.body.category}* :${msg}`
        );
      })
      .catch(function (err) {
        // handle the error
        console.log(err);
        message.reply('😟 Something went wrong 😟');
      });
  } else {
    message.reply('🔴 Wrong choice 🔴');
  }
};
const showAllEvents = (message) => {
  const monthCount = parseInt(message.body.slice(0)) - 1;
  if (monthCount < 12) {
    let msg = 'Listing all messages\n\n';
    let count = 1;
    for (const event of aae[monthCount].events) {
      msg += `${count}. ${event.day} - ${event.message}\n`;
      count++;
    }
    message.reply(msg);
    if (aae[monthCount].events.length <= 0) {
      message.reply('No Data Found');
    }
  } else {
    message.reply('Wrong Month 📅');
  }
  return;
};
module.exports = {
  weather,
  rememberSomething,
  addAEvent,
  news,
  showAllEvents,
};
