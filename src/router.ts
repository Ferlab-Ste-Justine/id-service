import express from 'express';
import {
    batchFindOrCreate,
    findAllMappings,
    findOrCreateMapping,
    findOrCreateMappingForGivenInternalID,
    generateNewId,
    generateNewIdBatch,
} from './idGenerationService';
import { IdStatus, Status } from './types';

const router = express.Router();

router.get('/:entityType', async (req, res) => {
    const response: any = await findAllMappings(req.params['entityType']);
    res.send(response);
});

router.get('/id/:entityType', async (req, res) => {
    const response: any = await generateNewId(req.params['entityType']);
    res.send(response);
});

router.get('/batch/:entityType/:batchSize', async (req, res) => {
    const response: any = await generateNewIdBatch(req.params['entityType'], parseInt(req.params['batchSize']));
    res.send(response);
});

router.post('/id/:entityType/:hash', async (req, res) => {
    const response: IdStatus = await findOrCreateMapping(req.params['entityType'], req.params['hash']);

    res.status(Status.CREATED === response.status ? 201 : 200).send(response.id);
});

router.post('/id/:entityType/:hash/:internalID', async (req, res) => {
    const response: IdStatus = await findOrCreateMappingForGivenInternalID(
        req.params['entityType'],
        req.params['hash'],
        req.params['internalID']
    );

    res.status(Status.CREATED === response.status ? 201 : 200).send(response.id);
});

router.post('/batch', async (req, res) => {
    const response: any = await batchFindOrCreate(req.body);
    res.send(response);
});

export default router;
