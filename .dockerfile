# Set Node as working environment
FROM node:erbium

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

# run command
CMD ["npm", "start"]