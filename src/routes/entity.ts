import express from 'express';

import {
  findAllMappings,
  findOrCreateMapping,
  findOrCreateMappingForGivenInternalID,
  generateNewId,
} from '../services/idGenerationService';
import {IdStatus, IIdsStatus, Status} from '../types';

const router = express.Router();

/**
 * @swagger
 * /entity/:entityType:
 *   get:
 *     tags: [entity]
 *     description: findAllMappings
 *     parameters:
 *       - name: entityType
 *         in: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of entity
 *     responses:
 *       200:
 *         description: returns mappings.
 */
router.get('/:entityType', async (req, res) => {
  try {
    const response: any = await findAllMappings(req.params['entityType']);
    res.send(response);
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

/**
 * @swagger
 * /entity/:entityType/id:
 *   get:
 *     tags: [entity]
 *     description: generateNewId
 *     responses:
 *       200:
 *         description: returns Id.
 */
router.get('/createId', async (req, res) => {
  try {
    const response: any = await generateNewId(req.params['entityType']);
    res.send(response);
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

/**
 * @swagger
 * /entity/:entityType/id/:hash:
 *   post:
 *     tags: [entity]
 *     description: findOrCreateMapping
 *     responses:
 *       200:
 *         description: returns Id.
 */
router.post('/:entityType/id/:hash', async (req, res) => {
  try {
    const response: IIdsStatus = await findOrCreateMapping(req.params['entityType'], [req.params['hash']]);
    res.status(Status.CREATED === response.status ? 201 : 200).send(response.rows[0].internal_id);
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

/**
 * @swagger
 * /entity/:entityType/id/:hash/:internalID:
 *   post:
 *     tags: [entity]
 *     description: findOrCreateMappingForGivenInternalID
 *     responses:
 *       200:
 *         description: returns Id.
 */
router.post('/id/:hash/:internalID', async (req, res) => {
  try {
    const response: IdStatus = await findOrCreateMappingForGivenInternalID(
      req.params['entityType'],
      req.params['hash'],
      req.params['internalID']
    );

    res.status(Status.CREATED === response.status ? 201 : 200).send(response.id);
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

export default router;
