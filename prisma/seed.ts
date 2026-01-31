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
