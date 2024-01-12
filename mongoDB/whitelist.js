// whitelist.js

import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const filePath = './whitelist.json'; // Change to the correct path
const collectionName = 'whitelist'; // Change to your actual collection name
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

export const mongoDBPullWhitelist = async () => {
    const { client, collection } = await connectToMongo();
  
    try {
        const documents = await collection.find({}).toArray();
    
        if (documents.length > 0) {
          const sanitizedData = documents.map(({_id, ...rest }) => rest)[0];
          const jsonData = JSON.stringify(sanitizedData, null, 2);
    
          const exportFilePath = path.join('.', 'whitelist.json'); // Change the export path as needed
          fs.writeFileSync(exportFilePath, jsonData, { flag: 'w' }); // Use the flag: 'w' to update the existing file
          //console.log(`Whitelist data updated in ${exportFilePath}`);
        } else {
          console.log('No data in the whitelist collection to update.');
        }
    } finally {
      console.log(`WhitelistData Loaded`);
      await closeMongoConnection(client);
    }
  };

  export const mongoDBPushWhitelist = async () => {
    const { client, collection } = await connectToMongo();
  
    try {
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
  
      // Fetch existing data from MongoDB
      const existingDataInMongoDB = await collection.find({}).toArray();
  
      // Identify documents to insert, update, and delete
      const documentsToInsert = [];
      const documentsToUpdate = [];
      const existingIdsInMongoDB = existingDataInMongoDB.map(doc => doc._id);
  
      for (const data of dataArray) {
        if (!existingIdsInMongoDB.includes(data._id)) {
          documentsToInsert.push(data);
        } else {
          documentsToUpdate.push(data);
        }
      }
  
      // Insert new documents
      if (documentsToInsert.length > 0) {
        await collection.insertMany(documentsToInsert);
        //console.log(`New data inserted into MongoDB`);
      }
  
      // Update existing documents
      for (const data of documentsToUpdate) {
        await collection.updateOne({ _id: data._id }, { $set: { ...data } });
        //console.log(`Data with identifier ${data._id} updated in MongoDB`);
      }
  
      // Delete documents not present in JSON file
      const documentsToDelete = existingIdsInMongoDB.filter(id => !dataArray.some(data => data._id === id));
      if (documentsToDelete.length > 0) {
        await collection.deleteMany({ _id: { $in: documentsToDelete } });
        //console.log(`Data deleted from MongoDB`);
      }
    } finally {
      await closeMongoConnection(client);
    }
  };

// Call the function to update the whitelist

