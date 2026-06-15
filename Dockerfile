FROM node:22-alpine AS build

ADD . /code
WORKDIR /code
RUN npm ci
RUN npm run build

FROM node:22-alpine AS runtime

COPY --from=build /code /code
WORKDIR /code

EXPOSE 5000
CMD ["npm", "run", "start"]