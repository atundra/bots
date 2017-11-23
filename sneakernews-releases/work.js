const {setTimeout} = require('timers');
const request = require('request-promise-native');
const telegram = require('./telegram');
const Post = require('./post');
const getPosts = require('./posts');
const locale = require('./locale');
const log = require('./log');


module.exports = async user => {
  log(`Start sending posts to user ${user.id}`);
  const posts = await getPosts();
  const todaysReleases = posts.filter(post => post.isReleaseToday());
  if (todaysReleases.length === 0) {
    return;
  }
  
  const headerMessage = locale.headerMessage(user.lang, {RELEASES: Post.overall(todaysReleases)});
  await telegram.sendMessage(user.id, headerMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });

  for (let post of todaysReleases) {
    await telegram.sendPhoto(user.id, post.imgUrl, {
      caption: post.name,
      disable_notification: true,
    });
  }
  log(`Posts sended to user ${user.id}`);
  return todaysReleases;
};
