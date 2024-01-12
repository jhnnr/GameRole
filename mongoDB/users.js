import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const folderPath = './data/users';
const collectionName = 'users'; // Change to your actual collection name
const dbpwd = process.env.MONGODB_PWD;
const uri = `mongodb+srv://sugoi:${dbpwd}@cluster0.lo9ry1y.mongodb.net/?retryWrites=true&w=majority`;

const connectToMongo = async () => {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    const database = client.db('gmDB');
    const collection = database.collection(collectionName);
    return { client, collection };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

const closeMongoConnection = async (client) => {
  try {
    await client.close();
    //console.log('Connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

export const mongoDB = async () => {
  const { client, collection } = await connectToMongo();
  try {
    

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

      for (const data of dataArray) {
        const uniqueIdentifier = data.accounts[0].id; //to be checked if updating accounts correctly
        const documentWithId = { _id: uniqueIdentifier, ...data };
        const existingData = await collection.findOne({ _id: uniqueIdentifier });

        if (!existingData) {
          await collection.insertOne(documentWithId);
          //console.log(`Data from ${file} synced to MongoDB`);
        } else {
          await collection.updateOne({ _id: uniqueIdentifier }, { $set: documentWithId });
          //console.log(data)
          //console.log(`Data with identifier ${uniqueIdentifier} already exists in MongoDB, updating.`);
        }
      }
    }
  } finally {
    await closeMongoConnection(client);
  }
};

export const mongoDBToJSON = async () => {
  const { client, collection } = await connectToMongo();
  try {
    

    const documents = await collection.find({}).toArray();

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    documents.forEach((doc) => {
      const fileName = path.join(folderPath, `${doc._id}.json`);
      const jsonData = JSON.stringify(doc, null, 2);
      fs.writeFileSync(fileName, jsonData);
      //console.log(`Data with _id ${doc._id} imported to ${fileName}`);
    });
  } finally {
    console.log(`UserData Loaded`);
    await closeMongoConnection(client);
  }
};
