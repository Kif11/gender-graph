const fit = require('range-fit');
const fs = require('fs');
const rl = require('readline');

function remap( x, oMin, oMax, nMin, nMax ){
  //range check
  if (oMin == oMax){
      console.log("Warning: Zero input range");
      return None;
  };

  if (nMin == nMax){
      console.log("Warning: Zero output range");
      return None
  }

  //check reversed input range
  var reverseInput = false;
  oldMin = Math.min( oMin, oMax );
  oldMax = Math.max( oMin, oMax );
  if (oldMin != oMin){
      reverseInput = true;
  }

  //check reversed output range
  var reverseOutput = false;
  newMin = Math.min( nMin, nMax )
  newMax = Math.max( nMin, nMax )
  if (newMin != nMin){
      reverseOutput = true;
  };

  var portion = (x-oldMin)*(newMax-newMin)/(oldMax-oldMin)
  if (reverseInput){
      portion = (oldMax-x)*(newMax-newMin)/(oldMax-oldMin);
  };

  var result = portion + newMin
  if (reverseOutput){
      result = newMax - portion;
  }

  return result;
}


let graphData = {
  words: [],
  cell: []
};

let scoresFile = 'data/scores.txt'

let readScoresStream = fs.createReadStream(scoresFile);

let lineReader = rl.createInterface({
  input: readScoresStream
});

lineReader.on('line', line => {
  let word, value;
  [word, value] = line.split(' ');

  var newVal = remap(parseInt(value), -1, 1, 0, 1);

  console.log(value, newVal);

  graphData.words.push(word);
  graphData.cell.push(value);

});
