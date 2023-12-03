import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';

export const mongoDB = () => {
  const dbpwd = "y6hiMuvzO6pp3dmj";
  const uri = "mongodb+srv://sugoi:"+ dbpwd + "@cluster0.lo9ry1y.mongodb.net/?retryWrites=true&w=majority";

  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");

      const database = client.db('gmDB');
      const collection = database.collection('users');

    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);
}