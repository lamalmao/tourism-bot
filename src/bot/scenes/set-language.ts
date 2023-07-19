import { Scenes } from 'telegraf';
import type { Bot } from '../index.js';
import replyWithError from '../actions/reply-with-error.js';
import Logger from '../../logger.js';
import User from '../../models/user.js';
import ignoreError from '../actions/ignore-error.js';

const setLanguage = new Scenes.BaseScene<Bot>('set-language');

setLanguage.enterHandler = async ctx => {
  try {
    if (!ctx.session.userInstance || !ctx.callbackQuery || !ctx.from) {
      throw new Error('User not found');
    }

    const setLanguageData = /(ru|ua|en|cn|tt|ar)$/i.exec(
      ctx.callbackQuery['data']
    );
    if (!setLanguageData) {
      throw new Error('Unknown language');
    }

    const chosenLanguage = setLanguageData[0];
    await User.updateOne(
      {
        telegramId: ctx.from.id
      },
      {
        $set: {
          language: chosenLanguage
        }
      }
    );

    ctx.session.userInstance.language = chosenLanguage;
    ctx.deleteMessage().catch(ignoreError);
    ctx.scene.enter('menu');
  } catch (error) {
    const errorMessage = (error as Error).message;
    Logger.error(errorMessage);
    replyWithError(ctx, errorMessage);
    ctx.scene.leave();
  }
};

export default setLanguage;
