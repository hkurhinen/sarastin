FROM node:carbon
WORKDIR /usr/src/sarastin
COPY package*.json ./
COPY config.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]