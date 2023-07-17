import { Scenes, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import type { Bot } from '../index.js';
import Logger from '../../logger.js';
import replyWithError from '../actions/reply-with-error.js';
import localization from '../localization.js';
import User, { MAPS_ALLOWED_USER_LANGUAGES } from '../../models/user.js';
import getLocationData from '../../tools/reverse-geocoder.js';

const setLocation = new Scenes.BaseScene<Bot>('set-location');

setLocation.enterHandler = async ctx => {
  try {
    if (!ctx.session.userInstance) {
      throw new Error('User not found');
    }

    const language = ctx.session.userInstance.language;

    const menu = await ctx.reply(
      localization.__({
        locale: language,
        phrase: 'set-location.instruction'
      }),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.keyboard([
          [
            Markup.button.locationRequest(
              localization.__({
                locale: language,
                phrase: 'set-location.location-request'
              })
            )
          ],
          [
            localization.__({
              locale: language,
              phrase: 'exit'
            })
          ]
        ]).resize(true).reply_markup
      }
    );

    ctx.session.menu = menu.message_id;
  } catch (error) {
    const errorMessage = (error as Error).message;
    Logger.error(errorMessage);
    replyWithError(ctx, errorMessage);
  }
};

setLocation.on(message('location'), async ctx => {
  try {
    if (!ctx.session.userInstance) {
      throw new Error('User not found');
    }

    if (!ctx.session.menu) {
      throw new Error('Menu id not found');
    }

    const language = ctx.session.userInstance.language;

    const location = ctx.message.location;
    const recognizedLocations = await getLocationData(
      [location.longitude, location.latitude],
      Object.keys(MAPS_ALLOWED_USER_LANGUAGES).includes(language)
        ? MAPS_ALLOWED_USER_LANGUAGES[
            language as keyof typeof MAPS_ALLOWED_USER_LANGUAGES
          ]
        : MAPS_ALLOWED_USER_LANGUAGES.ru
    );

    if (!recognizedLocations) {
      throw new Error(
        localization.__({
          locale: language,
          phrase: 'set-location.not-found'
        })
      );
    }

    const coordinates: [number, number] = [
      location.longitude,
      location.latitude
    ];

    ctx.session.setLocation = {
      coordinates,
      titles: recognizedLocations
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyboard: Array<Array<any>> = [];
    for (let i = 0; i < recognizedLocations.length; i++) {
      keyboard.push([
        Markup.button.callback(recognizedLocations[i], `location:${i}`)
      ]);
    }

    await ctx.reply(
      localization.__({
        locale: language,
        phrase: 'set-location.choose-variant'
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
    ctx.scene.enter('menu');
  }
});

setLocation.action(/location:\d+/, async ctx => {
  try {
    if (!ctx.session.userInstance || !ctx.from || !ctx.from.id) {
      throw new Error('User not found');
    }

    if (!ctx.session.setLocation) {
      throw new Error('No location data found');
    }

    if (!ctx.session.menu) {
      throw new Error('Menu id not found');
    }

    const locationId = /\d+/i.exec(ctx.callbackQuery['data'] as string);
    if (!locationId) {
      throw new Error('No location id found');
    }

    const location = ctx.session.setLocation.titles[Number(locationId[0])];

    await User.updateOne(
      {
        telegramId: ctx.from.id
      },
      {
        $set: {
          location: {
            coordinates: ctx.session.setLocation.coordinates,
            title: location
          }
        }
      }
    );

    await ctx.editMessageText(
      localization.__(
        {
          locale: ctx.session.userInstance.language,
          phrase: 'set-location.finale'
        },
        {
          address: location
        }
      ),
      {
        parse_mode: 'HTML'
      }
    );
  } catch (error) {
    const errorMessage = (error as Error).message;
    Logger.error(errorMessage);
    replyWithError(ctx, errorMessage);
  } finally {
    ctx.scene.enter('menu');
  }
});

setLocation.leaveHandler = (ctx, next) => {
  ctx.session.setLocation = undefined;
  next();
};

export default setLocation;
