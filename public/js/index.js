// Store all of the graph words for user
var userWords = [];

// Dafault words
var defaultWords = `hoped guru rule builder command drafted brilliant genius intelligent blonde fight police sociopath war leader thought arrested victim debate cocky coding power funny gossip shrill cold religion looks sewing pageant thigh lust fat videogames sports beautiful sexy curvy smart weak dramatic quiet butt villain heart emotional sex bitch love divorce breasts rape bossy wealth kitchen ugly working`;

// This is the headers for 8 column and 4 columns graphs
const levelNames8 = {0: 'so he', 1: 'very he', 2: 'he', 3: 'a bit he', 4: 'equality!', 5: 'a bit she', 6: 'she', 7: 'very she', 8: 'so she'};
const levelNames4 = {0: 'so he', 1: 'he', 2: 'equality!', 3: 'she', 4: 'so she'};

// Spiner indicated loading of the model
var spinner = $('.spinner');
spinner.hide();

// Default number of bins
var numBins = 8;

// TODO(Kirill): This what called session cookies
// it will be clear after user exit his brouser
// See https://stackoverflow.com/questions/8733025/setting-persistent-cookies-with-javascript
// for how to implement permanent cookies
if (Cookies.get('userWords') !== undefined) {
  console.log('Loading words from cookies');
  userWords = JSON.parse(Cookies.get('userWords'));
} else {
  defaultWords.split(' ').forEach((word) => {
    userWords.push({word: word, score: -1, bin: -1});
  });
}


function fit (x, min, max, a, b) {
  return (((b-a) * (x-min)) / (max-min)) + a;
}


function printStatus(message) {
  var statusBar = $("#input-container .status-bar");

  statusBar.empty();
  statusBar.append(message);
}


function loadStarts() {
  var btn = $('.input-item.button').addClass('btn-loading');
  btn.text('Loading...');
  btn.prop("disabled", true);
}


function loadEnds() {
  var btn = $('.input-item.button');
  btn.text('Add Word');
  btn.removeClass('btn-loading');
  btn.prop("disabled", false);
}


function fetchScores (words, model, callback) {
  loadStarts();
  jQuery.ajax({
    url: 'getscores',
    type: 'POST',
    data: JSON.stringify({words: words, model: model, numBins: numBins}),
    dataType: "json",
    contentType: "application/json; charset=utf-8",
    success: function(data){
        // console.log('[D] Got back from server: ', data);
        loadEnds();
        callback(data);
    }
  });
}


function addWordsToGraph(words) {
  var notFound = [];

  words.forEach((i) => {

    if (i.score === -1) {
      notFound.push(i.word);
      return;
    }

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

    if (numBins === 8) {
      var levelNames = levelNames8;
    } else if (numBins === 4) {
      var levelNames = levelNames4;
    }

    // Append bin headers
    $(`#bin-${bin}`).append(`<div class="bin-header">${levelNames[bin]}</div>`);
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


function updateModel (words, model) {
  fetchScores(words, model, initPlot);
};


/*
  This function handle show more text link callback
*/
function handleExpandClick(item) {
  var elem = $(item);
  var targetId = elem.attr('target');

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


var modelDropdown = $("#model-dropdown");

// When document finish loading
$( document ).ready(() => {

  var model = modelDropdown.val() || 'wiki';

  $("#new-word-input").focus();

  // media query event handler
  if (matchMedia) {
    var mq = window.matchMedia("(min-width: 1000px)");
    mq.addListener(widthChange);
    widthChange(mq);
  }
  // media query change
  function widthChange(mq) {
    if (mq.matches) {
      // window width is at least 1000px
      numBins = 8;  // Update global bin count
      updateModel(userWords, model);
    } else {
      // window width is less than 1000px
      numBins = 4;
      updateModel(userWords, model);
    }
  }


  $('.expander-btn').each((i, obj) => {
    var defaultText = obj.getAttribute('defaultText');
    // debugger;
    obj.text = defaultText;
  });
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
  inputString.split(' ').forEach((word) => {

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
  });

  if (words.length >= 1) {
    fetchScores(words, modelDropdown.val() || 'wiki', addWordsToGraph);
  }

  // Clear input field
  userWordInput.val('');
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
  updateModel(userWords, modelDropdown.val())
});


$(window).on("unload",() => {
  Cookies.set('userWords', userWords);
});
