const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');

const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const User = require('../models/User');
const errorHandler = require('../middleware/errorHandler');

test('role signup and profile updates reject administrator assignment while valid role changes persist', async () => {
  const mongo = await MongoMemoryServer.create({ instance: { dbName: 'role_access_test' } });
  await mongoose.connect(mongo.getUri('role_access_test'));

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use(errorHandler);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, method, body, token) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };

  try {
    const adminSignup = await request('/auth/register', 'POST', {
      name: 'Blocked Admin',
      email: 'blocked.admin@example.com',
      phone: '9876500092',
      password: 'StartingPass123',
      roles: ['admin'],
    });
    assert.equal(adminSignup.status, 400);
    assert.equal(await User.countDocuments({ email: 'blocked.admin@example.com' }), 0);

    const signup = await request('/auth/register', 'POST', {
      name: 'Role Test User',
      email: 'role.test@example.com',
      phone: '9876500093',
      password: 'StartingPass123',
      roles: ['farmer'],
    });
    assert.equal(signup.status, 201);

    const escalatedProfile = await request('/users/profile', 'PUT', { roles: ['admin'] }, signup.body.token);
    assert.equal(escalatedProfile.status, 400);

    const updatedProfile = await request('/users/profile', 'PUT', {
      roles: ['farmer', 'labour'],
    }, signup.body.token);
    assert.equal(updatedProfile.status, 200);
    assert.deepEqual(updatedProfile.body.user.roles, ['farmer', 'labour']);

    const admin = await User.create({
      name: 'Local Admin',
      email: 'admin@connectpro.demo',
      phone: '9876500094',
      password: 'ConnectProDemo!2026',
      roles: ['admin'],
    });
    assert.deepEqual(admin.roles, ['admin']);

    const adminLogin = await request('/auth/login', 'POST', {
      identifier: 'admin@connectpro.demo',
      password: 'ConnectProDemo!2026',
    });
    assert.equal(adminLogin.status, 200);
    assert.deepEqual(adminLogin.body.user.roles, ['admin']);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await mongoose.disconnect();
    await mongo.stop();
  }
});
