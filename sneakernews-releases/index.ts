// @ts-ignore
import runBot from './bot';
// @ts-ignore
import runCron from './cron';

const main = async () => {
  // runBot();
  runCron();
};

main()
  .then((_) => console.log('Server started'))
  .catch((err) => console.error(err));
