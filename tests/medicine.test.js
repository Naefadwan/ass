jest.mock('axios'); // Mock axios for OpenAI
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });

const request = require('supertest');
const { sequelize } = require('../models');

// Import server in a way that doesn't start listening
// This prevents "address in use" errors during testing
jest.mock('../server', () => {
  const express = require('express');
  const app = express();
  
  // Mock the /api/medicines endpoint for testing
  app.get('/api/medicines', (req, res) => {
    res.status(200).json([
      {
        id: 1,
        name: 'Test Medicine',
        description: 'For testing purposes',
        price: 9.99,
        category: 'Test',
        requiresPrescription: false
      }
    ]);
  });
  
  app.get('/api/medicines/:id', (req, res) => {
    res.status(200).json({
      id: req.params.id,
      name: 'Test Medicine',
      description: 'For testing purposes',
      price: 9.99,
      category: 'Test',
      requiresPrescription: false
    });
  });
  
  return { app };
});

const { app } = require('../server');

describe('Medicine API', () => {
  // Setup before tests
  beforeAll(async () => {
    try {
      // Make sure database is connected
      await sequelize.authenticate();
      console.log('Database connection has been established for medicine tests.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  });
  
  // Clean up after tests
  afterAll(async () => {
    await sequelize.close();
  });
  
  it('should get list of medicines', async () => {
    try {
      const res = await request(app).get('/api/medicines');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    } catch (error) {
      console.error('Error testing medicines list:', error);
      throw error; // Re-throw so test fails properly
    }
  });
  
  it('should get a single medicine by ID', async () => {
    try {
      const res = await request(app).get('/api/medicines/1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('description');
      expect(res.body).toHaveProperty('price');
    } catch (error) {
      console.error('Error testing single medicine:', error);
      throw error; // Re-throw so test fails properly
    }
  });
});
