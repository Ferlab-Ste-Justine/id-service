export const options = {
  failOnErrors: true,
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ID SERVICE',
      version: '1.0.0',
    },
  },
  apis: ['src/routes/*.ts', 'src/routes/**/*.ts'],
};
