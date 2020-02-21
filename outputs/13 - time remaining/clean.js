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










/*

  Input:
    Global variables
      bookCount, libraryCount, maxDays

      bookScores = [548, 684, ...];
  
      libraries = [{
          id: 0,
          bookCount: 500,
          books: [1, 2, 3],
          signupProcessDuration: 20,
          shipCapacity: 2
      }];
  
  
  Score:
    uniqueScannedBookSores
  
  Output:
    Signuporder
    BookScanOrder
*/

var signupOrder = [];
var scannedBooks = [];

function start () {
  var currentDay = 0;
  var timeRemaining = maxDays - currentDay;
  var librariesToPickFrom = getLibrariesWithHighestBookPotential(timeRemaining);
  var libraryId = librariesToPickFrom[0];
  var counter = 0;
  
  while (libraryId != null && timeRemaining > 0) {
    var timeStep = libraries[libraryId].signupProcessDuration
    currentDay += timeStep;
    timeRemaining = maxDays - currentDay;
    
    scanBooks(libraryId, timeRemaining);
    signupOrder.push(libraryId);
    libraries[libraryId].signedUp = true;

    librariesToPickFrom = getLibrariesWithHighestBookPotential(timeRemaining);
    libraryId = librariesToPickFrom[0];
    
    counter++;
    if (counter % 100 == 0) {
      console.log(counter, " and time remaining", timeRemaining );
    }
  }
  
  output(signupOrder);
}

function scanBooks (libraryId, timeRemaining) {
  var maxScanable = libraries[libraryId].shipCapacity * timeRemaining;
  var scanned = 0;
  
  for (var i = 0; i < libraries[libraryId].books.length; i++) {
    if (scanned >= maxScanable) return;
    
    if (!scannedBooks[libraries[libraryId].books[i]]) {
      scannedBooks[libraries[libraryId].books[i]] = true;
      scanned++;
    }
  }
}

function getLibrariesWithHighestBookPotential (timeRemaining) {
  var mostIds = [],
  mostBookPotential = 0;
  
  for (var k = 0; k < libraries.length; k++) {
    if (libraries[k].signedUp) continue;
    var bookPotential = Math.min(libraries[k].shipCapacity * (timeRemaining - libraries[k].signupProcessDuration), libraries[k].books.length);
    var bookPotentialScore = 0;
    
    var i = 0;
    while (bookPotential > 0 && i < libraries[k].books.length) {
      if (!scannedBooks[libraries[k].books[i]]) {
        bookPotential--;
        bookPotentialScore += bookScores[libraries[k].books[i]];
        continue;
      }
      
      i++;
    }
    
    if (mostBookPotential < bookPotentialScore) {
      mostIds = [k];
      mostBookPotential = bookPotentialScore;
    } else if (mostBookPotential == bookPotentialScore) {
      mostIds.push(k);
    }
    
  } 
  
  //console.log(mostIds.length);
  return mostIds;
  
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