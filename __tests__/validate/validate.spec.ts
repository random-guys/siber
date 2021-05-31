import joi from "@hapi/joi";
import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import faker from "faker";
import { INTERNAL_SERVER_ERROR, OK, UNPROCESSABLE_ENTITY } from "http-status-codes";
import supertest, { SuperTest, Test } from "supertest";
import { ControllerError } from '../../src/errors';
import { validate } from '../../src/validate';

const isPerson = joi.object({
  name: joi.string().required(),
  age: joi.number().required(),
})

const app = express();
let request: SuperTest<Test>;

beforeAll(() => {
  app
    .use(bodyParser.json())
    .post('/person', validate(isPerson),
      (req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({ ...req.body });
      })
    .use((err, req, res, next) => {
      if (res.headersSent) return next(err);

      if ((err instanceof ControllerError)) {
        res.status(err.code).send(err.message);
      } else {
        res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
      }
    });

  request = supertest(app);
});

describe("Validator tests", () => {
  it("should validate objects based on provided schema", async () => {
    const person = {
      name: faker.name.findName(),
      age: faker.datatype.number(100),
    };

    const res = await request
      .post("/person")
      .send(person)
      .expect(OK);

    expect(res.body).toStrictEqual(person);
  });

  it("should ensure validation fails on provided schema", async () => {
    const person = {
      name: 11,
      age: faker.datatype.number(100),
    };

    const res = await request
      .post("/person")
      .send(person)
      .expect(UNPROCESSABLE_ENTITY);

    expect(res.text).toBe('One or more validation errors occured')
  });
});