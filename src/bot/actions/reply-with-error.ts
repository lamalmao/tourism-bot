import { USER_LANGUAGES } from '../../models/user.js';
import type { Bot } from '../index.js';
import localization from '../localization.js';
import ignoreError from './ignore-error.js';

export default async function replyWithError(ctx: Bot, message: string) {
  const language = ctx.session.userInstance
    ? ctx.session.userInstance.language
    : USER_LANGUAGES.en;

  ctx
    .reply(
      localization.__(
        {
          locale: language,
          phrase: 'error'
        },
        {
          error: message
        }
      ),
      {
        parse_mode: 'HTML'
      }
    )
    .catch(ignoreError);
}
