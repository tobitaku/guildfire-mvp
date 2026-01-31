import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const runtime = "nodejs";

import { createContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/router";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(),
  });

export { handler as GET, handler as POST };
