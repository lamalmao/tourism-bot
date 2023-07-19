import { Scenes, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import type { Bot } from '../index.js';
import Logger from '../../logger.js';
import replyWithError from '../actions/reply-with-error.js';
import localization from '../localization.js';
import { popup } from '../../tools/popup.js';
import GPTRequest from '../../models/gpt-request.js';
import { askGPT } from '../../tools/ask-gpt.js';
import deleteMessage from '../actions/delete-message.js';

const GPTHints = new Scenes.BaseScene<Bot>('gpt-hints');

GPTHints.enterHandler = async ctx => {
  try {
    if (!ctx.session.userInstance) {
      throw new Error('User not found');
    }
    const { language } = ctx.session.userInstance;

    const { message_id } = await ctx.reply(
      localization.__({
        locale: language,
        phrase: 'gpt-hints.text'
      }),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
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

    ctx.session.GPTHints = {
      working: false,
      menu: message_id
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    Logger.error(errorMessage);
    replyWithError(ctx, errorMessage);
    ctx.scene.enter('menu');
  }
};

GPTHints.on(
  message('text'),
  (ctx, next) => {
    try {
      if (!ctx.session.GPTHints) {
        throw new Error('No hints data');
      }

      if (!ctx.session.userInstance) {
        throw new Error();
      }

      if (ctx.session.GPTHints.working) {
        deleteMessage(ctx);
        popup(
          ctx,
          localization.__({
            locale: ctx.session.userInstance.language,
            phrase: 'gpt-hints.wait'
          }),
          {
            parse_mode: 'HTML'
          }
        );
        return;
      }

      next();
    } catch (error) {
      const errorMessage = (error as Error).message;
      Logger.error(errorMessage);
      replyWithError(ctx, errorMessage);
      ctx.scene.enter('menu');
    }
  },
  async ctx => {
    try {
      if (!ctx.session.GPTHints) {
        throw new Error('No hints data');
      }

      if (!ctx.session.userInstance) {
        throw new Error();
      }

      ctx.session.GPTHints.working = true;

      const { language } = ctx.session.userInstance;

      const request = await GPTRequest.create({
        user: ctx.session.userInstance.telegramId,
        question: ctx.message.text,
        language
      });

      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.GPTHints.menu,
        undefined,
        localization.__({
          locale: language,
          phrase: 'gpt-hints.waiting'
        }),
        {
          parse_mode: 'HTML'
        }
      );

      await ctx.sendChatAction('typing');
      const answer = await askGPT(request, language);
      await ctx.reply(answer, {
        parse_mode: 'HTML'
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      Logger.error(errorMessage);
      replyWithError(ctx, errorMessage);
    } finally {
      ctx.scene.enter('menu');
    }
  }
);

GPTHints.leaveHandler = (ctx, next) => {
  ctx.session.GPTHints = undefined;
  next();
};

export default GPTHints;
