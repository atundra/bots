import * as t from 'io-ts';
import { Hour } from '@atundra/common/io-ts-types/hour';
import { Minute } from '@atundra/common/io-ts-types/minute';

const Subscription = t.type({
  hour: Hour,
  minute: Minute,
});

export const User = t.type({
  telegramUID: t.Int,

  // Subscription preferences
  subscription: t.union([Subscription, t.undefined]),

  // Lang, as in telegram Context object
  lang: t.union([t.string, t.undefined]),

  // Timezone in seconds (GMT+3 is 60*60*3)
  timezone: t.union([t.Int, t.undefined]),

  // Computed field, used for selecting users based
  // on their subscription time and timezone
  // Derived from subscription and timezone fields and their default values
  sendWhen: t.Int,
});

export type User = t.Type<typeof User>;
