const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
delete process.env.PLANTID_API_KEY;

const diseaseRoutes = require('../routes/diseaseRoutes');
const machineRoutes = require('../routes/machineRoutes');
const cropRoutes = require('../routes/cropRoutes');
const DiseaseScan = require('../models/DiseaseScan');
const Machine = require('../models/Machine');
const User = require('../models/User');
const errorHandler = require('../middleware/errorHandler');

test('disease scan history and machine listings stay scoped to the signed-in account', async () => {
  const mongo = await MongoMemoryServer.create({ instance: { dbName: 'account_data_test' } });
  await mongoose.connect(mongo.getUri('account_data_test'));

  const app = express();
  app.use(express.json());
  app.use('/api/disease', diseaseRoutes);
  app.use('/api/machines', machineRoutes);
  app.use('/api/crops', cropRoutes);
  app.use(errorHandler);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, token, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'content-type': 'application/json' }),
        authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    return { status: response.status, body: await response.json() };
  };

  try {
    const users = await User.create([
      { name: 'Account One', email: 'account.one@example.com', phone: '9876500001', password: 'StartingPass123', roles: ['farmer'] },
      { name: 'Account Two', email: 'account.two@example.com', phone: '9876500002', password: 'StartingPass123', roles: ['farmer'] },
    ]);
    const [firstUser, secondUser] = users;
    const firstToken = jwt.sign({ id: firstUser._id }, process.env.JWT_SECRET);
    const secondToken = jwt.sign({ id: secondUser._id }, process.env.JWT_SECRET);

    await DiseaseScan.create([
      { user: firstUser._id, isHealthy: true, source: 'plant.id' },
      { user: secondUser._id, isHealthy: false, source: 'plant.id', disease: { name: 'Other account scan' } },
    ]);

    const history = await request('/disease/history', firstToken);
    assert.equal(history.status, 200);
    assert.equal(history.body.scans.length, 1);
    assert.equal(history.body.scans[0].user, String(firstUser._id));

    const machines = await Machine.create([
      { name: 'Account One Tractor', type: 'tractor', pricePerDay: 1000, ownerId: firstUser._id, ownerName: firstUser.name },
      { name: 'Account Two Tractor', type: 'tractor', pricePerDay: 1200, ownerId: secondUser._id, ownerName: secondUser.name },
    ]);

    const ownMachines = await request(`/machines?ownerId=${firstUser._id}`, firstToken);
    assert.equal(ownMachines.status, 200);
    assert.deepEqual(ownMachines.body.machines.map((machine) => machine.name), ['Account One Tractor']);

    const otherMachines = await request(`/machines?ownerId=${secondUser._id}`, firstToken);
    assert.equal(otherMachines.status, 403);

    const marketplace = await request('/machines', firstToken);
    assert.equal(marketplace.status, 200);
    assert.equal(marketplace.body.machines.length, machines.length);

    const localCrops = await request('/crops/recommend?state=ts&season=rabi', firstToken);
    assert.equal(localCrops.status, 200);
    assert.equal(localCrops.body.state, 'ts');
    assert.equal(localCrops.body.isGeneral, false);

    const generalCrops = await request('/crops/recommend?state=gj&season=rabi', firstToken);
    assert.equal(generalCrops.status, 200);
    assert.equal(generalCrops.body.isGeneral, true);

    const invalidImage = new FormData();
    invalidImage.append('image', new Blob(['gif'], { type: 'image/gif' }), 'leaf.gif');
    const rejectedUpload = await request('/disease/detect', firstToken, {
      method: 'POST',
      body: invalidImage,
    });
    assert.equal(rejectedUpload.status, 400);
    assert.match(rejectedUpload.body.message, /JPG, PNG, and WebP/);

    const validImage = new FormData();
    validImage.append('image', new Blob(['jpeg'], { type: 'image/jpeg' }), 'leaf.jpg');
    const unconfiguredAnalysis = await request('/disease/detect', firstToken, {
      method: 'POST',
      body: validImage,
    });
    assert.equal(unconfiguredAnalysis.status, 503);
    assert.match(unconfiguredAnalysis.body.message, /not configured/);
    assert.equal(await DiseaseScan.countDocuments({ user: firstUser._id }), 1);

    const oversizedImage = new FormData();
    oversizedImage.append(
      'image',
      new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' }),
      'large-leaf.png'
    );
    const rejectedLargeUpload = await request('/disease/detect', firstToken, {
      method: 'POST',
      body: oversizedImage,
    });
    assert.equal(rejectedLargeUpload.status, 400);
    assert.match(rejectedLargeUpload.body.message, /5 MB/);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await mongoose.disconnect();
    await mongo.stop();
  }
});
