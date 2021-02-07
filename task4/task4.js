/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {
    const events = new Map();

    return {

        /**
         * Подписаться на событие
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param times
         * @param frequency
         */
        on: function (event, context, handler, times = null, frequency = null) {
            if (times !== null && times <= 0) {
                times = null;
            }
            if (frequency !== null && frequency <= 0) {
                frequency = null;
            }

            if (!events.has(event)) {
                events.set(event, []);
            }
            const currentHandlers = events.get(event);
            currentHandlers.push({
                handler,
                context,
                times,
                frequency,
                'time': 0
            });
            return this;
        },

        /**
         * Отписаться от события
         * @param {String} event
         * @param {Object} context
         */
        off: function (event, context) {
            for (let e of events.keys()) {
                if (e.startsWith(event + '.') || e === event) {
                    const handlers = events.get(e);
                    for (let handler of handlers) {
                        if (handler.context === context) {
                            const index = handlers.indexOf(handler);
                            if (index !== -1) {
                                handlers.splice(index, 1);
                            }
                        }
                    }
                }
            }
            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} event
         */
        emit: function (event) {
            const eventParts = event.split('.');

            while (eventParts.length > 0) {
                const currentEvent = eventParts.join('.');

                if (events.has(currentEvent)) {
                    const handlers = events.get(currentEvent);
                    for (let handler of handlers) {
                        if (handler.times === null && handler.frequency === null) {
                            handler.handler.call(handler.context);
                        } else if (handler.times !== null && handler.times > 0) {
                            handler.times -= 1;
                            handler.handler.call(handler.context);
                        } else if (handler.frequency !== null) {

                            if (handler.time % handler.frequency === 0)
                                handler.handler.call(handler.context);
                            handler.time += 1;
                        }
                    }
                }
                eventParts.pop();
            }

            return this;
        },

        /**
         * Подписаться на событие с ограничением по количеству полученных уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} times – сколько раз получить уведомление
         */
        several: function (event, context, handler, times) {
            this.on(event, context, handler, times);
            return this;
        },

        /**
         * Подписаться на событие с ограничением по частоте получения уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} frequency – как часто уведомлять
         */
        through: function (event, context, handler, frequency) {
            this.on(event, context, handler, null, frequency);
            return this;
        }
    };
}

module.exports = {
    getEmitter
};