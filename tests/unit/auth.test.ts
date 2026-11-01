import { describe, it, expect } from "vitest";
import { decodeJwt } from "@/lib/auth/token";

describe("Auth Token tests", () => {
  it("decodeJwt extracts sub and role correctly from valid token", () => {
    // Header: {"alg":"HS256","typ":"JWT"}
    // Payload: {"sub":"a1af91ba-717d-42e4-bdcb-22413b36377d","role":"Rider","iss":"SwiftRide","aud":"SwiftRide","exp":1893473794}
    const fakeToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJzdWIiOiJhMWFmOTFiYS03MTdkLTQyZTQtYmRjYi0yMjQxM2IzNjM3N2QiLCJyb2xlIjoiUmlkZXIiLCJpc3MiOiJTd2lmdFJpZGUiLCJhdWQiOiJTd2lmdFJpZGUiLCJleHAiOjE4OTM0NzM3OTR9." +
      "signature";

    const decoded = decodeJwt(fakeToken);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("a1af91ba-717d-42e4-bdcb-22413b36377d");
    expect(decoded?.role).toBe("Rider");
  });

  it("decodeJwt returns null for malformed token", () => {
    expect(decodeJwt("invalid-token")).toBeNull();
    expect(decodeJwt("")).toBeNull();
  });
});
