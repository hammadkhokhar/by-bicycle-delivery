# Use an official Node.js runtime as a parent image
FROM node:alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install project dependencies
RUN yarn install

# Copy the rest of the application code to the working directory
COPY . .

# Install Prisma Client
RUN yarn prisma generate

# Build the TypeScript code
RUN yarn build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["yarn", "start"]
