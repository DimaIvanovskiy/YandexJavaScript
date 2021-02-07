'use strict';

const days = new Map([
    ["ПН", 0],
    ["ВТ", 1],
    ["СР", 2],
    ["ЧТ", 3],
    ["ПТ", 4],
    ["СБ", 5],
    ["ВС", 6]
]);


class Time {
    static timePattern = new RegExp(/^(?:(ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС) )*(\d{2}):(\d{2})\+(\d{1,2})$/);

    static parse(stringTime, defaultTimeZone = 0, isDefault = false) {

        this.defaultTimezone = defaultTimeZone;
        const timeMatch = stringTime.match(this.timePattern);

        const timeZone = parseInt(timeMatch[4]);
        const minute = parseInt(timeMatch[3]);

        let hourFromString;

        if (isDefault) {
            hourFromString = parseInt(timeMatch[2]);
        } else {
            hourFromString = parseInt(timeMatch[2]) - timeZone + defaultTimeZone;
        }

        const hour = (hourFromString + 24) % 24;

        let day;
        if (hourFromString >= 24) {
            day = days.get(timeMatch[1]) + 1;
        } else if (hourFromString < 0) {
            day = days.get(timeMatch[1]) - 1;
        } else {
            day = days.get(timeMatch[1]);
        }
        return new Time(timeZone, day, hour, minute, defaultTimeZone);
    }

    constructor(timezone, day, hour, minute, defaultTimezone = timezone) {
        this.timezone = timezone;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.defaultTimezone = defaultTimezone;
    }

    toMinutes() {
        if (this.allMinutes === undefined)
            this.allMinutes = this.day * 24 * 60 + this.hour * 60 + this.minute;

        return this.allMinutes;
    }

    numberToString(num) {
        if (num > 9)
            return num.toString();
        return `0${num}`;
    }

    format(stringFormat) {
        let hour = this.hour;
        let day;

        for (let [key, value] of days.entries()) {
            if (value === this.day)
                day = key;
        }
        return stringFormat.replace(/%DD/g, day)
            .replace(/%HH/g, this.numberToString(hour))
            .replace(/%MM/g, this.numberToString(this.minute))
    }
}

function findTime(gangSchedule, duration, bankWorkingHours) {
    const workingHours = {
        from: Time.parse(bankWorkingHours.from, 0, true),
        to: Time.parse(bankWorkingHours.to, 0, true)
    };

    const bankTimezone = workingHours.from.timezone;

    const forbiddenTime = [];
    for (let key in gangSchedule) {
        const list = gangSchedule[key];
        for (let time of list) {
            forbiddenTime.push({
                "from": Time.parse(time.from, bankTimezone),
                "to": Time.parse(time.to, bankTimezone),
            });
        }
    }

    for (let i = 0; i < 3; i++) {
        forbiddenTime.push({
            "from": new Time(bankTimezone, i, 0, 0),
            "to": new Time(bankTimezone, i, workingHours.from.hour, workingHours.from.minute)
        });

        forbiddenTime.push({
            "from": new Time(bankTimezone, i, workingHours.to.hour, workingHours.to.minute),
            "to": new Time(bankTimezone, i, 23, 59),
        });
    }

    const allTimes = [];
    for (let time of forbiddenTime) {
        allTimes.push({
            time: time.from,
            isStart: true
        });
        allTimes.push({
            time: time.to,
            isStart: false
        });
    }

    allTimes.sort(compareTime);

    let counter = 0;
    let currentStart = null;

    for (let time of allTimes) {
        if (time.isStart) {
            counter += 1;
            if (currentStart !== null) {
                const diff = time.time.toMinutes() - currentStart.time.toMinutes();
                if (diff >= duration)
                    return currentStart.time;
                currentStart = null;
            }
        } else {
            counter -= 1;
            if (counter === 0) {
                currentStart = time;
            }
        }
    }

    return null;
}

function compareTime(a, b) {
    if (a.time.toMinutes() > b.time.toMinutes())
        return 1;

    if (b.time.toMinutes() > a.time.toMinutes())
        return -1;

    if (!a.isStart && b.isStart)
        return 1;

    if (!b.isStart && a.isStart)
        return 1;

    return 0;
}

/**
 * @param {Object} schedule Расписание Банды
 * @param {number} duration Время на ограбление в минутах
 * @param {Object} workingHours Время работы банка
 * @param {string} workingHours.from Время открытия, например, "10:00+5"
 * @param {string} workingHours.to Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {

    let time = findTime(schedule, duration, workingHours);
    let isAdditional = false;
    return {
        /**
         * Найдено ли время
         * @returns {boolean}
         */
        exists() {
            return time !== null;
        },

        /**
         * Возвращает отформатированную строку с часами
         * для ограбления во временной зоне банка
         *
         * @param {string} template
         * @returns {string}
         *
         * @example
         * ```js
         * getAppropriateMoment(...).format('Начинаем в %HH:%MM (%DD)') // => Начинаем в 14:59 (СР)
         * ```
         */
        format(template) {
            if (time === null) {
                return "";
            }
            return time.format(template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @note Не забудь при реализации выставить флаг `isExtraTaskSolved`
         * @returns {boolean}
         */
        tryLater() {
            const newSchedule = JSON.parse(JSON.stringify(schedule));
            if (newSchedule["additional"] === undefined) {
                newSchedule["additional"] = []
            }


            let end = time.toMinutes() + duration + 30;
            if (isAdditional) {
                end = time.toMinutes() + 30;
            }

            const endDay = Math.floor(end/(60*24));
            const endHour = Math.floor((end % (60*24)) / 60);
            const endMinute = end - endDay * 60 * 24 - endHour * 60;

            const toString = new Time(time.timezone, endDay, endHour, endMinute)
                .format(`%DD %HH:%MM+${time.defaultTimezone}`);
            const fromString = time.format(`%DD %HH:%MM+${time.defaultTimezone}`);
            newSchedule["additional"].push({
                from: fromString,
                to: toString
            });

            const newTime = findTime(newSchedule, duration, workingHours);

            if (newTime === null || newTime.day > 2)
                return false;

            time = newTime;
            schedule = newSchedule;
            isAdditional = true;
            return true;
        }
    };
}


module.exports = {
    getAppropriateMoment
};
