FROM node:14.15-alpine

WORKDIR /usr/src/app
COPY ./aestheticize/package*.json ./
RUN npm ci --only=production

COPY ./aestheticize .
COPY ./common ./node_modules/@atundra/common

CMD [ "npm", "start" ]
