import * as O from 'fp-ts/lib/Option';

export function querySelector<K extends keyof HTMLElementTagNameMap>(
  selectors: K
): (p: ParentNode) => O.Option<HTMLElementTagNameMap[K]>;
export function querySelector<K extends keyof SVGElementTagNameMap>(
  selectors: K
): (p: ParentNode) => O.Option<SVGElementTagNameMap[K]>;
export function querySelector<E extends Element = Element>(
  selectors: string
): (p: ParentNode) => O.Option<E>;
export function querySelector<E extends Element = Element>(
  selectors: string
): (p: ParentNode) => O.Option<E> {
  return (p) => O.fromNullable(p.querySelector(selectors));
}
