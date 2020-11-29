import * as TE from 'fp-ts/lib/TaskEither';
import localtunnel from 'localtunnel';

export class TunnelError extends Error {}

export const startTunnel = (port: number): TE.TaskEither<TunnelError, localtunnel.Tunnel> =>
  TE.tryCatch(
    () => localtunnel({ port }),
    e => new TunnelError(String(e))
  );
