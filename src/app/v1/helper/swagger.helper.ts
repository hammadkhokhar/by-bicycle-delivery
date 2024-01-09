import * as fs from 'fs';
import * as path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';

const readSwaggerYaml = (filePath: string): any => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const yaml = require('js-yaml');
  return yaml.load(fileContent);
};

const getSwaggerSpec = (): any => {
  // Define an array of paths to your Swagger YAML files
  const swaggerPaths: string[] = [
    path.resolve('src/docs/order_v0.2.yaml'),
    // Add more paths if needed
  ];

  // Read and merge Swagger files
  const swaggerDefinitions: any[] = swaggerPaths.map(readSwaggerYaml);

  // Combine the definitions
  const mergedSwaggerDefinition: any = Object.assign({}, ...swaggerDefinitions);

  return mergedSwaggerDefinition;
};

export const setupSwagger = (app: Express.Application): any => {
  // Options for the swagger docs
  const options: swaggerJSDoc.Options = {
    swaggerDefinition: getSwaggerSpec(),
    apis: ['./src/app/v1/routes/*.ts'],
  };

  // Initialize swagger-jsdoc
  return swaggerJSDoc(options);
};
