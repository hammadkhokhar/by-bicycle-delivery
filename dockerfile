# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor -o /usr/share/keyrings/yarnkey.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn

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
