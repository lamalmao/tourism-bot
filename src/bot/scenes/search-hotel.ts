import { Markup, Scenes } from 'telegraf';
import type { Bot } from '../index.js';
import replyWithError from '../actions/reply-with-error.js';
import Logger from '../../logger.js';
import localization from '../localization.js';
import { LOCATIONS, toISODate } from '../../hotels/search-by-geo.js';
import { HOTEL_TYPES } from '../../hotels/entities.js';
import { message } from 'telegraf/filters';
import { popup } from '../../tools/popup.js';
import deleteMessage from '../actions/delete-message.js';

const searchHotel = new Scenes.BaseScene<Bot>('search-hotel');

searchHotel.enterHandler = async ctx => {
  try {
    if (!ctx.session.userInstance || !ctx.from) {
      throw new Error('User not found');
    }

    const user = ctx.session.userInstance;

    const cities: {
      [key: string]: string;
    } = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyboard: Array<any> = [];

    for (const cityId of Object.keys(LOCATIONS)) {
      const localizedName = localization.__({
        locale: user.language,
        phrase: `hotels.cities.${cityId}`
      });
      cities[cityId] = localizedName;
      keyboard.push([Markup.button.callback(localizedName, `city:${cityId}`)]);
    }

    await ctx.reply(
      localization.__({
        locale: user.language,
        phrase: 'hotels.search.choose-region'
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
};

searchHotel.action(/city:\w+/i, async ctx => {
  try {
    if (!ctx.session.userInstance || !ctx.from || !ctx.callbackQuery) {
      throw new Error('User not found');
    }

    const user = ctx.session.userInstance;

    const rawData = /:(\w+)$/i.exec(ctx.callbackQuery['data']);
    if (!rawData) {
      throw new Error('Error while receiving information');
    }

    const cityId = rawData[1];
    const coordinates = LOCATIONS[cityId];

    if (!coordinates) {
      throw new Error('Unable to get coordinates');
    }

    ctx.session.hotelSearch = {
      coordinates,
      guestsWaiting: false,
      dateWaiting: false
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyboard: Array<any> = [];
    for (let i = 0; i < HOTEL_TYPES.length; i++) {
      const type = HOTEL_TYPES[i];
      keyboard.push([
        Markup.button.callback(
          localization.__({
            locale: user.language,
            phrase: `hotels.types.${type}`
          }),
          `type:${i}`
        )
      ]);
    }

    await ctx.editMessageText(
      localization.__({
        locale: user.language,
        phrase: 'hotels.search.choose-type'
      }),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup
      }
    );
  } catch (error) {
    const errorMessage = (error as Error).message;
    replyWithError(ctx, errorMessage);
    Logger.error(errorMessage);
  }
});

searchHotel.action(/type:\d+/i, async ctx => {
  try {
    if (!ctx.session.hotelSearch) {
      throw new Error('Search data not found');
    }

    if (!ctx.session.userInstance || !ctx.from || !ctx.callbackQuery) {
      throw new Error('User not found');
    }

    const user = ctx.session.userInstance;

    const rawData = /:(\d+)$/i.exec(ctx.callbackQuery['data']);
    if (!rawData) {
      throw new Error('Error while receiving information');
    }
    const parsedData = +rawData[1];

    ctx.session.hotelSearch.type = parsedData;

    await ctx.editMessageText(
      localization.__({
        locale: user.language,
        phrase: 'hotels.search.set-guests'
      }),
      {
        parse_mode: 'HTML'
      }
    );

    ctx.session.hotelSearch.guestsWaiting = true;
  } catch (error) {
    const errorMessage = (error as Error).message;
    replyWithError(ctx, errorMessage);
    Logger.error(errorMessage);
  }
});

searchHotel.on(
  message('text'),
  async (ctx, next) => {
    try {
      if (!ctx.session.hotelSearch) {
        throw new Error('Search data not found');
      }

      if (!ctx.session.hotelSearch.guestsWaiting) {
        next();
        return;
      }

      if (!ctx.session.userInstance || !ctx.from) {
        throw new Error('User not found');
      }

      const user = ctx.session.userInstance;

      const guestsAmount = +ctx.message.text;
      if (Number.isNaN(guestsAmount) || guestsAmount <= 0) {
        throw new Error('hotels.errors.guests-amount');
      }

      ctx.session.hotelSearch.guests = [
        {
          adults: guestsAmount,
          children: []
        }
      ];

      ctx.session.hotelSearch.guestsWaiting = false;
      ctx.session.hotelSearch.dateWaiting = true;

      await ctx.reply(
        localization.__({
          locale: user.language,
          phrase: 'hotels.search.set-date'
        }),
        {
          parse_mode: 'HTML'
        }
      );
    } catch (error) {
      const errorMessage = (error as Error).message;
      deleteMessage(ctx);
      popup(
        ctx,
        errorMessage.startsWith('hotels')
          ? localization.__({
              phrase: errorMessage,
              locale: ctx.from.language_code === 'ru' ? 'ru' : 'en'
            })
          : errorMessage
      );
      Logger.error(errorMessage);
    }
  },
  async ctx => {
    try {
      if (!ctx.session.hotelSearch) {
        throw new Error('Search data not found');
      }

      if (!ctx.session.hotelSearch.dateWaiting) {
        return;
      }

      if (!ctx.session.userInstance || !ctx.from) {
        throw new Error('User not found');
      }

      const rawData = /(\d{4}-\d{1,2}-\d{1,2})\s+(\d{4}-\d{1,2}-\d{1,2})/i.exec(
        ctx.message.text
      );

      if (!rawData) {
        throw new Error('hotels.errors.date-form');
      }

      const fromDate = getDateFromString(rawData[1]);
      const toDate = getDateFromString(rawData[2]);

      if (fromDate >= toDate || toDate.getDate() - fromDate.getDate() < 1) {
        throw new Error('hotels.errors.date-order');
      }

      if (fromDate.getDate() <= new Date().getDate()) {
        throw new Error('hotels.errors.date-shift');
      }

      ctx.session.hotelSearch.checkInDate = toISODate(fromDate);
      ctx.session.hotelSearch.checkOutDate = toISODate(toDate);

      console.log('From: ' + fromDate.toLocaleString('ru-RU'));

      ctx.session.hotelSearch.dateWaiting = false;

      ctx.session.hotelsList = undefined;
      ctx.scene.enter('hotels-list');
    } catch (error) {
      deleteMessage(ctx);
      const errorMessage = (error as Error).message;
      popup(
        ctx,
        errorMessage.startsWith('hotels')
          ? localization.__({
              phrase: errorMessage,
              locale: ctx.from.language_code === 'ru' ? 'ru' : 'en'
            })
          : errorMessage
      );
      Logger.error(errorMessage);
    }
  }
);

function getDateFromString(date: string): Date {
  try {
    const parts = date.split('-');
    const year = +parts[0];
    const month = +parts[1];
    const day = +parts[2];

    return new Date(year, month - 1, day);
  } catch {
    throw new Error('hotels.errors.date-error');
  }
}

export default searchHotel;
