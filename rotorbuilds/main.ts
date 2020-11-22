const fetch = require('node-fetch');

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

import { pipe, flow } from 'fp-ts/function';
import { fetchText } from 'fp-fetch';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as IO from 'fp-ts/IO';
import * as Console from 'fp-ts/Console';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import { ConstructorOptions, JSDOM } from 'jsdom';
import * as mongo from './mongo';
import { Collection, FilterQuery } from 'mongodb';
import * as Eq from 'fp-ts/lib/Eq';
import { sendPhoto, telegram, ChatIdT, sendMessage } from './tg';
import { Extra } from 'telegraf';

const jsdom = (o: ConstructorOptions) => (s: string) => new JSDOM(s, o);

const MONGO_URI = process.env.MONGO_URI;
const pageUrl = () => 'https://rotorbuilds.com/builds';
const chatId = () => Number(process.env.CHAT_ID);
const errorNotificationChatId = () => Number(process.env.ERRORS_CHAT_ID);
const telegramToken = () => process.env.TELEGRAM_TOKEN;
const dbName = () => 'vercel-lambdas';
const collectionName = () => 'rotorbuilds-posts';

type RBPost = {
  img: string;
  link: string;
  name: string;
  author: string;
};

const getLatestBuilds = (url: string): TE.TaskEither<Error, ReadonlyArray<RBPost>> =>
  pipe(
    url,
    // load page html
    fetchText,
    TE.map(jsdom({ url })),

    // get post items
    TE.map((dom) => Array.from(dom.window.document.querySelectorAll('#act_list > div'))),

    // for every item get rbpost data
    TE.map(
      // Looks like there should be a code which validate if markup is ok for parsing purposes
      RA.map((el) => ({
        img: el.querySelector('img').src,
        link: el.querySelector('a').href,
        name: el.querySelector('.act-title').textContent,
        author: el.querySelector('.act-user').textContent,
      }))
    )
  );

const useMongo = mongo.useMongo(MONGO_URI);

const existingPostsQuery = (posts: ReadonlyArray<RBPost>): FilterQuery<RBPost> =>
  pipe(
    posts,
    RA.map(({ link }) => link),
    RA.toArray,
    (links) => ({
      link: {
        $in: links,
      },
    })
  );

const rbPostEq: Eq.Eq<RBPost> = Eq.getStructEq({
  link: Eq.eqString,
});

const sendRbPost = (tgToken: string) => (chatId: ChatIdT) => (post: RBPost) =>
  pipe(
    telegram(tgToken),
    sendPhoto(
      chatId,
      post.img,
      // I have no idea what's going on with Extra here
      // @ts-ignore
      Extra.caption(
        `<b>${post.name}</b>\n${post.author}\n\n<a href="${post.link}">${post.link}</a>`
      ).HTML(true)
    )
  );

const sendText = (tgToken: string) => (chatId: ChatIdT) => (text: string) =>
  pipe(tgToken, telegram, sendMessage(chatId, text));

const main = pipe(
  // get latest posts
  getLatestBuilds(pageUrl()),
  TE.chain((posts) =>
    useMongo(
      flow(
        // get mongo collection of existing posts
        mongo.db(dbName()),
        mongo.collection<RBPost>(collectionName()),
        // send Collection<RBPost> to Reader_<Collection<RBPost>, _>
        pipe(
          RTE.right<Collection<RBPost>, never, void>(undefined),
          // filter out posts that already sent to channel
          RTE.chain(() => flow(mongo.find(existingPostsQuery(posts)))),
          RTE.map(RA.fromArray),
          RTE.map((existingPosts) => RA.difference(rbPostEq)(existingPosts)(posts)),
          // here we have readonly array of new posts
          // send them to tg
          RTE.chainFirst((posts) => () =>
            pipe(
              posts,
              RA.map(sendRbPost(telegramToken())(chatId())),
              RA.sequence(TE.taskEitherSeq)
            )
          ),
          // and finnaly save them to db
          RTE.chainFirst((posts) => (collection) =>
            RA.isNonEmpty(posts) ? mongo.insertMany(posts)(collection) : TE.right({})
          )
        )
      )
    )
  ),
  TE.fold(
    // Send message to error reporting chat if there is an error
    (e) =>
      pipe(
        sendText(telegramToken())(errorNotificationChatId())(e.toString()),
        // and then log error
        TE.fold(
          // If error occurs while trying to send report – log it and then log original error
          (e2) =>
            T.fromIO(
              pipe(
                Console.error(e2),
                IO.chain(() => Console.error(e))
              )
            ),
          // Otherwise log only original error
          () => T.fromIO(Console.error(e))
        )
      ),
    // Or just log out new posts list
    T.fromIOK(Console.log)
  )
);

main();
