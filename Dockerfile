FROM node:0.10.40

EXPOSE 3000

COPY package.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]
