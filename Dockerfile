FROM node:14.4.0-alpine

ADD . /code
WORKDIR /code
RUN npm install

EXPOSE 5000

CMD ["npm", "run", "prod"]