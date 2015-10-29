FROM node:0.10.40

EXPOSE 80
ENV NODE_ENV production

COPY package.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]
