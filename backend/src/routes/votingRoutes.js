import { Router } from 'express';
import {
  createSession,
  getSession,
  nominateOption,
  castVote,
  closeSession,
} from '../controllers/voting.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Sessions
router.post('/groups/:groupId/sessions', createSession);
router.get('/sessions/:sessionId', getSession);
router.patch('/sessions/:sessionId/close', closeSession);

// NOMinees & voting
router.post('/sessions/:sessionId/nominate', nominateOption);
router.post('/sessions/:sessionId/options/:optionId/vote', castVote);

export default router;
