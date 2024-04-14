import 'reflect-metadata';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Container } from 'inversify';
import { json } from "express";
import "./endspoints/getUser";
import "./services/prisma";
import { PrismaService, prismaService } from './services/prisma';

const container = new Container();
container.bind<PrismaService>('PrismaService').toConstantValue(prismaService);

let server = new InversifyExpressServer(container);
server.setConfig((app) => {
  app.use(json());
});

const app = server.build();
app.listen(3000);