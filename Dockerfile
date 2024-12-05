# Set Node as working environment
FROM node:jod

# Install nodemon globally
RUN npm i nodemon -g

# Add source directory and files into source directory in docker env
COPY . /src

# Set working directory to source
WORKDIR /src

# Install all package in package.json
RUN npm i

# Expose appropriate ports
EXPOSE 3000
EXPOSE 3443

# run command
CMD ["npm", "start"]