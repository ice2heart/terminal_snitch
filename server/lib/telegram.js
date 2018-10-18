const TelegramBot = require('node-telegram-bot-api');
const uuid = require('uuid/v4');

const token = process.env.TELEGRAM_TOKEN;

if (token == undefined) {
    console.error("Telegram token not found!");
    process.exit(1);
}

class Telegram {
    constructor(db) {
        this.db = db;
        // Create a bot that uses 'polling' to fetch new updates
        this.bot = new TelegramBot(token, {
            polling: true
        });
        // Matches "/config"
        this.bot.onText(/\/config/, async (msg, match) => {
            const chatId = msg.chat.id;
            const upsertInfo = await this.db.findOrInsert({
                chatId: chatId,
                type: 'tg'
            }, {
                $set: {
                    uuid: uuid()
                }
            });
            console.log(upsertInfo);

            this.bot.sendMessage(chatId, `You user id is ${upsertInfo.data.uuid}`);
        });
        this.bot.onText(/\/delete/, async (msg, match) => {
            const num = await this.db.delete({
                chatId: msg.chat.id,
                type: 'tg'
            });
            this.bot.sendMessage(msg.chat.id, `${num} users is deleted...`);
        });

    }
    async sendMessage(chatId, message) {
        let result = await this.bot.sendMessage(chatId, message).catch((err) => {
            console.log(err);
        });
        // add resolving and beutiful responce
        return JSON.stringify(result);
    }
}

module.exports = Telegram;