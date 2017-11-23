const {sync: dbSync} = require('./db');
const runBot = require('./bot');
const runCron = require('./cron');


const main = async _ => {
  // await dbSync();
  runBot();
  await runCron();
}

main().then(_ => console.log('Server started')).catch(err => console.error(err));
