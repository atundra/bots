// @ts-ignore
import parse from './parse';
import log from './log';
import Post from './post';

const getPosts = () => {
  let posts: Post[] | null = null;

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

export default getPosts();
