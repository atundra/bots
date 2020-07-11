const parse = require('./parse');
const log = require('./log');

const getPosts = () => {
  let posts = null;

  return async () => {
    if (!posts) {
      log('Parsing needed');
      posts = await parse();
      setTimeout(() => {
        posts = null;
      }, 1000 * 60 * 5);
    }

    return posts;
  };
};

module.exports = getPosts();
