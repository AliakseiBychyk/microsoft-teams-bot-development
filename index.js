const builder = require('botbuilder');
const builderTeams = require('botbuilder-teams');
const restify = require('restify');
const githubClient = require('./githubClient');
const config = require('./secret/config.json');

const appId = process.env.appId || config.appId;
const appPassword = process.env.appPassword || config.appPassword;

console.log(appId);
console.log(appPassword);

const connector = new builderTeams.TeamsChatConnector(
  {
    appId,
    appPassword,
  }
);

const inMemoryStorage = new builder.MemoryBotStorage;

const dialog = new builder.IntentDialog();

const bot = new builder.UniversalBot(connector, dialog)
  .set('storage', inMemoryStorage);

dialog.matches(/^search/i, [
  function(session, args, next) {
    if (session.message.text.toLowerCase() === 'search') {
      builder.Prompts.text(session, 'Who are you looking for?');
    } else {
      const query = session.message.text.substring(7);
      next({response: query});
    }
  },
  function(session, result, next) {
    const query = result.response;
    if (!query) {
      session.endDialog('Request cancelled');
    } else {
      githubClient.executeSearch(query, profiles => {
        const totalCount = profiles.total_count;
        if (totalCount === 0) {
          session.endDialog('Sorry, no results found.');
        } else if (totalCount > 10) {
          session.endDialog('More than 10 results were found. Please provide a more restricted query.');
        } else {
          session.dialogData.property = null;
          const usernames = profiles.items.map(item => item.login);
          builder.Prompts.choice(session, 'What user do you want to load?', usernames);
        }
      });
    }
  },
  function(session, result, next) {
    const username = result.response.entity;
    githubClient.loadProfile(username, profile => {
      const card = new builder.ThumbnailCard(session);
      card.title(profile.login);
      card.images([builder.CardImage.create(session, profile.avatar_url)]);
      if (profile.name) card.subtitle(profile.name);

      let text = '';
      if (profile.company) text += profile.company + ' \n';
      if (profile.email) text += profile.email + ' \n';
      if (profile.bio) text += profile.bio;
      card.text(text);

      card.tap(new builder.CardAction.openUrl(session, profile.html_url));

      const message = new builder.Message(session).attachments([card]);

      session.send(message);
    });
  },
]);

bot.dialog('/', dialog);

const server = restify.createServer();

server.post('/api/messages', connector.listen());
server.listen(3978);
