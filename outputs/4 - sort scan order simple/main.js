const readline = require('readline');
const fs = require('fs');

if (!process.argv[2]) {
  throw 'Provide a file to run with, the file should be in the folder "inputs"';
}

const readInterface = readline.createInterface({
    input: fs.createReadStream('./inputs/' + process.argv[2]),
    console: false
});

var bookCount, libraryCount, maxDays;
var bookScores = [];
var libraries = []; 

var doingLibrary = false;
readInterface.on('line', function(line) {
  let splittedInput = line.split(" ");
  
  if (!bookCount) {
    bookCount = parseInt(splittedInput[0]);
    libraryCount = parseInt(splittedInput[1]);
    maxDays = parseInt(splittedInput[2]);
    console.log("bookCount", bookCount);
    console.log("libraryCount", libraryCount);
    console.log("maxDays", maxDays);
    return;
  }

  if (bookScores.length == 0) {
    bookScores = [];
    for (var k = 0; k < splittedInput.length; k++) {
      bookScores.push(parseInt(splittedInput[k]));
    }
    return;
  }
  
  if (!doingLibrary) {
    libraries.push({
      id: libraries.length,
      bookCount: parseInt(splittedInput[0]),
      books: [],
      signupProcessDuration: parseInt(splittedInput[1]),
      shipCapacity: parseInt(splittedInput[2])
    });
  } else {
    for (var k = 0; k < splittedInput.length; k++) {
      libraries[libraries.length - 1].books.push(parseInt(splittedInput[k]));
    }
    
    if (libraries.length == libraryCount) start();
  }
  
  doingLibrary = !doingLibrary;
});

var signupOrder = [];
var scannedBooks = [];

function start () {
  var libraryId = getLibraryWithLeastSignupTime();
  var currentDay = 0;
  
  while (libraryId != null) {
    signupOrder.push(libraryId);
    libraries[libraryId].signedUp = true;
    libraryId = getLibraryWithLeastSignupTime();
  }
  
  output(signupOrder);
}

function getLibraryWithLeastSignupTime () {
  var leastId = null,
  leastSignupTime = Infinity;
  
  for (var k = 0; k < libraries.length; k++) {
    if (libraries[k].signedUp) continue;
    if (libraries[k].signupProcessDuration < leastSignupTime) {
      leastId = k;
      leastSignupTime = libraries[k].signupProcessDuration;
    }
  }  
  
  return leastId;
}

function maxPossibleScoreForLibrary (library) {
  var score = 0;
  
  for (var k = 0; k < library.books.length; k++) {
    score += bookScores[library.books[k]];
  }
  
  return score;
}

function signupOrderToText (signupOrder) {
  var text = "" + signupOrder.length + "\n";
  
  for (var k = 0; k < signupOrder.length; k++) {
    libraries[signupOrder[k]].books.sort(function (bookA, bookB) {
      return bookScores[bookB] - bookScores[bookA];
    });

    text += libraries[signupOrder[k]].id + " " + libraries[signupOrder[k]].books.length + "\n";
    text += libraries[signupOrder[k]].books.join(" ") + "\n";
    /*
    for (var i = 0; i < libraries[signupOrder[k]].books.length; i++) {
      text += libraries[signupOrder[k]].books[i] + " ";
    }*/
  }
  
  return text;
}

function output (signupOrder) {
  fs.writeFile("./outputs/" + process.argv[2].split('.')[0] + "-" + Math.random().toString(36).substr(2, 5) + ".txt", signupOrderToText(signupOrder), function(err) {
    if(err) {
        return console.log(err);
    }
    
    console.log("The file was saved!");
  }); 
}