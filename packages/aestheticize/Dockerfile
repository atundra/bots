FROM node:14.15-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
COPY ../common ./node_modules/@atundra/common

CMD [ "npm", "start" ]
