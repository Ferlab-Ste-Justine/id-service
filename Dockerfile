FROM node:14.4.0-alpine as build

ADD . /code
WORKDIR /code
RUN npm install
RUN npm run build

FROM node:14.4.0-alpine as runtime

COPY --from=build /code /code
WORKDIR /code

EXPOSE 5000
CMD ["npm", "run", "start"]