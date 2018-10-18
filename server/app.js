// Slack, Viber, Facebook msgr, Mail
//
const uuid = require('uuid/v4');

const Router = require('koa-router');
const koaBody = require('koa-body');

const Koa = require('koa');
const app = module.exports = new Koa();

const Telegram = require('./lib/telegram');
const DbWrapper = require('./lib/dbWrapper');
const db = new DbWrapper();
const chatProvider = {};

const find = async function (uuid) {
  let data = await db.findOne({
    uuid: uuid
  });
  if (data === null) {
    return null;
  }
  let provider = chatProvider[data.type];
  return provider.sendMessage.bind(provider, data.chatId);
}

chatProvider['tg'] = new Telegram(db);
app.use(koaBody());

const router = Router({
  prefix: '/api'
});

router.post('/notify', notify);

async function notify(ctx) {
  // http POST localhost:3001/api/notify userUuid="063c68ca-9a6a-43eb-9ee2-dd3cf2f6fb21" message="Program has finished"
  // http POST https://ice2heart.com/api/notify userUuid="063c68ca-9a6a-43eb-9ee2-dd3cf2f6fb21" message="Program has finished"
  let userUuid = ctx.request.body['userUuid'];
  let message = ctx.request.body['message'];
  let messageFnc = await find(userUuid);
  if (!messageFnc) {
    return;
  }
  ctx.body = messageFnc(message);
}

app.use(router.routes());

if (!module.parent) app.listen(3000);