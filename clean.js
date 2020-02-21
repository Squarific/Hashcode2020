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
    
    
    
  Generalized model:
    Choices:
      First order:
        Signups
          - getUnsignedLibraries()
          
      Second order:
        BooksToScan
          - getUnscannedBooksAll(books, scannedBooks)
          - getUnscannedBooksForLibrary(libraryBooks, scannedBooks)
      
    Scoring:
      uniqueScannedBookSores
        - getScore(signupOrder)
      
    Steps:
      variableTimeStep
      
    Tactics:      
      random
        - needs to be able to calculate the final score 100% correct
        - 
        
      treesearch
        - needs to be able to finish or do random jumps or something
        
      heuristic
        - getLibrariesWithHighestBookPotential
        
      genetic heuristic
        - needs to be fast enough somehow at calculating the whole thing
        
    Helper scripts later:
      - run all methods
      - run all files
      - run on multiple computers
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
  libraries[libraryId].scannedbooks = [];
  var maxScanable = libraries[libraryId].shipCapacity * timeRemaining;
  var scanned = 0;
  
  for (var i = 0; i < libraries[libraryId].books.length; i++) {
    if (scanned >= maxScanable) return;
    
    if (!scannedBooks[libraries[libraryId].books[i]]) {
      scannedBooks[libraries[libraryId].books[i]] = true;
      libraries[libraryId].scannedbooks.push(libraries[libraryId].books[i]);
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
  for (var k = 0; k < signupOrder.length; k++) {
    if (!libraries[signupOrder[k]].scannedbooks || libraries[signupOrder[k]].scannedbooks.length == 0) {
      signupOrder.splice(k);
      k--;
    }
  }
  
  var text = "" + signupOrder.length + "\n";
  
  for (var k = 0; k < signupOrder.length; k++) {
    libraries[signupOrder[k]].books.sort(function (bookA, bookB) {
      return bookScores[bookB] - bookScores[bookA];
    });
    
    if (!libraries[signupOrder[k]].scannedbooks || libraries[signupOrder[k]].scannedbooks.length == 0) {
      console.log("UH WE REMOVED LIBRARIES WITH NO SCANNED BOOKS BUT WE STILL GOT ONE WTF");
    }

    text += libraries[signupOrder[k]].id + " " + libraries[signupOrder[k]].scannedbooks.length + "\n";
    text += libraries[signupOrder[k]].scannedbooks.join(" ") + "\n";
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