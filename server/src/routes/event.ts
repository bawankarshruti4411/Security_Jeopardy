import { Router, Request, Response } from 'express';
import { getActiveEvent, computeEventSummary } from '../utils/eventHelper';

const router = Router();

// GET /api/event - public event status and countdown info
router.get('/', async (_req: Request, res: Response) => {
  try {
    const event = await getActiveEvent();
    const summary = computeEventSummary(event);
    res.json({ success: true, event: summary });
  } catch (err: any) {
    console.error('Error fetching event:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve event information.' });
  }
});

export default router;
