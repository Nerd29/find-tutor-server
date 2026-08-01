const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://find-tutor-website-khaki.vercel.app",
    ],
    credentials: true,
  })
);
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
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

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
    // await client.connect();
    
    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

  
    
    
    const database = client.db("find-tutor");
    const tutorsCollection = database.collection("tutor-list");
    const bookingCollections=database.collection('bookings')
    const addTutorCollection=database.collection('add-tutor')
    // const result = await tutorsCollection.find({}).toArray();

    //getting all tutors data
    app.get('/tutors', async (req, res) => {

      try{
        const {search,startDate,endDate,sort}=req.query;
        let query={}
        if(search){
          query.name={$regex:search,$options:"i"} //partial matching+case insesnitive
        }

       if (startDate || endDate) {

            if (startDate) {
              query.sessionStartDate = {
                $gte: startDate
              };
            }

            if (endDate) {
              query.sessionEndDate = {
                $lte: endDate
              };
            }
        }

        let sortOptions = {};
         if (sort === 'asc') {
           sortOptions.fee = 1; // Or experience, registrationDate, etc.
         }
         else if (sort === 'desc') {
            sortOptions.fee = -1;
         }
         console.log(query)

         const result = await tutorsCollection.find(query).sort(sortOptions).toArray();
         
         res.send(result);
      }
      catch(error){
        res.status(500).send({message:"Error Fetching Tutors",error})

      }

      
    });

   

    app.get('/tutors/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    // Search for both ObjectId and string versions of _id
    let query;
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
    } else {
      query = { _id: id };
    }

    // Try finding in the main tutor list first
    let result = await tutorsCollection.findOne(query);

    // If not found in tutor-list, check the add-tutor collection
    if (!result) {
      result = await addTutorCollection.findOne(query);
    }

    if (!result) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching tutor details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
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

    
//tutor book korbo
       app.post('/booking',async(req,res)=>{
        try{
          const bookingData=req.body;
          const tutor=await tutorsCollection.findOne({
             _id: bookingData.tutorId

          })

          if(!tutor){
            return res.status(404).json({message:"No tutors data found"})
          }
          if (tutor.remainingSlots <= 0) {
          return res.status(400).json({
            message: "No available slots left"
          });
          }

          const result=await bookingCollections.insertOne(bookingData)
            await tutorsCollection.updateOne({ _id: bookingData.tutorId },
            {
              $inc: {
              remainingSlots: -1
        }
      }
    );
    res.json(result)
        }
        catch (error){
          res.status(500).json(error)
        }

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
    const bookingId = req.params.id;

    const booking = await bookingCollections.findOne({
     _id:new ObjectId(bookingId)
    });

          if(!booking){
            return res.status(404).json({message:"No tutors data found"})
          }
    const result = await bookingCollections.deleteOne({
      _id:new ObjectId(bookingId)
    });

    await tutorsCollection.updateOne(
      {
        _id: booking.tutorId
      },
      {
        $inc: {
          remainingSlots: 1
        }
      }
    );
      res.json({
      success: true,
      message: "Booking cancelled"
    });

  } 
  
  catch (error) {
    res.status(500).json(error);
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