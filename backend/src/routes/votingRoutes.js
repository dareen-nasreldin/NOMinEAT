import { Router } from 'express';
import { body } from 'express-validator';
import {
  createSession,
  getSession,
  nominateOption,
  castVote,
  closeSession,
} from '../controllers/voting.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/groups/:groupId/sessions',
  [body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Session title must be 1–100 characters')],
  validate,
  createSession
);

router.get('/sessions/:sessionId', getSession);
router.patch('/sessions/:sessionId/close', closeSession);

router.post(
  '/sessions/:sessionId/nominate',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Option name must be 1–100 characters'),
    body('type').isIn(['RESTAURANT', 'GENRE', 'LOCATION']).withMessage('type must be RESTAURANT, GENRE, or LOCATION'),
  ],
  validate,
  nominateOption
);

router.post(
  '/sessions/:sessionId/options/:optionId/vote',
  [body('value').custom((v) => [1, 0, -1].includes(Number(v))).withMessage('value must be 1, 0 (remove), or -1')],
  validate,
  castVote
);

export default router;
