import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Parse the Firebase service account key JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

// Initialize the Firebase Admin SDK with the environment variables
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// Reference to the Firebase Realtime Database
const db = admin.database();
const dbRef = db.ref('/users'); // Replace with the path you want to access

const folderPath = './data/users'
// Function to PUT (update) data to the database
export const putDataToFirebase = async () => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return;
      }
  
      // Filter JSON files
      const jsonFiles = files.filter((file) => file.endsWith('.json'));
  
      // Iterate through JSON files and sync with the database
      jsonFiles.forEach((file) => {
        const filePath = path.join(folderPath, file);
        const jsonData = JSON.parse(fs.readFileSync(filePath));
        const key = file.replace('.json', ''); // Use the file name (without extension) as the key in the database
        dbRef.child(key).set(jsonData, (error) => {
          if (error) {
            console.error(`Error syncing data from ${file}:`, error);
          } else {
            console.log(`Data from ${file} synced with Firebase Realtime Database`);
          }
        });
      });
    });
  };
const createDirectoryIfNotExists = (directory) => {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  };
// Function to GET data from the database
export const getDataFromFirebase = async () => {
    try {
      createDirectoryIfNotExists(folderPath);
      const snapshot = await dbRef.once('value');
      const data = snapshot.val();
  
      // Iterate through the keys and store each key in a JSON file
      snapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const value = childSnapshot.val();
        const filename = `./data/users/${key}.json`;
        const jsonData = { [key]: value };
  
        // Write the JSON object to a file with the key as the filename
        fs.writeFileSync(filename, JSON.stringify(jsonData, null, 2));
  
        console.log(`Data retrieved and stored in ${filename}`);
      });
    } catch (error) {
      console.error('Error retrieving data:', error);
    }
  };
  


