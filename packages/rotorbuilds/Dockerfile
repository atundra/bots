FROM node:14.15-alpine

WORKDIR /usr/src/app
COPY ./rotorbuilds/package*.json ./
RUN npm ci --only=production

COPY ./rotorbuilds/ .
COPY ./common ./node_modules/@atundra/common

CMD [ "npm", "start" ]
