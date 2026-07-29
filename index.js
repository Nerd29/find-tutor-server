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
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const uri = process.env.MONGODB_URI;

//kohRYfeEcDaC7yTK

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

 const JWKS = createRemoteJWKSet(
      new URL('http://localhost:3000/api/auth/jwks')
    )

const verifyToken=async(req,res,next)=>{
      const authHeader=req?.headers.authorization
      if(!authHeader){
        return res.status(401).json({message:"Unauthorized"})
      }
      const token=authHeader.split(" ")[1]
      if(!token){
        return res.status(401).json({message:"Unauthorized"})
      }
       try{
        const {payload}=await jwtVerify(token,JWKS)
    console.log(payload)
    next()
    }
    catch(error){
      return res.status(403).json({message:"Forbidden"})
    }

      console.log(token)
      // next()
      

    }
   

    
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

  
    
    
    const database = client.db("find-tutor");
    const tutorsCollection = database.collection("tutor-list");
    const bookingCollections=database.collection('bookings')
    const addTutorCollection=database.collection('add-tutor')
    // const result = await tutorsCollection.find({}).toArray();
    app.get('/tutors', async (req, res) => {
      const result = await tutorsCollection.find({}).toArray();
      
      res.send(result);

      
    });

   

    app.get('/tutors/:id',verifyToken, async (req, res) => {
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

    app.get('/featured',async(req,res)=>{
      const result = await tutorsCollection                                                                                              .find().limit(6).toArray()
      res.json(result)
    })

    

       app.post('/booking',async(req,res)=>{
      const bookingData=req.body;
      const result=await bookingCollections.insertOne(bookingData)

      res.json(result)
    })

    //add-tutor api
       app.post('/tutor',async(req,res)=>{
      const tutor=req.body;
      console.log(tutor)
      const result=await addTutorCollection.insertOne(tutor)

      res.json(result)
    })

   app.get('/add-tutor', async (req, res) => {
   const result= await addTutorCollection.find().toArray()
    res.send(result);
});

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

//my-tutor delete

app.delete('/add-tutor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) };
    const result = await addTutorCollection.deleteOne(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete booking", error: error.message });
  }
});

app.patch('/add-tutor/:id',async(req,res)=>{
  const { id } = req.params;
  const updatedData=req.body
  console.log(updatedData)
  const result=await addTutorCollection.updateOne(
    {_id:new ObjectId(id)},
    {$set:updatedData}
  )
  res.json(result)
})

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