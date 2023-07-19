import Logger from '../logger.js';
import localization from '../bot/localization.js';
import type { IGPTRequest } from '../models/gpt-request.js';
import { ChatGPTAPI } from 'chatgpt';
import settings from '../settings.js';
import GPTRequest from '../models/gpt-request.js';
import ignoreError from '../bot/actions/ignore-error.js';

const api = new ChatGPTAPI({
  apiKey: settings.gpt.key
});

export const askGPT = async (
  request: IGPTRequest,
  language: string
): Promise<string> => {
  try {
    const { text } = await api.sendMessage(
      localization.__(
        {
          locale: language,
          phrase: 'gpt-hints.check-preamble'
        },
        {
          question: request.question
        }
      )
    );

    const checkRegExp = new RegExp(
      localization.__({
        locale: language,
        phrase: 'gpt-hints.can-answer'
      }),
      'mi'
    );

    if (!checkRegExp.test(text)) {
      throw new Error('Bad gpt request from user: ' + request.user);
    }

    const answer = await api.sendMessage(
      localization.__(
        {
          locale: language,
          phrase: 'gpt-hints.question-preamble'
        },
        {
          question: request.question
        }
      )
    );

    await GPTRequest.updateOne(
      {
        _id: request._id
      },
      {
        $set: {
          status: 'done',
          answer: answer.text,
          answerDate: new Date()
        }
      }
    );

    return answer.text;
  } catch (error) {
    GPTRequest.updateOne(
      {
        _id: request._id
      },
      {
        $set: {
          status: 'rejected',
          answerDate: new Date()
        }
      }
    ).catch(ignoreError);
    Logger.error((error as Error).message);
    return localization.__({
      locale: language,
      phrase: 'gpt-hints.bad-request'
    });
  }
};
