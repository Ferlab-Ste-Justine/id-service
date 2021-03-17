import express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import morgan from 'morgan';
import router from './router';
import cors from 'cors';

export const app = express();

// Default route
function defaultRoute(req: Request, res: Response, next: NextFunction) {
    res.sendStatus(404);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('tiny'));
app.use(cors());
app.use('/', router);
app.use(defaultRoute); // default route has to be last route
