FROM node:16-alpine

WORKDIR /usr/src/app
COPY ./xaotascript-servant/package*.json ./
RUN npm ci --only=production

COPY ./xaotascript-servant/ .
COPY ./common ./node_modules/@atundra/common

RUN npm run build

CMD [ "npm", "start" ]
