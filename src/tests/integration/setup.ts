import { afterAll, beforeEach } from "vitest";

import { prisma } from "@/db/prisma";

import { resetDatabase } from "./helpers/reset-db";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
