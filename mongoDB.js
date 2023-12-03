import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const folderPath = './data/users';
const collectionName = 'users'; // Change to your actual collection name

export const mongoDB = async () => {
  const dbpwd = process.env.MONGODB_PWD;
  const uri = "mongodb+srv://sugoi:" + dbpwd + "@cluster0.lo9ry1y.mongodb.net/?retryWrites=true&w=majority";

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    //console.log('Connected to MongoDB');

    const database = client.db('gmDB');
    const collection = database.collection(collectionName);

    // Specify the folder containing JSON files
    

    // Read all files in the folder
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Ensure jsonData is an array
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

      for (const data of dataArray) {
        // Use a unique identifier field in your data
        const uniqueIdentifier = data.accounts[0].id; // Change to your actual field
        // Include _id field with the value of data.accounts[0].id
        const documentWithId = {
          _id: data.accounts[0].id,
          ...data,
        };
        const existingData = await collection.findOne({ _id : uniqueIdentifier });
       
        if (!existingData) {
          // Data doesn't exist, insert it
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
    await client.close();
    console.log('Connection closed');
  }
};

export const mongoDBToJSON = async () => {
  const dbpwd = process.env.MONGODB_PWD;
  const uri = "mongodb+srv://sugoi:" + dbpwd + "@cluster0.lo9ry1y.mongodb.net/?retryWrites=true&w=majority";

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    //console.log('Connected to MongoDB');

    const database = client.db('gmDB');
    const collection = database.collection(collectionName);

    // Retrieve all documents from the collection
    const documents = await collection.find({}).toArray();

    // Ensure the folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Iterate through documents and save each one to a JSON file
    documents.forEach((doc) => {
      const fileName = path.join(folderPath, `${doc._id}.json`);
      const jsonData = JSON.stringify(doc, null, 2);
      fs.writeFileSync(fileName, jsonData);
      console.log(`Data with _id ${doc._id} exported to ${fileName}`);
    });
  } finally {
    await client.close();
    //console.log('Connection closed');
  }
};




