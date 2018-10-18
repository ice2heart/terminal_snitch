FROM mhart/alpine-node:10
WORKDIR /app
COPY . .
RUN yarn install --production
EXPOSE 3000
CMD ["node", "app.js"]