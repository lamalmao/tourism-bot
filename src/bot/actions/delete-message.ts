import Logger from '../../logger.js';
import type { Bot } from '../index.js';

export default async function deleteMessage(ctx: Bot, next?: CallableFunction) {
  try {
    await ctx.deleteMessage();
  } catch (error) {
    Logger.error((error as Error).message);
  } finally {
    if (next) {
      next();
    }
  }
}
