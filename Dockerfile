FROM node:latest

RUN npm install nodemon -g

WORKDIR /src

ADD package.json /src

RUN npm i

# Run the app when the container launches
CMD ["npm", "start"]