const fs = require('fs');
const readline = require('readline');

function findRange (wordScores) {
  // DEBUG Find range of datasets values
  // console.log('Range ', findRange(datasets[currentDataset].wordScores));
  var min = 99999;
  var max = -99999;

  for(word in wordScores) {
    var value = wordScores[word];

    if (! isNumeric(value)) {
      console.log(value);
    } else {
      min = Math.min(value, min);
      max = Math.max(value, max);
    }
  }

  return [min, max];
}


function reduce (inFile, outFile) {

  // fs.unlinkSync(outFile);

  const rl = readline.createInterface({
    input: fs.createReadStream(inFile),
  });

  fd = fs.openSync(outFile, 'w');

  rl.on('line', (line) => {
    var word = line.split(' ')[0];
    if (/^[a-z]+$/.test(word)) {
      fs.writeSync(fd, `${line}\n`);
    }
  });
}


function txtToJson (inFile, outFile) {
  let wordScores = {};

  let data = fs.readFileSync(inFile, 'utf8');

  data = data.split('\n');

  for (var i = 0; i < data.length; i++) {
    var word = data[i].split(' ')[0];
    var score = data[i].split(' ')[1];

    if (/[a-zA-Z]+/.test(word)) {
      wordScores[word] = score;
    };
  }

  fs.writeFileSync(outFile, JSON.stringify(wordScores), 'utf8');
}


function findHighScores (inFile, hiScore) {
  const rl = readline.createInterface({
    input: fs.createReadStream(inFile),
  });

  rl.on('line', (line) => {
    var word = line.split(' ')[0];
    var score = line.split(' ')[1];

    if (score < hiScore) {
      console.log(word, score);
    }
  });
}

// findHighScores('scores/wiki.txt', 0.44);

// reduce ('scores/wiki.txt', 'scores/wiki_reduced.txt');
// reduce ('/Users/kif/Desktop/genplot-scores/gnews.txt', 'scores/gnews_reduced.txt');
// reduce ('/Users/kif/Desktop/genplot-scores/reddit.txt', 'scores/reddit_reduced.txt');


// txtToJson('scores/wiki_reduced.txt', 'scores/wiki.json');
// txtToJson('scores/reddit_reduced.txt', 'scores/reddit.json');
txtToJson('scores/gnews_reduced.txt', 'scores/gnews.json');
