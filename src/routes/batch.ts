import express from 'express';

import { batchFindOrCreate, generateNewIdBatch } from '../services/idGenerationService';

const router = express.Router();

/**
 * @swagger
 * /batch/:entityType/:batchSize:
 *   get:
 *     tags: [batch]
 *     description: /batch/:entityType/:batchSize
 *     responses:
 *       200:
 *         description: generateNewIdBatch then returns [].
 */
router.get('/:entityType/:batchSize', async (req, res) => {
  try {
    const response: any = await generateNewIdBatch(req.params['entityType'], parseInt(req.params['batchSize']));
    res.send(response);
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

/**
 * @swagger
 * /batch/create:
 *   post:
 *     tags: [batch]
 *     description: /batch/create
 *     responses:
 *       200:
 *         description: batchFindOrCreate then returns.
 */
router.post('/create', async (req, res) => {
  try {
    const response: any = await batchFindOrCreate(req.body);
    res.send(response);
  } catch (e: any) {
    console.error(req.body);
    res.status(500).send(e.message);
  }
});

export default router;
