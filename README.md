# By Bicycle Delivery

## Introduction

This project addresses the challenge of last-mile logistics through an advanced microservice. It streamlines the ordering process with features like quotation and booking, promoting eco-friendly bicycle deliveries.


# Stack

SERVER:

![NodeJS](https://img.shields.io/badge/NodeJS-21.5.0-green?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey?style=for-the-badge&logo=express&logoColor=white) ![Typescript](https://img.shields.io/badge/Typescript-4.3.5-blue?style=for-the-badge&logo=typescript&logoColor=white) ![nodemon](https://img.shields.io/badge/nodemon-2.0.12-green?style=for-the-badge&logo=nodemon&logoColor=white)

NodeJS is used as a runtime environment and Express as a framework. Typescript is used for type safety and productivity. Nodemon is used for hot reloading in development mode.

HTTP CLIENT:

![Axios](https://img.shields.io/badge/Axios-1.1.3-blue?style=for-the-badge&logo=axios&logoColor=white)

Used for making HTTP requests to Cargoboard Distance API

CACHE & BACKGROUND JOBS:

![BullMQ](https://img.shields.io/badge/BullMQ-5.1.1-yellow?style=for-the-badge&logo=npm&logoColor=white) ![IoRedis](https://img.shields.io/badge/IoRedis-5.3.2-red?style=for-the-badge&logo=redis&logoColor=white)

Redis is used as in-memory database. It's powerful data structures and fast performance makes it a great choice for caching and background jobs. In terms of performance, Redis can perform millions of operations per second which makes it ideal for scenarios where high throughput is required and latency needs to be kept at a minimum. ioRedis is used as a Redis client.

BullMQ is used for background jobs. It is a Redis-based queue for Node. It builds on top of Redis and uses the same data structures to model the queues, but it provides a simple API for enqueuing and processing jobs in Node. It also supports distributed workers out of the box.

DATABASE:

![Prisma](https://img.shields.io/badge/Prisma-5.7.1-blueviolet?style=for-the-badge&logo=prisma&logoColor=white) ![Postgresql](https://img.shields.io/badge/Postgresql-8.7.1-blue?style=for-the-badge&logo=postgresql&logoColor=white)

Prisma is used as ORM and Postgresql as a database. I prefer to use Prisma due to its type safety and robustness. Helps in productivity and reduces boilerplate code.

TESTING:

![Supertest](https://img.shields.io/badge/Supertest-6.3.3-blue?style=for-the-badge&logo=node.js&logoColor=white) ![JEST](https://img.shields.io/badge/JEST-27.0.6-red?style=for-the-badge&logo=jest&logoColor=white)

Supertest is used for testing HTTP requests and JEST is used for unit testing.

DOCS:

![Swagger JSDoc](https://img.shields.io/badge/Swagger%20JSDoc-6.2.8-green?style=for-the-badge&logo=swagger&logoColor=white) ![Swagger UI Express](https://img.shields.io/badge/Swagger%20UI%20Express-5.0.0-green?style=for-the-badge&logo=swagger&logoColor=white) ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

Swagger and Postman are used for documentation and testing API endpoints. Swagger JSDoc is used to generate a swagger.json file and Swagger UI Express to serve Swagger UI.

Logging:

![Winston](https://img.shields.io/badge/Winston-3.8.2-blue?style=for-the-badge&logo=winston&logoColor=white)

Winston is used for logging. Every request is logged in a file and also in the console.

Validation:

![Zod](https://img.shields.io/badge/Zod-3.22.4-green?style=for-the-badge&logo=npm&logoColor=white)

Zod is used for validation. It is a TypeScript-first schema declaration and validation library. It is used to validate request body, query params and path params.

## <b> App Setup </b>

### Prerequisites

- NodeJS
- Typescript
- Yarn
- Postgresql
- Redis
- Cargoboard Distance basic auth (encoded)

## Installation

- Clone the repo
- Change `.env.example` to `.env` and add your environment variables
- Redis instance can be created on [upstash](https://console.upstash.com/pages/sign-up) or locally
- Postgresql instance [supabase](https://supabase.io/) can be used or locally
- Learn more about Prisma-Postgresql setup [here](https://www.prisma.io/docs/orm/overview/databases/postgresql) and configure in env

## Start

- One command start with `yarn ready` (packages installation, tables creation, app build and start)
- Start app in production mode with `yarn start`
- Start app in development mode with `yarn dev` (nodemon is used for hot reloading, so make sure you have it installed globally)
- Test app with `yarn test`

## API Documentation

- Swagger documentation is available at the `/documentation` endpoint
- Postman collection is available in the `docs` folder

## Features List

1. **Quota Limits Handling:**

   - [x] Implement logic to respect the quota limits set by Cargoboard Distance (5 requests per minute) for requests made by API.
   - [x] Ensure the solution can handle as many client requests as possible within its processing and network resources.
   - [x] Implement a mechanism to queue and process requests efficiently.

2. **CLI Command Setup:**

   - [x] Create a CLI command that, when executed after cloning from GitHub, sets up the solution on a local machine.
   - [x] Include prompts for setting env parameters

3. **Caching Layer:**

   - [x] Implement a caching layer to check if any order is already present on the route on a given day.
   - [x] Use an efficient caching mechanism to store and retrieve order information.

4. **12-Factor Compliance:**

   - [x] Ensure the solution follows the principles of the 12-factor app, considering factors such as configuration, dependencies, and processes.

5. **Unit Tests:**

   - [x] Write and execute unit tests for critical components of the solution.

6. **OpenAPI Schema Integration:**

   - [x] Integrate the OpenAPI schema with a UI
   - [x] Documentation on how to interact with and test the API.
   - [x] Postman collection

7. **Documentation:**

   - [x] Provide comprehensive documentation for setting up, configuring, and maintaining the solution.

8. **Containerization:**
   - [x] Tested the containerized solution locally. Might face issue with Redis connection.
