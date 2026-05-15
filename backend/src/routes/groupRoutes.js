import { Router } from 'express';
import { body } from 'express-validator';
import { createGroup, joinGroup, getMyGroups, getGroupById } from '../controllers/groups.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getMyGroups);

router.post(
  '/',
  [body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Group name must be 1–100 characters')],
  validate,
  createGroup
);

router.post(
  '/join',
  [body('inviteCode').trim().notEmpty().withMessage('Invite code is required')],
  validate,
  joinGroup
);

router.get('/:groupId', getGroupById);

export default router;
