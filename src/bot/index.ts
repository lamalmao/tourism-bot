import { Telegraf, Context, Scenes } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import settings from '../settings.js';
import type { IUser } from '../models/user.js';
import path from 'path';
import deleteMessage from './actions/delete-message.js';
import Logger from '../logger.js';
import getUser from './actions/get-user.js';
import replyWithError from './actions/reply-with-error.js';
import stage from './scenes/index.js';
import localization from './localization.js';

export interface BotSession
  extends Scenes.SceneSession<Scenes.SceneSessionData> {
  userInstance?: IUser;
  menu?: number;
  setLocation?: {
    coordinates: [number, number];
    titles: Array<string>;
  };
}

export type BotContext = Context & Scenes.SceneContext;
export interface Bot extends BotContext {
  session: BotSession;
}

const session = new LocalSession({
  database: path.resolve('./session.json'),
  property: 'session',
  storage: LocalSession.storageFileAsync,
  format: {
    serialize: obj => JSON.stringify(obj, null),
    deserialize: str => JSON.parse(str)
  }
});

const bot = new Telegraf<Bot>(settings.bot.key);
bot.use(session.middleware());
bot.use(stage.middleware());

bot.start(deleteMessage, getUser(true), async ctx => {
  try {
    if (!ctx.session.userInstance) {
      throw new Error('User not found');
    }

    await ctx.reply(
      localization.__(
        {
          locale: ctx.session.userInstance.language,
          phrase: 'greeting'
        },
        {
          username: ctx.from.username ? ctx.from.username : 'Anonymous'
        }
      ),
      {
        parse_mode: 'HTML'
      }
    );

    ctx.scene.enter('menu');
  } catch (error) {
    const errorMessage = (error as Error).message;

    replyWithError(ctx, errorMessage);
    Logger.error(errorMessage);
  }
});

bot.hears(localization.__l('menu.set-location'), ctx =>
  ctx.scene.enter('set-location')
);

export default bot;
