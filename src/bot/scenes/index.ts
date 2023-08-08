import { Scenes } from 'telegraf';
import type { Bot } from '../index.js';
import enterMenu from './menu.js';
import deleteMessage from '../actions/delete-message.js';
import localization from '../localization.js';
import Logger from '../../logger.js';
import setLocation from './set-location.js';
import enterProfile from './profile.js';
import languagesList from './languages-list.js';
import setLanguage from './set-language.js';
import GPTHints from './gpt-hints.js';
import searchHotel from './search-hotel.js';
import hotelsList from './hotels-list.js';

const stage = new Scenes.Stage<Bot>([
  enterMenu,
  setLocation,
  enterProfile,
  languagesList,
  setLanguage,
  GPTHints,
  searchHotel,
  hotelsList
]);

stage.start((ctx, next) => {
  ctx.scene.leave();
  next();
});

stage.action('close', deleteMessage, ctx => ctx.scene.leave());

stage.hears(localization.__l('exit'), deleteMessage, async ctx => {
  try {
    if (ctx.session.menu) {
      await ctx.telegram.deleteMessage(ctx.from.id, ctx.session.menu);
    }
  } catch (error) {
    Logger.error((error as Error).message);
  } finally {
    ctx.scene.enter('menu');
  }
});

export default stage;
