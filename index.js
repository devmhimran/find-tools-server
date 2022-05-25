const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


// f49a9369d3cd4355c5c89d61fa2fbc71fa5b45e2a0520d11bd56e2cdf417e27b8a4a51f0feaa31e999bd7dff23d8b3c001b46042d10d34849e2099dafd991bad


app.get('/', (req, res) => {
    res.send('Find Tools Works Successfully')
  })
  
  app.listen(port, () => {
    console.log(`Find Tools Works Successfully on port ${port}`)
  })