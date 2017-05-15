var express = require('express')
var app = express()

const fs = require('fs');
const rl = require('readline');

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
})

app.get('/graph', function (req, res) {

  console.log('Reading scores data')

  let graphData = {
    words: [],
    xValues: [],
    yValues: []
  };

  let scoresFile = 'data/scores.txt'

  readScoresStream = fs.createReadStream(scoresFile);

  lineReader = rl.createInterface({
    input: readScoresStream
  });

  lineReader.on('line', line => {
    let word, value;
    [word, value] = line.split(' ');

    graphData.words.push(word);
    graphData.xValues.push(value);
    // Generate random value for the Y axis for now
    // This halps to visualy space out the words
    graphData.yValues.push(Math.random());

  });

  lineReader.on('close', () => {
    console.log('Sending scores data to the view');
    res.send(graphData);
  });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
