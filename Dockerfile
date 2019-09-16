FROM node:boron

RUN npm install nodemon -g

WORKDIR /src

ADD package.json /src

RUN npm i