import { describe, it, expect } from "vitest";
import prisma from "../src/lib/prisma";

// Minimal diagnostic — just one raw query, nothing else. If THIS fails,
// the problem is purely Prisma-can't-connect-under-Vitest, unrelated to
// anything in our actual app/route code, transactions, or test timing.
describe("Database connectivity", () => {
  it("can run a trivial query", async () => {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    expect(result).toBeDefined();
  }, 20000);
});
