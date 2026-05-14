import { Router } from 'express';
import { createGroup, joinGroup, getMyGroups, getGroupById } from '../controllers/groups.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getMyGroups);
router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/:groupId', getGroupById);

export default router;
