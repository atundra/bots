FROM node:20.9.0-alpine

WORKDIR /usr/src/app
COPY ./gh-issue/package*.json ./
RUN npm ci --only=production

COPY ./gh-issue/ .
COPY ./common ./node_modules/@atundra/common

CMD [ "npm", "start" ]
