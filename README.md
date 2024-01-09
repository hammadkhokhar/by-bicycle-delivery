

# By Bicycle Delivery

An advanced microservice transforming last-mile logistics. It offers seamless ordering features, including quotation and booking, enhancing efficiency in eco-friendly bicycle deliveries.

# Stack

BACKEDND:

![NodeJS](https://img.shields.io/badge/NodeJS-21.5.0-green?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey?style=for-the-badge&logo=express&logoColor=white) ![Typescript](https://img.shields.io/badge/Typescript-4.3.5-blue?style=for-the-badge&logo=typescript&logoColor=white) ![nodemon](https://img.shields.io/badge/nodemon-2.0.12-green?style=for-the-badge&logo=nodemon&logoColor=white)

NodeJS is used as a runtime environment and Express as a framework. Typescript is used for type safety and productivity. Nodemon is used for hot reloading in development mode.

HTTP CLIENT:

![Axios](https://img.shields.io/badge/Axios-1.1.3-blue?style=for-the-badge&logo=axios&logoColor=white) 

Used for making HTTP requests to Cargoboard Distance API

CACHE & BACKGROUND JOBS:

![BullMQ](https://img.shields.io/badge/BullMQ-5.1.1-yellow?style=for-the-badge&logo=npm&logoColor=white) ![IoRedis](https://img.shields.io/badge/IoRedis-5.3.2-red?style=for-the-badge&logo=redis&logoColor=white)![Redis](https://img.shields.io/badge/Redis-4.6.12-red?style=for-the-badge&logo=redis&logoColor=white)

Redis is used for caching and BullMQ for background jobs. For in-memory operations redis appears to be promising in terms of efficiency and scalability. It is also used for caching. BullMQ is used for background jobs. It is a Redis based queue for Node. It builds on top of Redis and uses the same data structures to model the queues, but it provides a simple API for enqueuing and processing jobs in Node. It also supports distributed workers out of the box.

DATABASE:

![Prisma](https://img.shields.io/badge/Prisma-5.7.1-blueviolet?style=for-the-badge&logo=prisma&logoColor=white) ![Postgresql](https://img.shields.io/badge/Postgresql-8.7.1-blue?style=for-the-badge&logo=postgresql&logoColor=white) 

Prisma is used as ORM and Postgresql as database. I prefer to used prisma due to its type safety and robustness. Helps in productivity and reduces boilerplate code.

TESTING:

![Supertest](https://img.shields.io/badge/Supertest-6.3.3-blue?style=for-the-badge&logo=node.js&logoColor=white) ![JEST](https://img.shields.io/badge/JEST-27.0.6-red?style=for-the-badge&logo=jest&logoColor=white)

Supertest is used for testing HTTP requests and JEST is used for unit testing.


DOCS:

![Swagger JSDoc](https://img.shields.io/badge/Swagger%20JSDoc-6.2.8-green?style=for-the-badge&logo=swagger&logoColor=white) ![Swagger UI Express](https://img.shields.io/badge/Swagger%20UI%20Express-5.0.0-green?style=for-the-badge&logo=swagger&logoColor=white) ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

Swagger and Postman are used for documentation and testing API endpoints. Swagger JSDoc is used to generate swagger.json file and Swagger UI Express to serve Swagger UI. 

Logging:

![Winston](https://img.shields.io/badge/Winston-3.8.2-blue?style=for-the-badge&logo=winston&logoColor=white) 

Winston is used for logging. Every request is logged in a file and also in console.

Validation:

![Zod](https://img.shields.io/badge/Zod-3.22.4-green?style=for-the-badge&logo=npm&logoColor=white)

Zod is used for validation. It is a TypeScript-first schema declaration and validation library. It is used to validate request body, query params and path params.


## <b> App Setup </b>

### Prerequisites

- Node.js
- Typescript
- Yarn
- Postgresql
- Redis
- Cargoboard Distance basic auth (encoded)

### Installation

- Clone the repo
- Run `yarn install` to install dependencies
- Change `.env.example` to `.env` and add your environment variables
- Run `yarn start` to start the app
- Run `yarn dev` to start the app in development mode
- Run `yarn test` to run tests

## <b> DB Setup </b>

- Install Postgresql or use a cloud service
- Create a database
- Add database url to `.env` file
- Run `npx prisma db push` to create tables
- Run `npx prisma generate` to generate prisma client
- Run `npx prisma studio` to open prisma studio

## <b> Start </b>

- Start app with `yarn start` (builds and runs the app)
- Start app in development mode with `yarn dev` (nodemon is used for hot reloading, so make sure you have it installed globally)


## <b> API Documentation </b>

- Swagger documentation is available at `/api-docs` endpoint
- Postman collection is available at `docs` folder