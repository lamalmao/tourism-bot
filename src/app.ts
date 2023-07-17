import TreeLoader from './tools/tree-loader.js';
import bot from './bot/index.js';
import mongoose from 'mongoose';
import settings from './settings.js';
import Logger from './logger.js';

(async () => {
  try {
    await mongoose.connect(settings.db);
    console.log('Successfully connected to DB');

    const rootTreeLoader = new TreeLoader();
    rootTreeLoader.buildTree();

    bot.launch();
    console.log('Bot started');
  } catch (error) {
    const message = (error as Error).message;
    Logger.error(message);
    console.error(message);
  }
})();

// process.on('SIGKILL', async () => {
//   bot.stop('Exiting');
//   await mongoose.disconnect();
//   process.exit(0);
// });
