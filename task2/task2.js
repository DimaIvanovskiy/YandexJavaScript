'use strict';

/**
 * Телефонная книга
 */
let phoneBook = new Map();

/**
 * Вызывайте эту функцию, если есть синтаксическая ошибка в запросе
 * @param {number} lineNumber – номер строки с ошибкой
 * @param {number} charNumber – номер символа, с которого запрос стал ошибочным
 */
function syntaxError(lineNumber, charNumber) {
    throw new Error(`SyntaxError: Unexpected token at ${lineNumber}:${charNumber}`);
}

/**
 * Выполнение запроса на языке pbQL
 * @param {string} query
 * @returns {string[]} - строки с результатами запроса
 */
function run(query) {
    phoneBook = new Map();
    const result = [];
    const commands = query.split(";");

    if (!query.endsWith(';'))
        syntaxError(commands.length, commands[commands.length - 1].length + 1);

    for (let [i, command] of commands.entries()) {
        if (command !== "") {
            detectCommand(command, i, commands, result);
        }
    }
    return result;
}

const CreateContactCommandPattern = /^Создай контакт (.*?)$/;
const DeleteContactCommandPattern = /^Удали контакт (.+)$/;
const AddPhonesAndEmailsPattern = /^Добавь (телефон \d{10}|почту (\S+?)) ((?:и (?:телефон \d{10}|почту \S+?) )*)для контакта (.+?)$/;
const DeletePhonesAndEmailsPattern = /^Удали (телефон \d{10}|почту (\S+?)) ((?:и (?:телефон \d{10}|почту \S+?) )*)для контакта (.+?)$/;
const ShowDataPattern = /^Покажи (имя|телефоны|почты) ((?:и (?:имя|телефоны|почты) )*)для контактов, где есть (.*?)$/;
const DeleteContactsWithPattern = /^Удали контакты, где есть (.*?)$/;


function createContact(commandString, splittedCommand, phoneBook, commandNumber) {
    if (splittedCommand[1] !== "контакт")
        syntaxError(commandNumber + 1, splittedCommand[0].length + 2);

    const parsedCommand = commandString.match(CreateContactCommandPattern);
    const name = parsedCommand[1];

    if (phoneBook.has(name))
        return;

    phoneBook.set(name, {
        "phones": [],
        "emails": []
    })

}

function deleteContacts(commandString, splittedCommand, phoneBook, commandNumber) {
    if (splittedCommand[1] === "контакт") {
        deleteOneContact(commandString, phoneBook)
    } else if (splittedCommand[1] === "контакты,") {
        deleteDataWith(commandString, splittedCommand, phoneBook, commandNumber)
    } else {
        deletePhonesAndEmails(splittedCommand, commandString, phoneBook, commandNumber)
    }
}

function countLengthBefore(splittedCommand, index) {
    let result = 0;
    for (let i = 0; i <= index; i++) {
        const part = splittedCommand[i];
        result += part.length + 1;
    }
    return result;
}

function deleteDataWith(commandString, splittedCommand, phoneBook, commandNumber) {

    if (splittedCommand[1] !== 'контакты,') {
        syntaxError(commandNumber, countLengthBefore(splittedCommand, 0) + 1);
    }
    if (splittedCommand[2] !== 'где') {
        syntaxError(commandNumber, countLengthBefore(splittedCommand, 1) + 1);
    }
    if (splittedCommand[3] !== 'есть') {
        syntaxError(commandNumber, countLengthBefore(splittedCommand, 2) + 1);
    }


    const parsedCommand = commandString.match(DeleteContactsWithPattern);
    if (parsedCommand == null)
        return;

    const strToFind = parsedCommand[parsedCommand.length - 1];

    if (strToFind === "")
        return;

    const contactsNames = getContactsWith(strToFind, phoneBook);
    for (let contactName of contactsNames) {
        phoneBook.delete(contactName);
    }
}

function deleteOneContact(splittedCommand, phoneBook) {
    const parsedCommand = splittedCommand.match(DeleteContactCommandPattern);
    const name = parsedCommand[1];
    phoneBook.delete(name);
}

function addPhonesAndEmails(splittedCommand, commandString, phoneBook, commandNumber) {
    checkPhonesAndEmails(splittedCommand, commandNumber);
    const parsedCommand = commandString.match(AddPhonesAndEmailsPattern);
    if (parsedCommand == null)
        return;

    const name = parsedCommand[parsedCommand.length - 1];
    if (!phoneBook.has(name))
        return;

    const addCommands = getCommands(parsedCommand, 3);

    for (let command of addCommands) {
        const addCommand = command.split(" ");
        if (addCommand[0] === "телефон") {
            const phone = addCommand[1];
            if (phoneBook.get(name).phones.indexOf(phone) === -1)
                phoneBook.get(name).phones.push(phone);
        }
        if (addCommand[0] === "почту") {
            const email = addCommand[1];
            if (phoneBook.get(name).emails.indexOf(email) === -1)
                phoneBook.get(name).emails.push(email);
        }
    }
}


function checkPhonesAndEmails(splittedCommand, commandNumber) {
    let counter = 1;
    let nextShouldBeData = true;
    let nextShouldBeAnd = false;
    let nextCanBeFor = false;

    while (counter < splittedCommand.length) {
        if (splittedCommand[counter] === "почту" && nextShouldBeData) {
            nextShouldBeData = false;
            nextShouldBeAnd = true;
            nextCanBeFor = true;
            if (splittedCommand[counter + 1] === undefined)
                syntaxError(commandNumber, countLengthBefore(splittedCommand, counter) + 1);
            counter += 2;
        } else if (splittedCommand[counter] === "телефон" && nextShouldBeData) {
            nextShouldBeData = false;
            nextShouldBeAnd = true;
            nextCanBeFor = true;
            const phone = splittedCommand[counter + 1];
            if (phone === undefined || phone.match(/^\d{10}$/) === null)
                syntaxError(commandNumber + 1, countLengthBefore(splittedCommand, counter) + 1);
            counter += 2;

        } else if (splittedCommand[counter] === 'и' && nextShouldBeAnd) {
            nextShouldBeData = true;
            nextShouldBeAnd = false;
            nextCanBeFor = false;
            counter += 1;
        } else if (splittedCommand[counter] === 'для' && nextCanBeFor) {
            if (splittedCommand[counter + 1] === 'контакта')
                break;
            else
                syntaxError(commandNumber + 1, countLengthBefore(splittedCommand, counter) + 1)
        } else {
            syntaxError(commandNumber + 1, countLengthBefore(splittedCommand, counter - 1) + 1)
        }
    }
}


function deletePhonesAndEmails(splittedCommand, commandString, phoneBook, commandNumber) {
    checkPhonesAndEmails(splittedCommand, commandNumber);

    const parsedCommand = commandString.match(DeletePhonesAndEmailsPattern);
    const name = parsedCommand[parsedCommand.length - 1];
    if (!phoneBook.has(name))
        return;

    const deleteCommands = getCommands(parsedCommand, 3);
    for (let command of deleteCommands) {
        const addCommand = command.split(" ");
        if (addCommand[0] === "телефон") {
            const phone = addCommand[1];
            const phoneIndex = phoneBook.get(name).phones.indexOf(phone);
            if (phoneIndex !== -1) {
                phoneBook.get(name).phones.splice(phoneIndex, 1);
            }
        }
        if (addCommand[0] === "почту") {
            const email = addCommand[1];
            const emailIndex = phoneBook.get(name).emails.indexOf(email);
            if (emailIndex !== -1) {
                phoneBook.get(name).emails.splice(emailIndex, 1);
            }
        }
    }
}

function checkDataRequest(splittedCommand, commandNumber) {
    let counter = 1;

    let nextCanBeFor = false;

    while (counter < splittedCommand.length) {
        if (counter % 2 === 1 && (splittedCommand[counter] === 'имя' || splittedCommand[counter] === 'почты' ||
            splittedCommand[counter] === 'телефоны')) {
            counter += 1;
            nextCanBeFor = true
        } else if (counter % 2 === 0 && splittedCommand[counter] === 'и') {
            counter += 1;
            nextCanBeFor = false
        } else if (splittedCommand[counter] === 'для' && nextCanBeFor) {
            counter += 1;
            break;
        } else {
            syntaxError(commandNumber + 1, countLengthBefore(splittedCommand, counter - 1) + 1)
        }
    }
    if (splittedCommand[counter] !== 'контактов,') {
        syntaxError(commandNumber + 1, countLengthBefore(splittedCommand, counter-1) + 1);
    }
    counter += 1;
    if (splittedCommand[counter] !== 'где') {
        syntaxError(commandNumber + 1, countLengthBefore(splittedCommand, counter-1) + 1);
    }
    counter += 1;
    if (splittedCommand[counter] !== 'есть') {
        syntaxError(commandNumber + 1, countLengthBefore(splittedCommand, counter-1) + 1);
    }

}

function returnDataWith(splittedCommand, commandString, phoneBook, commandNumber) {
    checkDataRequest(splittedCommand, commandNumber);
    const result = [];
    const parsedCommand = commandString.match(ShowDataPattern);
    if (parsedCommand == null)
        return;

    const strToFind = parsedCommand[parsedCommand.length - 1];
    if (strToFind === "")
        return;
    const showCommands = getCommands(parsedCommand, 2);
    const contactsNames = getContactsWith(strToFind, phoneBook);

    for (let contactName of contactsNames) {
        const contact = phoneBook.get(contactName);
        let showResult = "";
        for (let i = 0; i < showCommands.length; i++) {
            let showCommand = showCommands[i];

            if (i !== 0)
                showResult += ";";

            if (showCommand === 'имя') {
                showResult += contactName
            }

            if (showCommand === 'почты') {
                showResult += contact.emails.join(',')
            }

            if (showCommand === 'телефоны') {
                showResult += contact.phones.map(element => formatPhone(element)).join(',');
            }
        }
        result.push(showResult)
    }
    return result;
}

function getCommands(parsedCommand, andIndex) {
    let commands = [];
    if (parsedCommand[andIndex] !== undefined && parsedCommand[andIndex] !== "") {
        const parseLength = parsedCommand[andIndex].length;
        commands = parsedCommand[andIndex].substring(0, parseLength - 1).slice(2).split(" и ");
    }
    commands.unshift(parsedCommand[1]);
    return commands;
}

function getContactsWith(strToFind, phoneBook) {
    let contacts = [];
    for (let [name, contact] of phoneBook.entries()) {
        if (name.includes(strToFind) ||
            contact.emails.some(element => element.includes(strToFind)) ||
            contact.phones.some(element => element.includes(strToFind))) {
            contacts.push(name);
        }
    }
    return contacts;
}

function formatPhone(phoneNumber) {
    return `+7 (${phoneNumber.substr(0, 3)}) ${phoneNumber.substr(3, 3)}-${phoneNumber.substr(6, 2)}-${phoneNumber.substr(8, 2)}`
}

function detectCommand(commandString, commandNumber, commands, result) {
    const splittedCommand = commandString.split(" ");

    if (splittedCommand[0] === "Создай") {
        createContact(commandString, splittedCommand, phoneBook, commandNumber);
    } else if (splittedCommand[0] === "Удали") {
        deleteContacts(commandString, splittedCommand, phoneBook, commandNumber)
    } else if (splittedCommand[0] === "Добавь") {
        addPhonesAndEmails(splittedCommand, commandString, phoneBook, commandNumber)
    } else if (splittedCommand[0] === "Покажи") {
        const commandResult = returnDataWith(splittedCommand, commandString, phoneBook, commandNumber);
        if (commandResult !== null && commandResult !== undefined) {
            for (let element of commandResult)
                result.push(element)
        }
    } else {
        syntaxError(commandNumber + 1, 1);
    }
}

module.exports = {phoneBook, run};