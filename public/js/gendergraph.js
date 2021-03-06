// Store all of the graph words for user
var userWords = [];

// Dafault words
var defaultWords = 'hoped guru rule builder command drafted brilliant genius \
intelligent blonde fight police sociopath war leader thought arrested victim \
debate cocky coding power funny gossip shrill cold religion looks sewing \
pageant thigh lust fat videogames sports beautiful sexy curvy smart weak \
dramatic quiet butt villain heart emotional sex bitch love divorce breasts \
rape bossy wealth kitchen ugly working';
var defaultWordsSmall = 'brilliant genius intelligent blonde kitchen ugly working';

// This is the headers for 8 column and 4 columns graphs
const levelNames = {
  8: {0: 'so he', 1: 'very he', 2: 'he', 3: 'a bit he', 4: 'equality!', 5: 'a bit she', 6: 'she', 7: 'very she', 8: 'so she'},
  4: {0: 'so he', 1: 'he', 2: 'equality!', 3: 'she', 4: 'so she'},
  2: {0: 'he', 1: 'equality!', 2: 'she'}
};

// Spiner indicated loading of the model
var spinner = $('.spinner');
spinner.hide();

// Default number of bins
var numBins = 8;

var likesCount = 0;

// NOTE(kirill): This is not cool but fine for now
var mongolabUrl = 'https://api.mongolab.com/api/1/databases/codercat/collections/gendergraph?apiKey=cpVKwVtG0xhvVu9ujdBNOwm-673jmtSP'

if (localStorage.userWords === undefined) {
  defaultWords.split(' ').forEach((word) => {
    var wordObj = {word: word, score: -1, bin: -1};
    userWords.push(wordObj);
  });
} else {
  userWords = JSON.parse(localStorage.userWords);
}

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


function loadScores(callback) {
  let curCount = 0;
  for (model in dm) {
    let scoreFile = dm[model].wordScoresFile;
    let modelName = model;
    console.log('Loading scores for %s', modelName);
    
    $.getJSON( `${scoreFile}`, data => {
      dm[modelName].wordScores = data;
      if (Object.keys(dm).length-1 == curCount) {
        callback();
      }
      curCount++;
    });
  }
}


function scoreWords(words, model) {

  for (let key in words) {
    let i = words[key];

    var score = dm[model].wordScores[i.word];
    
    if (score !== undefined) {
      i.score = score;
    } else {
      i.score = -1;
    }
  }

  return words
}


function assignBins(words, model, numBins) {

  // Get our experimental min and max values for the dataset
  var minScore = dm[model].scoreRange[0];
  var maxScore = dm[model].scoreRange[1];

  words.forEach((i) => {
    if (i.score !== -1) {
      i.bin = scoreToBin(i.score, minScore, maxScore, numBins);
    } else {
      i.bin = -1;  // Hidden bin
    }
  });
  return words;
}


function printStatus(message) {
  var statusBar = $("#input-container .status-bar");

  statusBar.empty();
  statusBar.append(message);
}


function loadStarts() {
  var btn = $('#add-word-btn').addClass('btn-loading');
  btn.text('Loading...');
  btn.prop("disabled", true);
}


function loadEnds() {
  var btn = $('#add-word-btn');
  btn.text('Add Word');
  btn.removeClass('btn-loading');
  btn.prop("disabled", false);
}


function fetchScores (words, model, callback) {
  loadStarts();
 
  // Calculate scores and bins
  words = scoreWords(words, model);
  words = assignBins(words, model, numBins);

  loadEnds();  
  callback(words);
}


function addWordsToGraph(words) {
  var notFound = [];

  words.forEach((i) => {

    if (i.score === -1) {
      notFound.push(i.word);
      return;
    }

    // Update user words
    userWords.push(i);

    // Select apropriate bin to place word into
    var binDiv = $(`#bin-${i.bin}`);
    binDiv.append(`<div class="graph-word ${i.word} new-word">${i.word}</div>`);
  });

  if (notFound.length >= 1) {
    printStatus(`${notFound.toString().replace(/,/g, ' ')} not found`);
    notFound = [];
  } else {
    printStatus('');
  }
}


function initPlot(words) {

  var graphCanvas = $("#graph-canvas");

  // Empty graph
  graphCanvas.empty();

  // Create bins
  for (var bin = 0; bin < numBins+1; bin++) {
    var colorValue = parseInt(fit(bin, 0, numBins, 150, 50));
    var binColor = `rgb(${colorValue}, ${colorValue+100}, 240)`;
    graphCanvas.append(`<div class="word-bin" id=bin-${bin} style="background-color: ${binColor};"></div>`);

    // Append bin headers
    $(`#bin-${bin}`).append(`<div class="bin-header">${levelNames[numBins][bin]}</div>`);
  }

  // Append each word to corresponding bin
  words.forEach((i) => {
    // Skip words from hidden bin
    if (i.bin === -1) {
      return;
    }
    $(`#bin-${i.bin}`).append(`<div class="graph-word ${i.word}">${i.word}</div>`);
  });
}


/*
  This function handle show more text link callback
*/
function handleExpandClick(item) {
  var elem = $(item);
  var targetId = elem.attr('epanderTarget');

  if (targetId === undefined) {
    console.log('[-] Target id is not defined!');
    return;
  }

  var targetElem = $(`#${targetId}`);

  if (targetElem.length === 0) {
    console.log('Can not find element with id %s', targetElem);
    return;
  }

  if (! targetElem.is(':visible')) {
    targetElem.show();
    elem.text('Hide ^');
  } else {
    targetElem.hide();
    elem.text(elem.attr('defaultText'));
  }
}


function handleLikeBtnClick(item) {
  var json = JSON.stringify({likes: 11});
  var curLikes = parseInt($('#like-counter').text());
  var liked = localStorage.liked;

  if (liked) {
    return // Already liked
  }

  $('#like-img').addClass('like-clicked');

  $.ajax({
    url: mongolabUrl,
    data: JSON.stringify({'likes': curLikes + 1}),
    type: 'PUT',
    contentType: 'application/json'
  });

  $('#like-counter').text(curLikes + 1)

  localStorage.liked = true;
}


function fetchLikes(callback) {
  $.ajax( { url: mongolabUrl,
      data: JSON.stringify({'likes' : 2}),
      type: "GET",
      contentType: "application/json",
      success: function (data) {
          var likes = data[0].likes;
          // console.log("Got from mLab: ", likes);
          callback(likes);
      }
  });
}


function setLikes(likes) {
  $("#like-counter").text(likes);
}

var modelDropdown = $("#model-dropdown");

//
// End of definition

fetchLikes(setLikes);


// When document finish loading
$( document ).ready(() => {

  loadScores(() => {
    var model = modelDropdown.val() || 'wiki';
    $("#new-word-input").focus();

    // Do graph resizing on media quiry width event
    enquire.register('(min-width: 1000px)', {
      match : () => {
        console.log('Screen is more then 1000');
        numBins = 8;  // Update global bin count
        fetchScores(userWords, model, initPlot);
      }
    });

    enquire.register('(min-width: 500px) and (max-width: 1000px)', {
      match : () => {
        console.log('Screen is more then 500');
        numBins = 4;  // Update global bin count
        fetchScores(userWords, model, initPlot);
      }
    });

    enquire.register('(max-width: 500px)', {
      match : () => {
        console.log('Screen is less then 500');
        numBins = 2;  // Update global bin count
        fetchScores(userWords, model, initPlot);
      }
    });
    // End of media quired

    $('.expander-btn').each((i, obj) => {
      var defaultText = obj.getAttribute('defaultText');
      // debugger;
      obj.text = defaultText;
    });
  }); // END OF LOAD SCORE
  
});

// Register add word button callback
$("#add-word-btn").click(() => {
  // Fetch new word from the input field
  var userWordInput = $("#new-word-input");
  var inputString = userWordInput.val().trim();

  if (inputString.length < 1) {
    printStatus('please enter a word');
    return
  }

  var words = [];
  var processedWords = {};

  // Fore every word in space separated string of words
  inputString.split(' ').forEach((word) => {

    // Ignore duplicate words
    if (processedWords[word] === true) {
      return
    }

    // Convert word to lowercase
    word = word.toLowerCase();

    if (! /^[ a-z]+$/i.test(word)) {
      printStatus('characters only!');
      return
    }

    var wordDiv = $(`.graph-word.${word}`);
    // Check if this word alredy on the graph
    if (wordDiv.length) {
      // console.log("[!] This word is already on the graph");
      printStatus('already on the graph');
      wordDiv.addClass("new-word");
      setTimeout(function () {
           wordDiv.removeClass("new-word");
      }, 500);
      return
    }

    // Update user word list
    words.push({word: word, score: -1, bin: -1});

    // Add it to processed words
    processedWords[word] = true;
  });

  if (words.length >= 1) {
    fetchScores(words, modelDropdown.val() || 'wiki', addWordsToGraph);
  }

  // Clear input field
  userWordInput.val('');
});

$("#reset-btn").click(() => {
  localStorage.removeItem("userWords");
  userWords = [];
  defaultWords.split(' ').forEach((word) => {
    var wordObj = {word: word, score: -1, bin: -1};
    userWords.push(wordObj);
  });
  fetchScores(userWords, modelDropdown.val() || 'wiki', initPlot);
});

// Triger add word button when user
// press enter in the text input box
$("#new-word-input").keyup((event) => {
  if (event.keyCode == 13) {  // Enter
      $("#add-word-btn").click();
  }
});


// Model dropdown event
modelDropdown.change(() => {
  var newModel = modelDropdown.val();
  fetchScores(userWords, modelDropdown.val(), initPlot);
});


$(window).on("unload",() => {
  // Cookies.set('userWords', userWords);
  localStorage.setItem("userWords", JSON.stringify(userWords));
});
