import Logger from '../../logger.js';
import User, { USER_LANGUAGES } from '../../models/user.js';
import type { Bot } from '../index.js';
import replyWithError from './reply-with-error.js';

export default function getUser(createNew = false) {
  return async function (ctx: Bot, next?: CallableFunction) {
    try {
      if (!ctx.from || !ctx.from.id) {
        throw new Error('User id not found');
      }
      const telegramId = ctx.from.id;

      let user = await User.findOne({
        telegramId
      });

      if (user) {
        ctx.session.userInstance = user.toObject();
      } else if (createNew) {
        const language = ctx.from.language_code
          ? Object.values(USER_LANGUAGES).includes(ctx.from.language_code)
            ? ctx.from.language_code
            : USER_LANGUAGES.en
          : USER_LANGUAGES.en;

        user = await User.create({
          telegramId,
          language
        });
        ctx.session.userInstance = user.toObject();
      } else {
        throw new Error('User not found');
      }

      if (next) {
        next();
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      replyWithError(ctx, errorMessage);
      Logger.error(errorMessage);
    }
  };
}
