import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import * as TE from 'fp-ts/lib/TaskEither';
import { fetchCustom, NativeFetch } from 'fp-fetch';
import { textParser } from 'fp-fetch/lib/parser';
import { pipe, unsafeCoerce } from 'fp-ts/lib/function';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import * as O from 'fp-ts/lib/Option';
import { querySelector } from './dom';
import {PostData} from './post';

const fetchText = fetchCustom({
  parser: textParser,
  errorParser: textParser,
  fetch: (fetch as unknown) as NativeFetch,
});

const elTextTrimmed = (e: Element): O.Option<string> =>
  pipe(
    O.fromNullable(e.textContent),
    O.map((c) => c.trim())
  );

const postDataFromElement = (p: Element): O.Option<PostData> =>
  pipe(
    O.Do,
    O.bind('name', () =>
      pipe(
        p,
        querySelector('.content-box [id^="title"]'),
        O.chain(elTextTrimmed)
      )
    ),
    O.bind('price', () =>
      pipe(p, querySelector('.release-price'), O.chain(elTextTrimmed))
    ),
    O.bind('url', () =>
      pipe(
        p,
        querySelector('.content-box [id^="title"]'),
        O.map((el) => unsafeCoerce<Element, HTMLAnchorElement>(el)),
        O.chainNullableK((a) => a.href)
      )
    ),
    // Date string, something like MM:DD or month name
    O.bind('dateString', () =>
      pipe(p, querySelector('.release-date'), O.chain(elTextTrimmed))
    ),
    O.map(({ name, price, url, dateString }) => ({
      name,
      price,
      url,
      dateString,
      img: pipe(
        p,
        querySelector('.image-box img'),
        O.map((el) => unsafeCoerce<Element, HTMLImageElement>(el)),
        O.map((i) => i.src)
      ),
    }))
  );

export const parse = (): TE.TaskEither<Error, ReadonlyArray<PostData>> =>
  pipe(
    fetchText('https://sneakernews.com/release-dates/'),
    TE.map((html) => new JSDOM(html)),
    TE.map((dom) => dom.window.document),
    TE.map((d) => d.querySelectorAll('.release-post-list .releases-box')),
    TE.map((xs) => Array.from(xs)),
    TE.map(RA.fromArray),
    TE.map(RA.map(postDataFromElement)),
    TE.map(RA.compact)
  );
