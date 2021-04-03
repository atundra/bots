FROM node:14.15-alpine

WORKDIR /usr/src/app
COPY ./pauline-nemchak/package*.json ./
RUN npm ci --only=production

COPY ./pauline-nemchak .
COPY ./common ./node_modules/@atundra/common

CMD [ "npm", "start" ]
