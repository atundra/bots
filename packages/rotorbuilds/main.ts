const fetch = require('node-fetch');

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

import { pipe, flow } from 'fp-ts/function';
import { fetchText } from 'fp-fetch';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as IO from 'fp-ts/IO';
import * as O from 'fp-ts/Option';
import * as Console from 'fp-ts/Console';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import { ConstructorOptions, JSDOM } from 'jsdom';
import * as mongo from './mongo';
import { Collection, FilterQuery } from 'mongodb';
import * as Eq from 'fp-ts/lib/Eq';
import { sendPhoto, telegram, ChatIdT, sendMessage, sendMediaGroup } from './tg';
import { Extra } from 'telegraf';
import { escapeHtml } from './escape';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as RNEA from 'fp-ts/lib/ReadonlyNonEmptyArray';
import { ArrayOf2PlusN, mapArrayOf2PlusN } from './utils';
import { InputMediaPhoto } from 'telegraf/typings/telegram-types';

const jsdom = (o: ConstructorOptions) => (s: string) => new JSDOM(s, o);

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('Provide MONGO_URI');
}
const pageUrl = () => 'https://rotorbuilds.com/builds';
const chatId = () => Number(process.env.CHAT_ID);
const errorNotificationChatId = () => Number(process.env.ERRORS_CHAT_ID);
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
if (!TELEGRAM_TOKEN) {
  throw new Error('Provide TELEGRAM_TOKEN');
}
const dbName = () => 'vercel-lambdas';
const collectionName = () => 'rotorbuilds-posts';
const PICS_PER_POST = 7;

type RBPost = {
  img: string;
  link: string;
  name: string;
  author: string;
  // images from post, urls
  imgs: O.Option<RNEA.ReadonlyNonEmptyArray<string>>;
};

const seqO = sequenceS(O.Applicative);

const getLatestBuilds = (url: string): TE.TaskEither<Error, ReadonlyArray<RBPost>> =>
  pipe(
    url,
    // load page html
    fetchText,
    TE.map(jsdom({ url })),

    // get post items
    TE.map((dom) => Array.from(dom.window.document.querySelectorAll('#act_list > div'))),

    // for every item get rbpost data
    TE.chain((postElements) =>
      pipe(
        postElements,
        RA.map((el) => ({
          img: O.fromNullable(el.querySelector('img')?.src),
          link: O.fromNullable(el.querySelector('a')?.href),
          name: O.fromNullable(el.querySelector('.act-title')?.textContent),
          author: O.fromNullable(el.querySelector('.act-user')?.textContent),
          imgs: O.some(O.none),
        })),
        RA.map(seqO),
        O.sequenceArray,
        TE.fromOption(() => new Error('Some of the posts lack a content')),
      ),
    ),
  );

const getBuildPics = (buildUrl: string): TE.TaskEither<Error, readonly string[]> =>
  pipe(
    buildUrl,
    fetchText,
    TE.map(jsdom({ url: buildUrl })),
    TE.map((dom) =>
      Array.from(
        dom.window.document.querySelectorAll<HTMLImageElement>('#screenshots .image_preview img'),
      ).map((item) => item.src),
    ),
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
    }),
  );

const rbPostEq: Eq.Eq<RBPost> = Eq.getStructEq({
  link: Eq.eqString,
});

const sendRbPost = (tgToken: string) => (chatId: ChatIdT) => (post: RBPost) => {
  const imgsCountMoreThan2 = pipe(post.imgs, O.map(RA.toArray), O.chain(ArrayOf2PlusN));

  return pipe(
    telegram(tgToken),
    pipe(
      imgsCountMoreThan2,
      O.fold(
        // if there are 1 pic or no pics
        // send just one photo
        () =>
          sendPhoto(
            chatId,
            post.img,
            // I have no idea what's going on with Extra here
            // @ts-ignore
            Extra.caption(
              `<b>${escapeHtml(post.name)}</b>\n${escapeHtml(post.author)}\n\n<a href="${escapeHtml(
                post.link,
              )}">${escapeHtml(post.link)}</a>`,
            ).HTML(true),
          ),
        // if there are 2 or more pics
        // send photo album
        (urls) =>
          sendMediaGroup(
            chatId,
            pipe(
              urls,
              mapArrayOf2PlusN<string, InputMediaPhoto>((url, i) => ({
                type: 'photo',
                media: url,
                caption:
                  i === 0
                    ? `<b>${escapeHtml(post.name)}</b>\n${escapeHtml(
                        post.author,
                      )}\n\n<a href="${escapeHtml(post.link)}">${escapeHtml(post.link)}</a>`
                    : undefined,
                parse_mode: 'HTML',
              })),
            ),
          ),
      ),
    ),
  );
};

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
          RTE.chainTaskEitherKW((posts) =>
            pipe(
              posts,
              TE.traverseSeqArray((post) =>
                pipe(
                  getBuildPics(post.link),
                  TE.map((images) => ({
                    ...post,
                    imgs: RNEA.fromArray(images.slice(0, PICS_PER_POST)),
                  })),
                ),
              ),
            ),
          ),
          // send them to tg
          RTE.chainFirst(
            (posts) => () =>
              pipe(
                posts,
                TE.traverseSeqArray((post) =>
                  pipe(
                    sendRbPost(TELEGRAM_TOKEN)(chatId())(post),
                    TE.mapLeft(
                      (err: unknown) =>
                        new Error(`Failed to send post ${JSON.stringify(post)}:\n${err}`),
                    ),
                  ),
                ),
                // RA.sequence(TE.taskEitherSeq),
              ),
          ),
          // and finnaly save them to db
          RTE.chainFirst(
            (posts) => (collection) =>
              RA.isNonEmpty(posts) ? mongo.insertMany(posts)(collection) : TE.right({}),
          ),
        ),
      ),
    ),
  ),
  TE.fold(
    // Send message to error reporting chat if there is an error
    (e) =>
      pipe(
        sendText(TELEGRAM_TOKEN)(errorNotificationChatId())(e.toString()),
        // and then log error
        TE.fold(
          // If error occurs while trying to send report – log it and then log original error
          (e2) =>
            T.fromIO(
              pipe(
                Console.error(e2),
                IO.chain(() => Console.error(e)),
              ),
            ),
          // Otherwise log only original error
          () => T.fromIO(Console.error(e)),
        ),
      ),
    // Or just log out new posts list
    T.fromIOK(Console.log),
  ),
);

main();
