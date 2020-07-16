// @ts-ignore
import telegram from './telegram';
// @ts-ignore
import Post from './post';
// @ts-ignore
import getPosts from './posts';
// @ts-ignore
import locale from './locale';
import log from './log';

const work = async (user: any) => {
  log(`Start sending posts to user ${user.id}`);
  const posts = await getPosts();
  const todaysReleases = posts.filter((post: any) => post.isReleaseToday());
  if (todaysReleases.length === 0) {
    return;
  }

  const headerMessage = locale.headerMessage(user.lang, {
    RELEASES: Post.overall(todaysReleases),
  });
  await telegram.sendMessage(user.id, headerMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });

  if (todaysReleases.length === 1) {
    const post = todaysReleases[0];
    await telegram.sendPhoto(user.id, post.imgUrl, {
      caption: post.name,
      disable_notification: true,
    });
  } else {
    telegram.sendMediaGroup(
      user.id,
      todaysReleases.map((post: any) => ({
        type: 'photo',
        media: post.imgUrl,
        caption: post.name,
      })),
      {
        disable_notification: true,
      }
    );
  }

  log(`Posts sended to user ${user.id}`);
  return todaysReleases;
};

export default work;
