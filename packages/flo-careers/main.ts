const fetch = require('node-fetch');

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

import { pipe, flow } from 'fp-ts/function';
import { fetchText } from 'fp-fetch';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as Console from 'fp-ts/Console';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import * as IO from 'fp-ts/IO';
import { ConstructorOptions, JSDOM } from 'jsdom';
import * as mongo from './mongo';
import { Collection, FilterQuery } from 'mongodb';
import * as Eq from 'fp-ts/lib/Eq';
import { sendMessage, telegram, ChatIdT } from './tg';
import { Extra } from 'telegraf';

const jsdom = (o: ConstructorOptions) => (s: string) => new JSDOM(s, o);

const MONGO_URI = process.env.MONGO_URI;
const careersPageUrl = () => 'https://flo.health/careers';
const chatId = () => Number(process.env.FLO_NOTIFICATIONS_CHAT_ID);
const errorNotificationChatId = () => Number(process.env.ERROR_NOTIFICATIONS_CHAT_ID);
const telegramToken = () => process.env.FLO_BOT_TELEGRAM_TOKEN;
const dbName = () => 'vercel-lambdas';
const collectionName = () => 'flo-jobs';

type JobPost = {
  link: string;
  name: string;
  categories: ReadonlyArray<string>;
  location: string;
  careerCategory: string;
};

const getCurrentJobs = (url: string): TE.TaskEither<Error, ReadonlyArray<JobPost>> =>
  pipe(
    url,
    // load page html
    fetchText,
    TE.map(jsdom({ url })),

    // get career categories
    TE.map((dom) =>
      Array.from(dom.window.document.querySelectorAll('.careers-expand-collapse__list > .item'))
    ),

    TE.map(
      RA.chain((el) =>
        pipe(
          el.querySelectorAll('.item__jobs .job'),
          (nodes) => Array.from(nodes),
          RA.map((item) => ({
            link: item.querySelector('a').href,
            name: item.querySelector('.job__content .job__name').textContent.trim(),
            categories: pipe(
              item.querySelectorAll('.job__content .job__category'),
              (a) => Array.from(a),
              RA.map((a) => a.textContent.trim())
            ),
            location: item.querySelector('.job__content .job__location').textContent.trim(),
            careerCategory: el.querySelector('label.item__category').textContent.trim(),
          }))
        )
      )
    )
  );

const existingPostsQuery = (posts: ReadonlyArray<JobPost>): FilterQuery<JobPost> =>
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

const JobPostEq: Eq.Eq<JobPost> = Eq.getStructEq({
  link: Eq.eqString,
});

const sendJobPost = (tgToken: string) => (chatId: ChatIdT) => (post: JobPost) =>
  pipe(
    telegram(tgToken),
    sendMessage(
      chatId,
      `<b>${post.name}</b>\n${RA.isNonEmpty(post.categories) ? post.categories.join(' – ') : ''}\n${
        post.location
      }\n\n<a href="${post.link}">${post.link}</a>`,
      // I have no idea what's going on with Extra here
      // @ts-ignore
      Extra.HTML(true)
    )
  );

const sendText = (tgToken: string) => (chatId: ChatIdT) => (text: string) =>
  pipe(tgToken, telegram, sendMessage(chatId, text));

const useMongo = mongo.useMongo(MONGO_URI);

const main = pipe(
  // get latest posts
  careersPageUrl(),
  getCurrentJobs,
  TE.chain((posts) =>
    useMongo(
      flow(
        // get mongo collection of existing posts
        mongo.db(dbName()),
        mongo.collection<JobPost>(collectionName()),
        // send Collection<JobPost> to Reader_<Collection<JobPost>, _>
        pipe(
          RTE.right<Collection<JobPost>, never, void>(undefined),
          // filter out posts that already sent to channel
          RTE.chain(() => flow(mongo.find(existingPostsQuery(posts)))),
          RTE.map(RA.fromArray),
          RTE.map((existingPosts) => RA.difference(JobPostEq)(existingPosts)(posts)),
          // here we have readonly array of new posts
          // send them to tg
          RTE.chainFirst((posts) => () =>
            pipe(
              posts,
              RA.map(sendJobPost(telegramToken())(chatId())),
              (a) =>
                RA.isNonEmpty(a)
                  ? pipe(a, RA.cons(sendText(telegramToken())(chatId())('Атеншн 🐰')))
                  : a,
              RA.sequence(TE.taskEitherSeq)
            )
          ),
          // clean out an old records
          RTE.chainFirst(() => flow(mongo.deleteMany({}))),
          // and finnaly save them to db
          RTE.chainFirst(() => (collection) =>
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
