import { nanoid } from 'nanoid';
import prisma from '../lib/prisma.js';

export const createGroup = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const inviteCode = nanoid(8).toUpperCase();

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        inviteCode,
        members: {
          create: {
            userId: req.user.userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    res.status(201).json({ group });
  } catch (err) {
    console.error('createGroup error:', err);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

export const joinGroup = async (req, res) => {
  const { inviteCode } = req.body;

  if (!inviteCode) {
    return res.status(400).json({ error: 'Invite code is required' });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!group) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const alreadyMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.userId, groupId: group.id } },
    });

    if (alreadyMember) {
      return res.status(409).json({ error: 'You are already a member of this group' });
    }

    await prisma.groupMember.create({
      data: { userId: req.user.userId, groupId: group.id, role: 'MEMBER' },
    });

    const updated = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    res.json({ group: updated });
  } catch (err) {
    console.error('joinGroup error:', err);
    res.status(500).json({ error: 'Failed to join group' });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.user.userId },
      include: {
        group: {
          include: {
            members: { include: { user: { select: { id: true, username: true } } } },
            sessions: { where: { status: 'ACTIVE' }, select: { id: true, title: true } },
          },
        },
      },
    });

    const groups = memberships.map((m) => ({ ...m.group, myRole: m.role }));

    res.json({ groups });
  } catch (err) {
    console.error('getMyGroups error:', err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

export const getGroupById = async (req, res) => {
  const { groupId } = req.params;

  try {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.userId, groupId } },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: { select: { id: true, username: true } } } },
        sessions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ group: { ...group, myRole: membership.role } });
  } catch (err) {
    console.error('getGroupById error:', err);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
};
