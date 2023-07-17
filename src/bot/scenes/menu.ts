import { Scenes, Markup } from 'telegraf';
import type { Bot } from '../index.js';
import Logger from '../../logger.js';
import replyWithError from '../actions/reply-with-error.js';
import localization from '../localization.js';

const enterMenu = new Scenes.BaseScene<Bot>('menu');

enterMenu.enterHandler = async ctx => {
  try {
    if (!ctx.session.userInstance) {
      throw new Error('User not found');
    }

    const language = ctx.session.userInstance.language;

    const menu = await ctx.reply(
      localization.__({
        locale: language,
        phrase: 'menu.text'
      }),
      {
        reply_markup: Markup.keyboard([
          [
            localization.__({
              locale: language,
              phrase: 'menu.weather'
            }),
            localization.__({
              locale: language,
              phrase: 'menu.route'
            }),
            localization.__({
              locale: language,
              phrase: 'menu.set-location'
            })
          ],
          [
            localization.__({
              locale: language,
              phrase: 'menu.events'
            }),
            localization.__({
              locale: language,
              phrase: 'menu.hints'
            })
          ],
          [
            localization.__({
              locale: language,
              phrase: 'menu.rent'
            })
          ]
        ]).resize(true).reply_markup
      }
    );

    ctx.session.menu = menu.message_id;
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.log((error as Error).stack);
    Logger.error(errorMessage);
    replyWithError(ctx, errorMessage);
  } finally {
    ctx.scene.leave();
  }
};

export default enterMenu;
