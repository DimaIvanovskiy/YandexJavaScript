'use strict';


function sortFriends(friends, maxLevel = null) {
    if (maxLevel !== null && maxLevel <= 0)
        return [];

    const levels = new Map();
    const addedNames = new Set();

    const bestFriends = friends
        .filter(friend => friend.best)
        .sort((a, b) => a.name.localeCompare(b.name));

    levels.set(1, bestFriends);

    for (let bf of bestFriends) {
        addedNames.add(bf.name);
    }


    let currentLevel = 1;

    while (levels.get(currentLevel).length !== 0) {
        const currentLevelFriends = levels.get(currentLevel);

        currentLevel += 1;
        if (!levels.has(currentLevel))
            levels.set(currentLevel, []);

        for (let friend of currentLevelFriends) {
            for (let friendName of friend.friends) {
                if (!addedNames.has(friendName)) {
                    addedNames.add(friendName);
                    levels.get(currentLevel).push(friends.find(f => f.name === friendName))
                }
            }
        }

        levels.get(currentLevel).sort((a, b) => a.name.localeCompare(b.name))
    }

    if (maxLevel === null)
        maxLevel = Math.max(...levels.keys());

    const result = [];
    for (let level of levels.keys()) {
        if (level <= maxLevel)
            for (let el of levels.get(level))
                result.push(el);
    }
    return result;
}

/**
 * Итератор по друзьям
 * @constructor
 * @param {Object[]} friends
 * @param {Filter} filter
 */
function Iterator(friends, filter) {
    this.friends = filter.filter(sortFriends(friends));
}

Iterator.prototype.done = function () {
    return this.friends.length === 0;
};

Iterator.prototype.next = function () {
    if (!this.done()) {
        return this.friends.shift();
    }

    return null;
};


/**
 * Итератор по друзям с ограничением по кругу
 * @extends Iterator
 * @constructor
 * @param {Object[]} friends
 * @param {Filter} filter
 * @param {Number} maxLevel – максимальный круг друзей
 */
function LimitedIterator(friends, filter, maxLevel) {
    if (maxLevel < 0)
        maxLevel = 0;

    this.friends = filter.filter(sortFriends(friends, maxLevel));
}

LimitedIterator.prototype = Object.create(Iterator.prototype);
LimitedIterator.prototype.constructor = Iterator;


/**
 * Фильтр друзей
 * @constructor
 */
function Filter() {
}

Filter.prototype.filter = function (friends) {
    return friends;
};


/**
 * Фильтр друзей
 * @extends Filter
 * @constructor
 */
function MaleFilter() {
}

MaleFilter.prototype = Object.create(Filter.prototype);
MaleFilter.prototype.constructor = MaleFilter;
MaleFilter.prototype.filter = function (friends) {
    return friends.filter(friend => friend.gender === 'male');
};


/**
 * Фильтр друзей-девушек
 * @extends Filter
 * @constructor
 */
function FemaleFilter() {
    // code
}

FemaleFilter.prototype = Object.create(Filter.prototype);
FemaleFilter.prototype.constructor = FemaleFilter;
FemaleFilter.prototype.filter = function (friends) {
    return friends.filter(friend => friend.gender === 'female');
};


exports.Iterator = Iterator;
exports.LimitedIterator = LimitedIterator;

exports.Filter = Filter;
exports.MaleFilter = MaleFilter;
exports.FemaleFilter = FemaleFilter;