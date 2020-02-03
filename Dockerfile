FROM node:latest

WORKDIR /node/report-tracker-server

ADD ./public/ ./public/
ADD ./views/ ./views/
ADD ./src ./src/
COPY ./package.json .

RUN npm install

EXPOSE 52005

CMD [ "node", "src/index.js"]