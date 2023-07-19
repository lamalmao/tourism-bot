import ignoreError from '../bot/actions/ignore-error.js';
import type { Bot } from '../bot/index.js';

export const popup = (ctx: Bot, message: string, extra?: object) => {
  const instance = ctx;
  ctx
    .reply(message, extra)
    .then(message => {
      setTimeout(() => {
        instance.deleteMessage(message.message_id).catch(ignoreError);
      }, 2000);
    })
    .catch(ignoreError);
};
