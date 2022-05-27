const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.emnmy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}



async function run() {
  try {
    await client.connect();
    const userCollection = client.db('Find-Tools').collection('users');
    const productCollection = client.db('Find-Tools').collection('products');

    // app.get('/products', (req, res)=>{

    // })

    app.get('/products', async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get('/users', async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      res.send(user);
    });

    app.put('/update/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const userDetail = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          education: userDetail.education,
          location: userDetail.location,
          phoneNumber: userDetail.phoneNumber,
          linkedInProfile: userDetail.linkedInProfile

        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })



    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const adminRequest = req.decoded.email;
      const adminRequestAccount = await userCollection.findOne({ email: adminRequest });
      if (adminRequestAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        return res.status(403).send({ message: 'forbidden access' })
      }


    })
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '24h' });
      res.send({ result, token });

    })

    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const adminCheck = user.role === 'admin';
      console.log(user);
      res.send({ admin: adminCheck })
    })

    app.post('/products', verifyJWT, (req, res) => {
      const addProduct = req.body;
      const result = productCollection.insertOne(addProduct);
      res.send(result);
    })

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Find Tools Works Successfully')
})

app.listen(port, () => {
  console.log(`Find Tools Works Successfully on port ${port}`)
})