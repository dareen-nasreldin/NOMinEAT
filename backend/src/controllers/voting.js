import prisma from '../lib/prisma.js';

const requireGroupMembership = async (userId, groupId) => {
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return membership;
};

export const createSession = async (req, res) => {
  const { groupId } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Session title is required' });
  }

  try {
    const membership = await requireGroupMembership(req.user.userId, groupId);
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const session = await prisma.votingSession.create({
      data: { groupId, title: title.trim(), status: 'ACTIVE' },
      include: { options: true },
    });

    res.status(201).json({ session });
  } catch (err) {
    console.error('createSession error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

export const getSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await prisma.votingSession.findUnique({
      where: { id: sessionId },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
        group: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const membership = await requireGroupMembership(req.user.userId, session.groupId);
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const optionsWithTally = session.options.map((opt) => ({
      ...opt,
      score: opt.votes.reduce((sum, v) => sum + v.value, 0),
      myVote: opt.votes.find((v) => v.userId === req.user.userId)?.value ?? null,
    }));

    res.json({ session: { ...session, options: optionsWithTally } });
  } catch (err) {
    console.error('getSession error:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

export const nominateOption = async (req, res) => {
  const { sessionId } = req.params;
  const { name, type } = req.body;

  const validTypes = ['RESTAURANT', 'GENRE', 'LOCATION'];
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Option name is required' });
  }
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
  }

  try {
    const session = await prisma.votingSession.findUnique({ where: { id: sessionId } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status === 'CLOSED') {
      return res.status(400).json({ error: 'This session is closed' });
    }

    const membership = await requireGroupMembership(req.user.userId, session.groupId);
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const option = await prisma.option.create({
      data: {
        sessionId,
        name: name.trim(),
        type,
        proposedBy: req.user.userId,
      },
    });

    res.status(201).json({ option: { ...option, score: 0, myVote: null } });
  } catch (err) {
    console.error('nominateOption error:', err);
    res.status(500).json({ error: 'Failed to NOMinate option' });
  }
};

export const castVote = async (req, res) => {
  const { sessionId, optionId } = req.params;
  const { value } = req.body;

  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'value must be 1 (upvote) or -1 (downvote)' });
  }

  try {
    const session = await prisma.votingSession.findUnique({ where: { id: sessionId } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status === 'CLOSED') {
      return res.status(400).json({ error: 'This session is closed' });
    }

    const membership = await requireGroupMembership(req.user.userId, session.groupId);
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const option = await prisma.option.findUnique({ where: { id: optionId } });
    if (!option || option.sessionId !== sessionId) {
      return res.status(404).json({ error: 'Option not found in this session' });
    }

    const vote = await prisma.vote.upsert({
      where: { userId_sessionId_optionId: { userId: req.user.userId, sessionId, optionId } },
      update: { value },
      create: { userId: req.user.userId, sessionId, optionId, value },
    });

    res.json({ vote });
  } catch (err) {
    console.error('castVote error:', err);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
};

export const closeSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await prisma.votingSession.findUnique({
      where: { id: sessionId },
      include: {
        options: { include: { votes: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status === 'CLOSED') {
      return res.status(400).json({ error: 'Session is already closed' });
    }

    const membership = await requireGroupMembership(req.user.userId, session.groupId);
    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only group admins can close a session' });
    }

    const closed = await prisma.votingSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED' },
    });

    const optionsWithScores = session.options
      .map((opt) => ({
        ...opt,
        score: opt.votes.reduce((sum, v) => sum + v.value, 0),
      }))
      .sort((a, b) => b.score - a.score);

    const winner = optionsWithScores[0] ?? null;

    res.json({ session: closed, winner, results: optionsWithScores });
  } catch (err) {
    console.error('closeSession error:', err);
    res.status(500).json({ error: 'Failed to close session' });
  }
};
