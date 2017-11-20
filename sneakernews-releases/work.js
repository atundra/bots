const {setTimeout} = require('timers');
const request = require('request-promise-native');
const parse = require('./parse');
const telegram = require('./telegram');
const Post = require('./post');
const locale = require('./locale');


let posts = null;
const parsePage = async () => {
  if (!posts) {
    console.log('Parsing needed');
    posts = await parse();
    setTimeout(() => {
      posts = null;
    }, 1000 * 60 * 5);
  }

  return posts;
};

module.exports = async user => {
  const posts = await parsePage();
  const todaysReleases = posts.filter(post => post.isReleaseToday());
  if (todaysReleases.length === 0) {
    return;
  }
  
  const headerMessage = locale.headerMessage(user.lang, {RELEASES: Post.overall(todaysReleases)});
  await telegram.sendMessage(user.id, headerMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });

  const promises = todaysReleases.map(post => {
    return telegram.sendPhoto(user.id, post.imgUrl, {
      caption: post.name,
      disable_notification: true,
    });
  });
  await Promise.all(promises);
  console.log(`Posts sended to user ${user.id}`);
};
