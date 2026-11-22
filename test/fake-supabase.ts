// proxy stand-in for the Supabase query builder that records chained calls and resolves via respond
export interface FakeQuery {
  table: string;
  calls: { method: string; args: unknown[] }[];
  has(method: string, ...args: unknown[]): boolean;
}
export type FakeResult = { data: unknown; error: unknown };

export function fakeSupabase(respond: (q: FakeQuery) => FakeResult) {
  const queries: FakeQuery[] = [];
  const client = {
    from(table: string) {
      const query: FakeQuery = {
        table,
        calls: [],
        has: (method, ...args) =>
          query.calls.some((c) => c.method === method && args.every((a, i) => JSON.stringify(c.args[i]) === JSON.stringify(a))),
      };
      queries.push(query);
      const chain: object = new Proxy(
        {},
        {
          get(_target, prop) {
            if (prop === "then") {
              return (ok: (r: FakeResult) => unknown, fail: (e: unknown) => unknown) =>
                Promise.resolve()
                  .then(() => respond(query))
                  .then(ok, fail);
            }
            return (...args: unknown[]) => {
              query.calls.push({ method: String(prop), args });
              return chain;
            };
          },
        },
      );
      return chain;
    },
  };
  return { client, queries };
}

export const ok = (data: unknown): FakeResult => ({ data, error: null });
