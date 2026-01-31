import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

import type { Context } from "@/lib/trpc/context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      userId: ctx.session.user.id,
    },
  });
});

const protectedProcedure = t.procedure.use(requireAuth);

async function isAdmin(ctx: Context, userId: string, guildId: string) {
  const role = await ctx.prisma.memberRole.findFirst({
    where: {
      guildId,
      userId,
      role: { name: "Admin" },
    },
    select: { roleId: true },
  });
  return Boolean(role);
}

export const appRouter = t.router({
  thread: t.router({
    create: protectedProcedure
      .input(
        z.object({
          channelId: z.string().uuid(),
          title: z.string().min(2).max(120),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const channel = await ctx.prisma.channel.findUnique({
          where: { id: input.channelId },
          select: { guildId: true },
        });

        if (!channel) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const membership = await ctx.prisma.guildMember.findUnique({
          where: {
            guildId_userId: {
              guildId: channel.guildId,
              userId: ctx.userId,
            },
          },
          select: { guildId: true },
        });

        if (!membership) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return ctx.prisma.thread.create({
          data: {
            title: input.title,
            channelId: input.channelId,
            createdById: ctx.userId,
          },
        });
      }),
    toggleLock: protectedProcedure
      .input(z.object({ threadId: z.string().uuid(), locked: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const thread = await ctx.prisma.thread.findUnique({
          where: { id: input.threadId },
          select: {
            channel: { select: { guildId: true } },
          },
        });

        if (!thread) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const admin = await isAdmin(ctx, ctx.userId, thread.channel.guildId);
        if (!admin) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return ctx.prisma.thread.update({
          where: { id: input.threadId },
          data: { isLocked: input.locked },
        });
      }),
  }),
  message: t.router({
    create: protectedProcedure
      .input(z.object({ threadId: z.string().uuid(), content: z.string().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const thread = await ctx.prisma.thread.findUnique({
          where: { id: input.threadId },
          select: {
            isLocked: true,
            channel: { select: { guildId: true } },
          },
        });

        if (!thread) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const membership = await ctx.prisma.guildMember.findUnique({
          where: {
            guildId_userId: {
              guildId: thread.channel.guildId,
              userId: ctx.userId,
            },
          },
          select: { guildId: true },
        });

        if (!membership) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        if (thread.isLocked) {
          const admin = await isAdmin(ctx, ctx.userId, thread.channel.guildId);
          if (!admin) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }

        return ctx.prisma.message.create({
          data: {
            threadId: input.threadId,
            authorId: ctx.userId,
            content: input.content,
          },
        });
      }),
    update: protectedProcedure
      .input(z.object({ messageId: z.string().uuid(), content: z.string().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const message = await ctx.prisma.message.findUnique({
          where: { id: input.messageId },
          select: { authorId: true },
        });

        if (!message) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (message.authorId !== ctx.userId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return ctx.prisma.message.update({
          where: { id: input.messageId },
          data: {
            content: input.content,
            editedAt: new Date(),
          },
        });
      }),
    delete: protectedProcedure
      .input(z.object({ messageId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const message = await ctx.prisma.message.findUnique({
          where: { id: input.messageId },
          select: { authorId: true },
        });

        if (!message) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (message.authorId !== ctx.userId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return ctx.prisma.message.update({
          where: { id: input.messageId },
          data: {
            deletedAt: new Date(),
            deletedById: ctx.userId,
          },
        });
      }),
  }),
  reaction: t.router({
    toggle: protectedProcedure
      .input(z.object({ messageId: z.string().uuid(), emoji: z.string().min(1).max(16) }))
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.prisma.messageReaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId: input.messageId,
              userId: ctx.userId,
              emoji: input.emoji,
            },
          },
        });

        if (existing) {
          await ctx.prisma.messageReaction.delete({
            where: {
              messageId_userId_emoji: {
                messageId: input.messageId,
                userId: ctx.userId,
                emoji: input.emoji,
              },
            },
          });
          return { toggled: "removed" as const };
        }

        await ctx.prisma.messageReaction.create({
          data: {
            messageId: input.messageId,
            userId: ctx.userId,
            emoji: input.emoji,
          },
        });

        return { toggled: "added" as const };
      }),
  }),
});

export type AppRouter = typeof appRouter;
