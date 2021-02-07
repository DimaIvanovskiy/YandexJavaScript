'use strict';

const fetch = require('node-fetch');

const API_KEY = require('./key.json');

/**
 * @typedef {object} TripItem Город, который является частью маршрута.
 * @property {number} geoid Идентификатор города
 * @property {number} day Порядковое число дня маршрута
 */

class TripBuilder {

  geoids = [];
  expectedWeather = [];
  maxDays = Number.MAX_VALUE;
  daysCount = 0;

  constructor(geoids) {
    this.geoids = geoids;
  }

  /**
   * Метод, добавляющий условие наличия в маршруте
   * указанного количества солнечных дней
   * Согласно API Яндекс.Погоды, к солнечным дням
   * можно приравнять следующие значения `condition`:
   * * `clear`;
   * * `partly-cloudy`.
   * @param {number} daysCount количество дней
   * @returns {object} Объект планировщика маршрута
   */
  sunny(daysCount) {
    for (let i = 0; i < daysCount; i++) {
      this.expectedWeather.push("sunny");
    }
    this.daysCount += daysCount;
    return this;
  }

  /**
   * Метод, добавляющий условие наличия в маршруте
   * указанного количества пасмурных дней
   * Согласно API Яндекс.Погоды, к солнечным дням
   * можно приравнять следующие значения `condition`:
   * * `cloudy`;
   * * `overcast`.
   * @param {number} daysCount количество дней
   * @returns {object} Объект планировщика маршрута
   */
  cloudy(daysCount) {
    for (let i = 0; i < daysCount; i++) {
      this.expectedWeather.push("cloudy");
    }
    this.daysCount += daysCount;
    return this;
  }

  /**
   * Метод, добавляющий условие максимального количества дней.
   * @param {number} daysCount количество дней
   * @returns {object} Объект планировщика маршрута
   */
  max(daysCount) {
    this.maxDays = daysCount;
    return this;
  }

  /**123
   * Метод, возвращающий Promise с планируемым маршрутом.
   * @returns {Promise<TripItem[]>} Список городов маршрута
   */

  build() {
    const allRequests = this.geoids.map(geoid => fetch(
      `https://api.weather.yandex.ru/v2/forecast?geoid=${geoid}&hours=false&limit=7`, {
        headers: {
          "X-Yandex-API-Key": API_KEY.key
        }
      }));

    return Promise.all(allRequests)
      .then(responses => Promise.all(responses.map(r => r.json())))
      .then(responses => responses.map(r => this.getWeather(r)))
      .then(weathers => this.planTrip(weathers))
      .catch((error) => {
        console.info(error);
        throw new Error("Не могу построить маршрут!")
      })
  }

  getWeather(object) {
    return object['forecasts']
      .map(forecast => forecast['parts']['day_short']['condition'])
      .map(w => {
        if (w === 'clear' || w === 'partly-cloudy')
          return {
            'weather': 'sunny',
            'geoid': object['info']['geoid']
          };
        if (w === 'cloudy' || w === 'overcast')
          return {
            'weather': 'cloudy',
            'geoid': object['info']['geoid']
          };

        return {
          'weather': null,
          'geoid': object['info']['geoid']
        };
      });
  }

  planTrip(weathers) {
    const weathersForCity = new Map();
    for (let weather of weathers) {
      for (let w of weather) {
        if (!weathersForCity.has(w.geoid))
          weathersForCity.set(w.geoid, []);
        weathersForCity.get(w.geoid).push(w.weather);
      }
    }

    const result = [];
    const queue = [];
    queue.push([]);
    while (queue.length !== 0) {
      const currentPath = queue.pop();
      if (currentPath.length === this.expectedWeather.length) {
        result.push(currentPath);
        continue;
      }

      for (let city of Array.from(weathersForCity.keys()).filter(c => currentPath.indexOf(c) === -1 ||
        currentPath.length !== 0 && c === currentPath[currentPath.length - 1])) {
        const day = currentPath.length;
        if (this.expectedWeather[day] === weathersForCity.get(city)[day]) {
          const newPath = [...currentPath];
          newPath.push(city);
          if (this.countDaysInOneCity(newPath) > this.maxDays)
            continue;
          queue.unshift(newPath);
        }
      }
    }

    return this.findAnswer(result);
  }

  findAnswer(paths) {
    if (paths.length === 0)
      throw new Error("Не могу построить маршрут!");

    let max = 0;
    let result = null;
    for (let path of paths) {
      const days = this.countDaysInOneCity(path);
      if (days > max) {
        result = path;
        max = days;
      }
    }

    const answer = [];
    for (let i = 0; i < result.length; i++) {
      answer.push({
        'day': i + 1,
        'geoid': result[i]
      })
    }
    return answer;
  }

  countDaysInOneCity(path) {
    const result = new Map();
    for (let city of path) {
      if (result.has(city))
        result.set(city, result.get(city) + 1);
      else
        result.set(city, 1);
    }
    return Math.max(...result.values());
  }
}

/**1234
 * Фабрика для получения планировщика маршрута.
 * Принимает на вход список идентификаторов городов, а
 * возвращает планировщик маршрута по данным городам.
 *
 * @param {number[]} geoids Список идентификаторов городов
 * @returns {TripBuilder} Объект планировщика маршрута
 * @see https://yandex.ru/dev/xml/doc/dg/reference/regions-docpage/
 */
function planTrip(geoids) {
  return new TripBuilder(geoids);
}

module.exports = {
  planTrip
};
