const fs = require('fs');

function txtToJson (inFile, outFile) {
  let wordScores = {};

  let data = fs.readFileSync(inFile, 'utf8');

  data = data.split('\n');

  for (var i = 0; i < data.length; i++) {
    var word = data[i].split(' ')[0];
    var score = data[i].split(' ')[1];

    wordScores[word] = score;
  }

  fs.writeFileSync(outFile, JSON.stringify(wordScores), 'utf8');
}

// txtToJson('public/scores/wiki.txt', 'public/scores/wiki.json')
// txtToJson('public/scores/reddit.txt', 'public/scores/reddit.json')
txtToJson('public/scores/gnews.txt', 'public/scores/gnews.json')


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
