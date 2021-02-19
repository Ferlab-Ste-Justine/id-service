import { app } from './app';
import { env } from './env';

const PORT = env.app.port;

app.listen(PORT, () => {
    console.log(`Id Service running at ${env.app.schema}://${env.app.host}:${env.app.port}`);
});
