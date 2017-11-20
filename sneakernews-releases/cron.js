const CronJob = require('cron').CronJob;
const work = require('./work');
const {get: getUsers} = require('./user');


const cronJob = async _ => {
  const nowHour = new Date().getHours();
  const users = await getUsers({where: {subscriptionHour: nowHour}});
  return Promise.all(users.map(work));
};

const runCron = async _ => {
  new CronJob('0 * * * * *', _ => {
    cronJob().then(_ => console.log('Cron job completed')).catch(err => console.error(err));
  }, null, true, 'Europe/Moscow');
};

module.exports = runCron;
