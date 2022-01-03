import type { Context } from 'grammy';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { constVoid, pipe } from 'fp-ts/function';
import * as R from 'fp-ts/Reader';
import * as RE from 'fp-ts/ReaderEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { ChatMember, Message, UserFromGetMe } from 'grammy/out/platform.node';
import { readErrorMessage, Uid } from './utils';

type _MessageCtx = { message: Message | undefined };

export const readCallerId = (): R.Reader<_MessageCtx, O.Option<Uid>> => (ctx) =>
  O.fromNullable(ctx.message?.from?.id);

type _ReadMyUidCtx = { me: UserFromGetMe };

const _readMyUid = (): R.Reader<_ReadMyUidCtx, Uid> => (ctx) => ctx.me.id;

export const readMyUid = (): RTE.ReaderTaskEither<_ReadMyUidCtx, string, Uid> =>
  RTE.fromReader(_readMyUid());

type _ReadAdminsCtx = {
  getChatAdministrators(signal?: AbortSignal): Promise<ChatMember[]>;
};

export const readAdmins = (): RTE.ReaderTaskEither<_ReadAdminsCtx, string, ChatMember[]> => (ctx) =>
  TE.tryCatch(
    () => ctx.getChatAdministrators(),
    (e) => `Не могу прочесть админов: ${readErrorMessage(e)}`,
  );

export const throwIfNotAdmin = (err: string) => (admins: ChatMember[], uid: Uid) =>
  pipe(
    admins.find((cm) => cm.user.id === uid),
    E.fromNullable(err),
    RTE.fromEither,
  );

export const throwIfAlreadyAdmin = (err: string) => (admins: ChatMember[], uid: Uid) =>
  pipe(admins.some((cm) => cm.user.id === uid) ? E.left(err) : E.right(undefined), RTE.fromEither);

export const readRepliedUid = (): R.Reader<_MessageCtx, O.Option<Uid>> => (ctx) =>
  O.fromNullable(ctx.message?.reply_to_message?.from?.id);

type _MatchCtx = {
  match: Exclude<Context['match'], undefined>;
};

export const readUsernameFromCommand = (): RE.ReaderEither<_MatchCtx, string, string> => (ctx) =>
  ctx.match.length > 1 && typeof ctx.match === 'string' && ctx.match[0] === '@'
    ? E.right(ctx.match.split(' ')[0].substring(1))
    : E.left('Передай никнейм в виде @nickname');

export const readTargetUid = (): RE.ReaderEither<_MessageCtx, string, Uid> =>
  pipe(
    R.Do,
    R.bind('reply', () => readRepliedUid()),
    R.bind('caller', () => readCallerId()),
    R.map(({ reply, caller }) =>
      pipe(
        reply,
        O.alt(() => caller),
      ),
    ),
    R.chain(
      O.fold(
        () =>
          RE.left(
            'Команда должна вызываться в виде реплая на сообщение пользователя к которому применяется изменение, либо без реплая и тогда команда применится на вызывающего пользователя',
          ),
        (uid) => RE.right(uid),
      ),
    ),
  );

type _PromoteCtx = {
  promoteChatMember: Context['promoteChatMember'];
};

type Permissions = Parameters<Context['promoteChatMember']>[1];

export const changeChatMemberPermissions =
  (uid: Uid, permissions: Permissions): RTE.ReaderTaskEither<_PromoteCtx, string, void> =>
  (ctx) =>
    pipe(
      TE.tryCatch(
        () => ctx.promoteChatMember(uid, permissions),
        (e) => `Не могу поменять пермишны: ${readErrorMessage(e)}`,
      ),
      TE.map(constVoid),
    );

export const promote = (uid: Uid) =>
  changeChatMemberPermissions(uid, {
    is_anonymous: false,
    can_manage_chat: true,
    can_post_messages: false,
    can_edit_messages: false,
    can_delete_messages: false,
    can_manage_voice_chats: true,
    can_restrict_members: false,
    can_promote_members: false,
    can_change_info: true,
    can_invite_users: true,
    can_pin_messages: true,
  });

export const promoteSuper = (uid: Uid) =>
  changeChatMemberPermissions(uid, {
    is_anonymous: false,
    can_manage_chat: true,
    can_post_messages: false,
    can_edit_messages: false,
    can_delete_messages: true,
    can_manage_voice_chats: true,
    can_restrict_members: true,
    can_promote_members: true,
    can_change_info: true,
    can_invite_users: true,
    can_pin_messages: true,
  });

export const demote = (uid: Uid) =>
  changeChatMemberPermissions(uid, {
    is_anonymous: false,
    can_manage_chat: false,
    can_post_messages: false,
    can_edit_messages: false,
    can_delete_messages: false,
    can_manage_voice_chats: false,
    can_restrict_members: false,
    can_promote_members: false,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false,
  });

type _SetCustomTitleCtx = {
  setChatAdministratorCustomTitle: Context['setChatAdministratorCustomTitle'];
};

export const rename =
  (uid: Uid, newName: string): RTE.ReaderTaskEither<_SetCustomTitleCtx, string, void> =>
  (ctx) =>
    pipe(
      TE.tryCatch(
        () => ctx.setChatAdministratorCustomTitle(uid, newName),
        (e) => `Не получилось установить новое имя, ${readErrorMessage(e)}`,
      ),
      TE.map(constVoid),
    );

export const readCommandText = (): RTE.ReaderTaskEither<_MatchCtx, string, string> => (ctx) =>
  typeof ctx.match === 'string'
    ? TE.right(ctx.match)
    : TE.left('Разрабу по лбу надо дать, хенддер не туда сунул');

export const runHandler =
  <
    R extends {
      msg: Message;
      reply: Context['reply'];
    },
    A,
  >(
    ctx: R,
  ) =>
  (handler: RTE.ReaderTaskEither<R, string, A>) =>
    handler(ctx)().then(
      E.fold(
        (err) =>
          ctx.reply(err, {
            reply_to_message_id: ctx.msg.message_id,
          }),
        () =>
          ctx.reply('Готовоe', {
            reply_to_message_id: ctx.msg.message_id,
          }),
      ),
    );
