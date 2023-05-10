const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.emnmy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    client.connect();
    const userCollection = client.db("Find-Tools").collection("users");
    const productCollection = client.db("Find-Tools").collection("products");
    const ordersCollection = client.db("Find-Tools").collection("orders");
    const reviewsCollection = client.db("Find-Tools").collection("reviews");
    const paymentCollection = client.db("Find-Tools").collection("payment");

    // app.get('/products', (req, res)=>{

    // })

    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/users", verifyJWT, async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      res.send(user);
    });
    app.get("/product/:id", async (req, res) => {
      const productId = req.params.id;
      const productQuery = { _id: ObjectId(productId) };
      const singleProduct = await productCollection.findOne(productQuery);
      res.send(singleProduct);
    });
    app.put("/product/:id", async (req, res) => {
      const productId = req.params.id;
      const productQuantity = req.body;
      const filter = { _id: ObjectId(productId) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          productQuantity: productQuantity.productQuantity,
        },
      };
      const updatedResult = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(updatedResult);
    });

    app.put("/update-product/:id", verifyJWT, async (req, res) => {
      const productId = req.params.id;
      const product = req.body;
      console.log(product);
      const filter = { _id: ObjectId(productId) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          productName: product.productName,
          productDescription: product.productDescription,
          productQuantity: product.productQuantity,
          productMinimumQuantity: product.productMinimumQuantity,
          productPrice: product.productPrice,
        },
      };
      const updatedResult = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(updatedResult);
    });

    app.get("/allOrders", verifyJWT, async (req, res) => {
      const query = {};
      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });
    app.post("/order", verifyJWT, (req, res) => {
      const order = req.body;
      const result = ordersCollection.insertOne(order);
      res.send(result);
    });
    app.get("/orders", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const order = await ordersCollection.find({ email: email }).toArray();
      res.send(order);
    });
    app.get("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order);
    });
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const order = req.body;
      const price = order.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });
    app.patch("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      console.log(payment);
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "paid",
          transactionId: payment.transactionId,
        },
      };
      const updateOrder = await ordersCollection.updateOne(filter, updatedDoc);
      const result = await paymentCollection.insertOne(payment);
      res.send(updateOrder);
    });

    app.patch("/order-status/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const orderStatus = req.body;
      console.log(req.body.status, id);
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: orderStatus.status,
        },
      };
      const updateOrder = await ordersCollection.updateOne(filter, updatedDoc);
      res.send(updateOrder);
    });

    app.delete("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.deleteOne(query);
      res.send(order);
    });
    app.delete("/delete-products/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.deleteOne(query);
      console.log(id);
      res.send(product);
    });
    // app.put('/orders/:id', verifyJWT,async (req, res)=>{
    //   const ordersId = req.params.id;
    //   const ordersStatus = req.body;
    //   const filter = { _id: ObjectId(ordersId) };
    //   const options ={upsert: true};
    //   const updatedDoc = {
    //     $set:{
    //       status: ordersStatus.status,
    //     }
    //   };
    //   const updatedResult = await ordersCollection.updateOne(filter, updatedDoc, options);
    //   console.log(ordersStatus)
    //   res.send(updatedResult);
    // })
    // app.get('/orders', verifyJWT,async (req, res) => {
    //   const query = {};
    //   const cursor = ordersCollection.find(query);
    //   const orders = await cursor.toArray();
    //   res.send(orders);
    // })
    app.post("/products", verifyJWT, (req, res) => {
      const addProduct = req.body;
      const result = productCollection.insertOne(addProduct);
      res.send(result);
    });
    app.post("/review", verifyJWT, (req, res) => {
      const review = req.body;
      const result = reviewsCollection.insertOne(review);
      res.send(result);
    });
    app.put("/update/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const userDetail = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          education: userDetail.education,
          location: userDetail.location,
          phoneNumber: userDetail.phoneNumber,
          linkedInProfile: userDetail.linkedInProfile,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const adminRequest = req.decoded.email;
      const adminRequestAccount = await userCollection.findOne({
        email: adminRequest,
      });
      if (adminRequestAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
        expiresIn: "24h",
      });
      res.send({ result, token });
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const adminCheck = user.role === "admin";
      res.send({ admin: adminCheck });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Find Tools Works Successfully");
});

app.listen(port, () => {
  console.log(`Find Tools Works Successfully on port ${port}`);
});
