import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createContext(_req?: NextRequest) {
  const session = await getServerSession(authOptions);
  return { session, prisma };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
