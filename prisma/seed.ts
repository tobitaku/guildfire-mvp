import "dotenv/config";
import { prisma } from "../lib/prisma";

const DEFAULT_GUILD = {
  name: "Gaming Hub",
  slug: "gaming-hub",
};

const DEFAULT_CHANNELS = [
  { name: "general", position: 0 },
  { name: "pc-gaming", position: 1 },
  { name: "console", position: 2 },
  { name: "help", position: 3 },
];

async function main() {
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@guildfire.local" },
    update: {
      username: "admin",
      displayName: "Admin",
    },
    create: {
      username: "admin",
      displayName: "Admin",
      email: "admin@guildfire.local",
    },
  });

  const guild = await prisma.guild.upsert({
    where: { slug: DEFAULT_GUILD.slug },
    update: {
      name: DEFAULT_GUILD.name,
      ownerId: adminUser.id,
    },
    create: {
      name: DEFAULT_GUILD.name,
      slug: DEFAULT_GUILD.slug,
      ownerId: adminUser.id,
    },
  });

  await prisma.guildMember.upsert({
    where: {
      guildId_userId: {
        guildId: guild.id,
        userId: adminUser.id,
      },
    },
    update: {
      nickname: "Admin",
    },
    create: {
      guildId: guild.id,
      userId: adminUser.id,
      nickname: "Admin",
    },
  });

  for (const channel of DEFAULT_CHANNELS) {
    const existing = await prisma.channel.findFirst({
      where: {
        guildId: guild.id,
        name: channel.name,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.channel.create({
        data: {
          guildId: guild.id,
          name: channel.name,
          type: "TEXT",
          position: channel.position,
        },
      });
    }
  }

  const memberRole = await prisma.role.findFirst({
    where: {
      guildId: guild.id,
      name: "Member",
    },
  });

  const adminRole = await prisma.role.findFirst({
    where: {
      guildId: guild.id,
      name: "Admin",
    },
  });

  const ensuredMemberRole =
    memberRole ??
    (await prisma.role.create({
      data: {
        guildId: guild.id,
        name: "Member",
        position: 1,
      },
    }));

  const ensuredAdminRole =
    adminRole ??
    (await prisma.role.create({
      data: {
        guildId: guild.id,
        name: "Admin",
        position: 0,
      },
    }));

  await prisma.rolePermission.createMany({
    data: [
      { roleId: ensuredMemberRole.id, permission: "post" },
      { roleId: ensuredMemberRole.id, permission: "react" },
      { roleId: ensuredAdminRole.id, permission: "admin" },
      { roleId: ensuredAdminRole.id, permission: "manage_channels" },
      { roleId: ensuredAdminRole.id, permission: "manage_roles" },
      { roleId: ensuredAdminRole.id, permission: "delete_any" },
    ],
    skipDuplicates: true,
  });

  await prisma.memberRole.upsert({
    where: {
      guildId_userId_roleId: {
        guildId: guild.id,
        userId: adminUser.id,
        roleId: ensuredAdminRole.id,
      },
    },
    update: {},
    create: {
      guildId: guild.id,
      userId: adminUser.id,
      roleId: ensuredAdminRole.id,
    },
  });

  const channels = await prisma.channel.findMany({
    where: { guildId: guild.id },
    select: { id: true, name: true },
  });

  const channelByName = new Map(channels.map((channel) => [channel.name, channel]));

  const seedThreads = [
    {
      channel: "general",
      title: "Welcome to Gaming Hub",
      messages: [
        "Hey everyone! Introduce yourself and share what you play.",
        "If you're new, check out the rules and have fun!",
      ],
    },
    {
      channel: "pc-gaming",
      title: "PC build advice for 2026",
      messages: [
        "Thinking about a mid-range build. Any GPU recommendations?",
        "I just finished a build, happy to share parts list.",
      ],
    },
    {
      channel: "console",
      title: "Console co-op night",
      messages: [
        "Anyone up for co-op this weekend?",
        "I can host. Drop your gamertag if you're in.",
      ],
    },
    {
      channel: "help",
      title: "Issue posting screenshots",
      messages: [
        "Images won't upload for me. Anyone else?",
        "Try a different browser, that helped me.",
      ],
    },
  ];

  for (const threadSeed of seedThreads) {
    const channel = channelByName.get(threadSeed.channel);
    if (!channel) continue;

    const existingThread = await prisma.thread.findFirst({
      where: { channelId: channel.id, title: threadSeed.title },
      select: { id: true },
    });

    const thread =
      existingThread ??
      (await prisma.thread.create({
        data: {
          channelId: channel.id,
          title: threadSeed.title,
          createdById: adminUser.id,
        },
      }));

    const existingMessageCount = await prisma.message.count({
      where: { threadId: thread.id },
    });

    if (existingMessageCount === 0) {
      await prisma.message.createMany({
        data: threadSeed.messages.map((content, index) => ({
          threadId: thread.id,
          authorId: adminUser.id,
          content,
          createdAt: new Date(Date.now() + index * 1000),
        })),
      });
    }
  }

  const [seedMemberRole] = await prisma.role.findMany({
    where: { guildId: guild.id, name: "Member" },
    take: 1,
  });

  const demoUsers = ["alex", "mara", "jun", "sami"];
  const emojiPool = ["👍", "🔥", "🎮", "❤️", "😄"];

  const seededUsers = await Promise.all(
    demoUsers.map((username, index) => {
      const email = `${username}@guildfire.local`;
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          username,
          displayName: username.toUpperCase(),
          email,
          imageUrl: null,
          createdAt: new Date(Date.now() - (index + 1) * 1000 * 60),
        },
      });
    })
  );

  for (const user of seededUsers) {
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

    if (seedMemberRole) {
      await prisma.memberRole.upsert({
        where: {
          guildId_userId_roleId: {
            guildId: guild.id,
            userId: user.id,
            roleId: seedMemberRole.id,
          },
        },
        update: {},
        create: {
          guildId: guild.id,
          userId: user.id,
          roleId: seedMemberRole.id,
        },
      });
    }
  }

  const messages = await prisma.message.findMany({
    where: {
      thread: {
        channel: {
          guildId: guild.id,
        },
      },
    },
    select: { id: true },
  });

  const reactionSeeds: { messageId: string; userId: string; emoji: string }[] = [];

  for (const message of messages.slice(0, 8)) {
    for (const [index, user] of seededUsers.entries()) {
      const emoji = emojiPool[(index + message.id.length) % emojiPool.length];
      reactionSeeds.push({
        messageId: message.id,
        userId: user.id,
        emoji,
      });
    }
  }

  if (reactionSeeds.length > 0) {
    await prisma.messageReaction.createMany({
      data: reactionSeeds,
      skipDuplicates: true,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
