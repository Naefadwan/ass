jest.mock('axios'); // Mock axios for OpenAI
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const { app, server } = require('../server');
const { sequelize } = require('../config/db');

describe('Medicine API', () => {
  it('should get list of medicines', async () => {
    const res = await request(app).get('/api/medicines');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

afterAll(async () => {
  if (server && server.close) await server.close();
  if (sequelize && sequelize.close) await sequelize.close();
});
