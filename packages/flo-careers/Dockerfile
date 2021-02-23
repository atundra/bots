FROM node:14.15-alpine

WORKDIR /usr/src/app
COPY ./flo-careers/package*.json ./
RUN npm ci --only=production

COPY ./flo-careers .
COPY ./common ./node_modules/@atundra/common

CMD [ "npm", "start" ]
