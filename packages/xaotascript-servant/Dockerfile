FROM node:16-alpine

WORKDIR /usr/src/app
COPY ./xaotascript-servant/package*.json ./
RUN npm ci

COPY ./xaotascript-servant/ .
COPY ./common ./node_modules/@atundra/common

RUN npm run build

RUN npm prune --production

CMD [ "npm", "start" ]
