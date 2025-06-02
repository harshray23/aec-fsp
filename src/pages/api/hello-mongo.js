// pages/api/hello-mongo.js
import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("test"); // Change to your actual DB name
    const collection = db.collection("messages"); // Change to your actual collection name

    if (req.method === 'GET') {
      const docs = await collection.find({}).toArray();
      res.status(200).json(docs);
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to connect to database" });
  }
}
