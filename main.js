const express = require('express');
const app = express();
const bodyParser = require("body-parser");

const fs = require('fs');
const rl = require('readline');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static('public'))

// Store current selected model as a string
var curMod = 'wiki';
// Data models
var dm = {
  wiki: {
    descriptions: "English Wikipedia",
    wordsCount: 71291,
    creationDate: 'March 2006',
    wordScoresFile: 'scores/wiki.json',
    wordScores: {},  // This is to store word-score pair for all of the words in the selected datasets
    scoreRange: [0.44, 0.59],  // Empirical values to provide even graph distribution
  },
  reddit: {
    descriptions: "~1.7 billion publicly available Reddit comments",
    wordsCount: 2255534,
    creationDate: 'May 2015',
    wordScoresFile: 'scores/reddit.json',
    wordScores: {},
    scoreRange: [-0.3, 0.3],
  },
  gnews: {
    descriptions: "Google News articles",
    wordsCount: -1,
    creationDate: '',
    wordScoresFile: 'scores/gnews.json',
    wordScores: {},
    scoreRange: [0.2, 0.84],
  }
};

function fit (x, min, max, a, b) {
  /*
      Source
        http://stackoverflow.com/questions/5294955/how-to-scale-down-a-range-of-numbers-with-a-known-min-and-max-value

             (b-a)(x - min)
      f(x) = --------------  + a
              max - min

      Where min, max are old min and old max
      a,b - new min and new max

  */
  return (((b-a) * (x-min)) / (max-min)) + a;
}


var isEmpty = function(obj) {
  return Object.keys(obj).length === 0;
}


function scoreToBin(score, min, max, numBins) {

  // Never user score bigger then max and min
  // This will place words to the firs or last bin
  if (score > max) {
    score = max;
  } else if (score < min) {
    score = min;
  }
  var score = fit(score, min, max, 0, numBins);
  return Math.round(score);
}


function loadScores() {
  // var scoreFile = dm[model].wordScoresFile;
  // if (isEmpty(dm[model].wordScores)) {
  //   console.log('[+] Loading words scores for %s', model);
  //   dm[model].wordScores = JSON.parse(fs.readFileSync(scoreFile, 'utf8'));
  // } else {
  //   console.log('[D] Words scores for %s already loaded', model);
  // }
  for (model in dm) {
    var scoreFile = dm[model].wordScoresFile;
    console.log('[D] Loading %s', scoreFile);
    dm[model].wordScores = JSON.parse(fs.readFileSync(scoreFile, 'utf8'));
  }
}


function scoreWords(words, model) {

  words.forEach((i) => {
    var score = dm[model].wordScores[i.word];
    if (score !== undefined) {
      i.score = score;
    } else {
      i.score = -1;
    }
  });

  return words
}


function assignBins(words, model, numBins) {

  // Get our experimental min and max values for the dataset
  var minScore = dm[model].scoreRange[0];
  var maxScore = dm[model].scoreRange[1];

  words.forEach((i) => {
    if (i.score !== undefined) {
      i.bin = scoreToBin(i.score, minScore, maxScore, numBins);
    } else {
      i.bin = -1;  // Hidden bin
    }
  });
  return words;
}


// Routes
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


app.get('/test', function (req, res) {
  res.sendFile(__dirname + '/views/test.html');
});


app.post('/getscores', function (req, res) {
  // console.log('Got from cliient: ', req.body);

  // Data from client
  let words = req.body.words;
  let model = req.body.model;
  let numBins = req.body.numBins;

  // Calculate scores and bins
  words = scoreWords(words, model);
  words = assignBins(words, model, numBins);

  // Send words back to client
  res.send(words);
});
// ROUTES END

// End definitions. Begin execution

let port = process.env.PORT || 8080;

// Load all unique scores files on startup
loadScores();

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
