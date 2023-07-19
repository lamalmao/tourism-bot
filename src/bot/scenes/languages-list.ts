import { Scenes, Markup } from 'telegraf';
import type { Bot } from '../index.js';
import replyWithError from '../actions/reply-with-error.js';
import Logger from '../../logger.js';
import { USER_LANGUAGES } from '../../models/user.js';
import localization from '../localization.js';

const languagesList = new Scenes.BaseScene<Bot>('languages-list');

languagesList.enterHandler = async ctx => {
  try {
    if (!ctx.session.userInstance) {
      throw new Error('User not found');
    }
    const { language } = ctx.session.userInstance;
    const userLanguagesList = Object.keys(USER_LANGUAGES).filter(
      value => value !== language
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyboard: Array<Array<any>> = [];
    for (const lang of userLanguagesList) {
      keyboard.push([
        Markup.button.callback(
          localization.__({
            locale: language,
            phrase: 'set-language.languages.'.concat(lang)
          }),
          `set-language:${lang}`
        )
      ]);
    }
    keyboard.push([
      Markup.button.callback(
        localization.__({
          locale: language,
          phrase: 'exit'
        }),
        'close'
      )
    ]);

    await ctx.editMessageText(
      localization.__({
        locale: language,
        phrase: 'set-language.text'
      }),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup
      }
    );
  } catch (error) {
    const errorMessage = (error as Error).message;
    Logger.error(errorMessage);
    replyWithError(ctx, errorMessage);
  } finally {
    ctx.scene.leave();
  }
};

export default languagesList;
