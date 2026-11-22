import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockGameApi } from "./mock";
import { getGameApi } from "./index";
import { ApiError, httpGameApi } from "./http";
import { mockGameData } from "@/lib/data/mock";
import { supabaseGameData } from "@/lib/data/supabase";
import { getGameData } from "@/lib/data";

const fetchMock = vi.fn();
const reply = (status: number, body: unknown, statusText = "") =>
  fetchMock.mockResolvedValueOnce({
    ok: status < 400,
    status,
    statusText,
    json: async () => (body instanceof Error ? Promise.reject(body) : body),
  });

beforeEach(() => vi.stubGlobal("fetch", fetchMock));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

describe("httpGameApi", () => {
  it("posts the code to the run route and returns its result", async () => {
    const result = { status: "ok", tests: [], stdout: "", durationMs: 1 };
    reply(200, result);
    expect(await httpGameApi.run("p1", "code")).toEqual(result);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/run");
    expect(JSON.parse(init.body)).toEqual({ puzzleId: "p1", code: "code" });
  });

  it("maps a 429 run_limit response to status limit for run and grade", async () => {
    reply(429, { error: "run_limit" });
    expect((await httpGameApi.run("p1", "code")).status).toBe("limit");
    reply(429, { error: "run_limit" });
    expect(await httpGameApi.grade("p1", "code")).toMatchObject({ passed: false, status: "limit" });
  });

  it("throws ApiError with the route's error code for other failures", async () => {
    reply(503, { error: "judge_unavailable" });
    await expect(httpGameApi.grade("p1", "answer")).rejects.toMatchObject({ status: 503, code: "judge_unavailable" });
    reply(500, new Error("not json"), "Internal Server Error");
    await expect(httpGameApi.run("p1", "code")).rejects.toBeInstanceOf(ApiError);
  });

  it("falls back to the status text when the error body isn't JSON", async () => {
    reply(502, new Error("not json"), "Bad Gateway");
    await expect(httpGameApi.offers("r1")).rejects.toMatchObject({ code: "Bad Gateway" });
  });

  it("requests offers with a GET and an encoded run id", async () => {
    reply(200, []);
    await httpGameApi.offers("a b");
    expect(fetchMock.mock.calls[0]).toEqual(["/api/offers?runId=a%20b", undefined]);
  });
});

describe("data source switch", () => {
  it("returns mock implementations only when NEXT_PUBLIC_DATA_SOURCE is mock", () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_SOURCE", "mock");
    expect(getGameApi()).toBe(mockGameApi);
    expect(getGameData()).toBe(mockGameData);
    vi.stubEnv("NEXT_PUBLIC_DATA_SOURCE", "");
    expect(getGameApi()).toBe(httpGameApi);
    expect(getGameData()).toBe(supabaseGameData);
  });
});
