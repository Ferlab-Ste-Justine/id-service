import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { options } from '../config/swagger';
import batch from './batch';
import entity from './entity';

const router = express.Router();

router.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(options)));

router.use('/batch', batch);
router.use('/entity', entity);

/**
 * @swagger
 * /:
 *   get:
 *     tags: [404]
 *     description: 404
 *     responses:
 *       404:
 *         description: not found.
 */
router.all('/', (req, res) => res.sendStatus(404));

export default router;
