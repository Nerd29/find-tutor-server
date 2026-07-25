const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 8000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;

//kohRYfeEcDaC7yTK

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

  
    
    
    const database = client.db("find-tutor");
    const tutorsCollection = database.collection("tutor-list");
    const bookingCollections=database.collection('bookings')
    // const result = await tutorsCollection.find({}).toArray();
    app.get('/tutors', async (req, res) => {
      const result = await tutorsCollection.find({}).toArray();
      
      res.send(result);

      
    });

   

    app.get('/tutors/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await tutorsCollection.findOne(query);
        res.send(result);
      });


      app.get('/booking/:userId',async(req,res)=>{
        const id=req.params.userId;
        
     
      const result=await bookingCollections.find({userId:id}).toArray();


      res.json(result)
    })

       app.post('/booking',async(req,res)=>{
      const bookingData=req.body;
      const result=await bookingCollections.insertOne(bookingData)

      res.json(result)
    })

    //delete tutor
   app.delete('/booking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) };
    const result = await bookingCollections.deleteOne(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete booking", error: error.message });
  }
});
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});