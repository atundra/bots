import * as TE from 'fp-ts/lib/TaskEither';
import localtunnel from 'localtunnel';
import { identity } from 'fp-ts/lib/function';

export const startTunnel = (port: number): TE.TaskEither<unknown, localtunnel.Tunnel> =>
  TE.tryCatch(() => localtunnel({ port }), identity);
