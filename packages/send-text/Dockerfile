FROM node:14.15-alpine

WORKDIR /usr/src/app
COPY ./send-text/package*.json ./
RUN npm ci --only=production

COPY ./send-text/ .
COPY ./common ./node_modules/@atundra/common

CMD [ "npm", "start" ]
