const {setTimeout} = require('timers');
const request = require('request-promise-native');
const telegram = require('./telegram');
const Post = require('./post');
const getPosts = require('./posts');
const locale = require('./locale');

module.exports = async user => {
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

  await todaysReleases.reduce((chain, post) => {
    return chain.then(() => {
      return telegram.sendPhoto(user.id, post.imgUrl, {
        caption: post.name,
        disable_notification: true,
      });
    })
  }, Promise.resolve());
  console.log(`Posts sended to user ${user.id}`);
};
