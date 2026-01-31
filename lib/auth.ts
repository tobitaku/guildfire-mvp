import type { NextAuthOptions } from "next-auth";
import Discord from "next-auth/providers/discord";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, profile, account }) => {
      const discordProfile = profile as
        | { id?: string; username?: string; global_name?: string }
        | undefined;

      if (account) {
        const email = token.email ?? undefined;
        const fallbackUsername =
          discordProfile?.username ??
          discordProfile?.global_name ??
          token.name ??
          (discordProfile?.id ? `user-${discordProfile.id}` : "member");

        const user = await prisma.user.upsert({
          where: email ? { email } : { username: fallbackUsername },
          update: {
            username: fallbackUsername,
            displayName: discordProfile?.global_name ?? token.name ?? null,
            imageUrl: token.picture ?? null,
          },
          create: {
            username: fallbackUsername,
            displayName: discordProfile?.global_name ?? token.name ?? null,
            email,
            imageUrl: token.picture ?? null,
          },
        });

        token.sub = user.id;
        token.username = user.username;

        const guild = await prisma.guild.findUnique({
          where: { slug: "gaming-hub" },
          select: { id: true },
        });

        if (guild) {
          await prisma.guildMember.upsert({
            where: {
              guildId_userId: {
                guildId: guild.id,
                userId: user.id,
              },
            },
            update: {},
            create: {
              guildId: guild.id,
              userId: user.id,
              nickname: user.displayName ?? null,
            },
          });

          const memberRole =
            (await prisma.role.findFirst({
              where: { guildId: guild.id, name: "Member" },
            })) ??
            (await prisma.role.create({
              data: { guildId: guild.id, name: "Member", position: 1 },
            }));

          await prisma.memberRole.upsert({
            where: {
              guildId_userId_roleId: {
                guildId: guild.id,
                userId: user.id,
                roleId: memberRole.id,
              },
            },
            update: {},
            create: {
              guildId: guild.id,
              userId: user.id,
              roleId: memberRole.id,
            },
          });
        }
      }

      token.username = token.username ?? discordProfile?.username ?? token.name ?? null;
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.username = (token.username as string | null) ?? null;
      }
      return session;
    },
  },
};
