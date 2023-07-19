import { Scenes, Markup } from 'telegraf';
import type { Bot } from '../index.js';
import Logger from '../../logger.js';
import replyWithError from '../actions/reply-with-error.js';
import localization from '../localization.js';

const enterProfile = new Scenes.BaseScene<Bot>('profile');

enterProfile.enterHandler = async ctx => {
  try {
    if (!ctx.session.userInstance || !ctx.from) {
      throw new Error('User not found');
    }

    const language = ctx.session.userInstance.language;
    const username = ctx.from.username ? ctx.from.username : 'Anonymous';

    await ctx.reply(
      localization.__(
        {
          locale: language,
          phrase: 'profile.text'
        },
        {
          username
        }
      ),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback(
              localization.__({
                locale: language,
                phrase: 'profile.buttons.set-location'
              }),
              'set-location'
            ),
            Markup.button.callback(
              localization.__({
                locale: language,
                phrase: 'profile.buttons.booking'
              }),
              'booking'
            )
          ],
          [
            Markup.button.callback(
              localization.__({
                locale: language,
                phrase: 'profile.buttons.language'
              }),
              'language'
            )
          ],
          [
            Markup.button.callback(
              localization.__({
                locale: language,
                phrase: 'exit'
              }),
              'close'
            )
          ]
        ]).reply_markup
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

export default enterProfile;
