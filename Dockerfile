FROM node:latest
# Create app directory
WORKDIR /usr/src/app
# Install app dependencies
COPY ./src/package*.json ./
RUN npm install

ENV PORT=3000    

# Copy app source code
COPY ./src/. .
#Expose port and start application
EXPOSE $PORT
CMD [ "npm", "start" ]