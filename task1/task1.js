'use strict';

/**
 * Складывает два целых числа
 * @param {Number} a Первое целое
 * @param {Number} b Второе целое
 * @throws {TypeError} Когда в аргументы переданы не числа
 * @returns {Number} Сумма аргументов
 */
function abProblem(a, b) {
    if (typeof (a) !== 'number' || typeof (b) !== 'number') {
        throw new TypeError("a and b should be numbers");
    }
    return a + b;
}

/**
 * Определяет век по году
 * @param {Number} year Год, целое положительное число
 * @throws {TypeError} Когда в качестве года передано не число
 * @throws {RangeError} Когда год – отрицательное значение
 * @returns {Number} Век, полученный из года
 */
function centuryByYearProblem(year) {
    if (typeof (year) !== 'number') {
        throw new TypeError("Year should be number");
    }
    if (year <= 0) {
        throw new RangeError("Year should not be negative");
    }
    return Math.ceil(year / 100);
}

/**
 * Переводит цвет из формата HEX в формат RGB
 * @param {String} hexColor Цвет в формате HEX, например, '#FFFFFF'
 * @throws {TypeError} Когда цвет передан не строкой
 * @throws {RangeError} Когда значения цвета выходят за пределы допустимых
 * @returns {String} Цвет в формате RGB, например, '(255, 255, 255)'
 */

const HexPattern = /^#[0-9A-Fa-f]{6}$/;

function colorsProblem(hexColor) {
    if (typeof (hexColor) !== 'string') {
        throw new TypeError("HexColor should be string");
    }
    if (!hexColor.match(HexPattern)) {
        throw new RangeError("HexColor should be in HEX format: #[0-9A-Fa-f]{6}");
    }

    const rNumber = parseHexPart(hexColor, 1, 3);
    const gNumber = parseHexPart(hexColor, 3, 5);
    const bNumber = parseHexPart(hexColor, 5, 7);
    return `(${rNumber}, ${gNumber}, ${bNumber})`;
}

function parseHexPart(hexColor, start, end) {
    const hexPart = hexColor.slice(start, end);
    return parseInt(hexPart, 16).toString();
}


/**
 * Находит n-ое число Фибоначчи
 * @param {Number} n Положение числа в ряде Фибоначчи
 * @throws {TypeError} Когда в качестве положения в ряде передано не число
 * @throws {RangeError} Когда положение в ряде не является целым положительным числом
 * @returns {Number} Число Фибоначчи, находящееся на n-ой позиции
 */
function fibonacciProblem(n) {
    if (typeof (n) !== 'number') {
        throw new TypeError("n should be number");
    }
    if (!Number.isInteger(n) || n <= 0) {
        throw new RangeError("n should be integer and positive");
    }

    if (n === 1)
        return 1;

    let first = 1;
    let second = 1;
    let numbersCount = 2;
    while (numbersCount !== n) {
        const newNumber = first + second;
        first = second;
        second = newNumber;
        numbersCount += 1;
    }

    return second;
}

/**
 * Транспонирует матрицу
 * @param {(Any[])[]} matrix Матрица размерности MxN
 * @throws {TypeError} Когда в функцию передаётся не двумерный массив
 * @returns {(Any[])[]} Транспонированная матрица размера NxM
 */
function matrixProblem(matrix) {
    if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0]))
        throw new TypeError("Matrix should be array of arrays");

    const m = matrix.length;
    const n = matrix[0].length;

    for (let i = 0; i < m; i++) {
        if (!Array.isArray(matrix[i]) || matrix[i].length !== n)
            throw new TypeError("Matrix should be array of arrays with equal lengths");
    }

    const result = [];
    for (let i = 0; i < n; i++) {
        result.push([]);
        for (let j = 0; j < m; j++) {
            result[i].push(matrix[j][i]);
        }
    }

    return result;
}

/**
 * Переводит число в другую систему счисления
 * @param {Number} n Число для перевода в другую систему счисления
 * @param {Number} targetNs Система счисления, в которую нужно перевести (Число от 2 до 36)
 * @throws {TypeError} Когда переданы аргументы некорректного типа
 * @throws {RangeError} Когда система счисления выходит за пределы значений [2, 36]
 * @returns {String} Число n в системе счисления targetNs
 */
function numberSystemProblem(n, targetNs) {
    if (typeof (n) !== 'number' || typeof (targetNs) !== 'number') {
        throw new TypeError("n and targetNs should be numbers");
    }
    if (targetNs < 2 || targetNs > 36) {
        throw new RangeError("targetNs should be from 2 to 36");
    }

    return n.toString(targetNs);
}

/**
 * Проверяет соответствие телефонного номера формату
 * @param {String} phoneNumber Номер телефона в формате '8–800–xxx–xx–xx'
 * @throws {TypeError} Когда в качестве аргумента передаётся не строка
 * @returns {Boolean} Если соответствует формату, то true, а иначе false
 */

const PhonePattern = /^8-800-[0-9]{3}-[0-9]{2}-[0-9]{2}$/;

function phoneProblem(phoneNumber) {
    if (typeof (phoneNumber) !== 'string') {
        throw new TypeError("PhoneNumber should be string");
    }
    return phoneNumber.match(PhonePattern) !== null;
}

/**
 * Определяет количество улыбающихся смайликов в строке
 * @param {String} text Строка в которой производится поиск
 * @throws {TypeError} Когда в качестве аргумента передаётся не строка
 * @returns {Number} Количество улыбающихся смайликов в строке
 */
function smilesProblem(text) {
    if (typeof (text) !== 'string') {
        throw new TypeError("Text should be string");
    }
    return [...text.matchAll(SmilePattern)].length;
}

const SmilePattern = /(\(-:)|(:-\))/g;

/**
 * Определяет победителя в игре "Крестики-нолики"
 * Тестами гарантируются корректные аргументы.
 * @param {(('x' | 'o')[])[]} field Игровое поле 3x3 завершённой игры
 * @returns {'x' | 'o' | 'draw'} Результат игры
 */
function ticTacToeProblem(field) {
    const tickIsWinner = isWinner(field, 'x');
    const toeIsWinner = isWinner(field, 'o');

    if (tickIsWinner && toeIsWinner || !tickIsWinner && !toeIsWinner) {
        return 'draw';
    }
    if (tickIsWinner)
        return 'x';

    return 'o';
}

function isWinner(field, symbol) {
    const horizontalStarts = [[0, 0], [0, 1], [0, 2]];
    const verticalStarts = [[0, 0], [1, 0], [2, 0]];
    return isWinnerFromStarts(field, symbol, horizontalStarts, 1, 0) ||
        isWinnerFromStarts(field, symbol, verticalStarts, 0, 1) ||
        isWinnerFromStarts(field, symbol, [[0, 0]], 1, 1) ||
        isWinnerFromStarts(field, symbol, [[0, 2]], 1, -1);
}

function isWinnerFromStarts(field, symbol, starts, dy, dx) {
    const cellsToCheck = Array.from(starts, start => [
        field[start[0]] [start[1]],
        field[start[0] + dy] [start[1] + dx],
        field[start[0] + 2 * dy] [start[1] + 2 * dx],
    ]);
    for (let cells of cellsToCheck) {
        if (cells.every(element => element === symbol))
            return true;
    }
    return false;
}


module.exports = {
    abProblem,
    centuryByYearProblem,
    colorsProblem,
    fibonacciProblem,
    matrixProblem,
    numberSystemProblem,
    phoneProblem,
    smilesProblem,
    ticTacToeProblem
};