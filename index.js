const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');





app.get('/', (req, res) => {
    res.send('Find Tools Works Successfully')
  })
  
  app.listen(port, () => {
    console.log(`Find Tools Works Successfully on port ${port}`)
  })