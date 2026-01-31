import { createContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/router";

export async function createCaller() {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
}
