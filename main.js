const express = require('express');
const app = express();

// Serve static files
app.use(express.static('public'))
app.use(express.static('public/html'))

let port = process.env.PORT || 8080;

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
