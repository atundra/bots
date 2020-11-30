// import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
// import * as m from '../mongo';

interface QuestionIdBrand {
  readonly QuestionId: unique symbol;
}

const QuestionId = t.brand(
  t.string,
  (qid): qid is t.Branded<string, QuestionIdBrand> => t.string.is(qid),
  'QuestionId'
);

export const Question = t.type({
  id: QuestionId,
  text: t.string
});

export type Question = t.Type<typeof Question>;

// export const find = (mc: m.ConnectedMongoClient) => pipe(mc, m.find());
