const fs = require('fs');
const rl = require('readline');

let scoresFile = 'data/scores.txt'

readScoresStream = fs.createReadStream(scoresFile);

lineReader = rl.createInterface({
  input: readScoresStream
});

lineReader.on('line', line => {
  console.log(line.split(' '));
});
