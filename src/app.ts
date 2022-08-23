import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import config from './config';
import router from './routes';

const PORT = config.app.port;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('tiny'));
app.use(cors());
app.use('/', router);

app.listen(PORT, () => {
  console.info(`Id Service running at ${config.app.schema}://${config.app.host}:${config.app.port}`);
});
