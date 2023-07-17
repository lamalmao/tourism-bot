import { Scenes } from 'telegraf';
import type { Bot } from '../index.js';
import enterMenu from './menu.js';
import deleteMessage from '../actions/delete-message.js';
import localization from '../localization.js';
import Logger from '../../logger.js';
import setLocation from './set-location.js';

const stage = new Scenes.Stage<Bot>([enterMenu, setLocation]);

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
