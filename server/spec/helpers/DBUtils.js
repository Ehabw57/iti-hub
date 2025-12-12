const mongoose = require("mongoose");

const MONGO_URL = "mongodb://127.0.0.1:27017/iti-hub-test";

async function connectToDB() {
  if (mongoose.connection.readyState === 1) return mongoose;
  return mongoose.connect(MONGO_URL);
}

async function clearDatabase() {
  if (mongoose.connection.readyState !== 1) return;
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    try {
      await collection.deleteMany({});
    } catch (err) {
      // ignore individual collection clear errors during tests
    }
  }
}

async function dropDatabase() {
  if (mongoose.connection.readyState !== 1) return;
  await mongoose.connection.dropDatabase();
}

async function disconnectFromDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = {
  connectToDB,
  clearDatabase,
  dropDatabase,
  disconnectFromDB,
};