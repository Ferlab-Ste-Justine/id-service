FROM node:24.22.1-alpine AS build

ADD . /code
WORKDIR /code
RUN npm ci
RUN npm run build

FROM node:24.22.1-alpine AS runtime

COPY --from=build /code /code
WORKDIR /code

EXPOSE 5000
CMD ["npm", "run", "start"]
