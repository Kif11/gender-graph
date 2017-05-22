const express = require('express')
const app = express()

const fs = require('fs');
const rl = require('readline');
const roundTo = require('round-to');
const spawn = require('child_process').spawn;


// Serve static files
app.use(express.static('public'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
})

app.get('/test', function (req, res) {
  res.sendFile(__dirname + '/views/test.html');
})

app.get('/addword', function (req, res) {

  let word = req.query.newWord;
  let genPlotBin = "modules/gender-word-plots/bin/genplot";
  let vectorbinFile = "modules/gender-word-plots/vectorbins/text8-vector.bin"

  if (! fs.existsSync(genPlotBin)) {
    console.log("Can not find genplot binary at", genPlotBin);
    return
  }

  console.log('Got word:', word);

  let genplot = spawn(genPlotBin, ['-i', vectorbinFile]);

  var responsePayload = {
    word: null,
    xValue: null,
    yValue: null
  }

  genplot.stdin.write(word);
  genplot.stdin.end();

  genplot.stdout.on('data', function(data) {

    let score = data.toString().split(' ')[1]

    console.log('Word score:', score);

    responsePayload.word = word;
    responsePayload.xValue = score;
    responsePayload.yValue = roundTo(Math.random(), 2);
  });

  genplot.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
  });

  genplot.on('close', function(code) {
    res.send(responsePayload);
  });

  genplot.on('error', (err) => {
    console.log('Failed to start child process.');
    console.log(err);
  });

})

app.get('/graph', function (req, res) {

  console.log('Reading scores data');

  let graphData = {
    words: [],
    xValues: [],
    yValues: []
  };

  let scoresFile = 'data/scores.txt'

  let readScoresStream = fs.createReadStream(scoresFile);

  let lineReader = rl.createInterface({
    input: readScoresStream
  });

  lineReader.on('line', line => {
    let word, value;
    [word, value] = line.split(' ');

    graphData.words.push(word);
    graphData.xValues.push(roundTo(parseFloat(value), 2));
    // Generate random value for the Y axis for now
    // This halps to visualy space out the words
    graphData.yValues.push(roundTo(Math.random(), 2));

  });

  lineReader.on('close', () => {
    console.log('Sending scores data to the view');
    res.send(graphData);
  });
})

let port = process.env.PORT || 5000;

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
})
