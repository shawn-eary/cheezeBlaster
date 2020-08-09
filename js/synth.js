/*
MIT LICENSE
https://mit-license.org/

Copyright © 2020 Shawn Eary

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation
files(the “Software”), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and / or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// https://svgjs.com/docs/3.0/getting-started/
var draw;

var elevationTextObj;

var minElevation = 400.0;
var elevationRange = 400.0;
var maxElevation = minElevation + elevationRange;

// https://jsfiddle.net/wout/ncb3w5Lv/1/
// define document width and height
var gWidth = 800;
var gHeight = 600;

var bombdarWidth = gWidth * 0.1;

var playAreaWidth = gWidth - bombdarWidth;

// The Bombda is always going to be small so
// just pick a small but reasonable width
// and height
var bombdarImageWidth = 2;

var impactElevation = gHeight * 0.05;

/* Higher sub levels will eventually indicated more
 * difficult play.  Hard code to level 3 right now.
 * This should always be less than cNUM_MAX_BOMBS but
 * greater than or equal to one */
var playerSubLevel = 3;

// I can't believe I'm actually declaring a
// global variable (gasp).  Shame on me.
// More globals are sure to come...
//
// Maybe I should throw in a few GOTO statements
// for good measure (smirk)
// https://www.w3schools.com/js/js_arrays.asp
var bombs = [];

// https://stackoverflow.com/questions/62768780/how-feasible-is-it-to-use-the-oscillator-connect-and-oscillator-disconnect-m
const cNUM_MAX_BOMBS = 5

function makeBomb() {
    // Create a bomb between 400 and 800 ("Martian Feet") - Yeah Whatever..
    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    var bombElevation = Math.floor(Math.random() * elevationRange) + minElevation;

    // https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
    // Set up bomb oscillator and gain
    var someOscillator = audioCtx.createOscillator();
    var someGain = audioCtx.createGain();
    someOscillator.connect(someGain);
    someGain.connect(audioCtx.destination);

    someGain.gain.value = 0.1; 
    someOscillator.frequency.value = bombElevation;
    someOscillator.type = 'sine';

    someOscillator.start();

    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    var bombX = Math.floor(Math.random() * 400.0);

    // https://svgjs.com/docs/3.0/getting-started/
    var bombImage = draw.rect(10, 10);

    // Cheat and assume.  We have plenty of vertical
    // realestate in the Bombdar so just assign the
    // height to bombdarImageWidth
    var bombdarImage = draw.rect(bombdarImageWidth, bombdarImageWidth);

    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    var colorIndex = Math.floor(Math.random() * 4.0);
    if (colorIndex > 2.9) {
        bombImage.fill('#f06');
    } else if (colorIndex > 1.9) {
        bombImage.fill('#0f6');
    } else if (colorIndex > 0.9) {
        bombImage.fill('#60f');
    } else {
        bombImage.fill('#3ff');
    }
    bombdarImage.fill('#ddd');
    

    // https://www.w3schools.com/js/js_objects.asp
    var someBomb = {
        elevation: bombElevation,
        originalElevation: bombElevation,
        oscillator: someOscillator, 
        gain: someGain, 
        active: true, 
        x: bombX,
        img: bombImage,
        bImg: bombdarImage
    };
    bombs.push(someBomb);
}

function nukeDeadBombs() {
    // Remove dead bombs
    // https://www.w3schools.com/js/js_arrays.asp
    var newBombs = [];
    for (var i = 0; i < bombs.length; i++) {
        var curBomb = bombs[i];
        if (curBomb.active) {
            newBombs.push(curBomb);
        } else {
            // Dead bomb. Deactivate the oscillator
            curBomb.gain.value = 0.0;
            curBomb.oscillator.stop();
        }
    }
    // BEGIN Hack: This needs to be cleaned up later with a
    // better design
    // "Nuke" old Bombs (Just Kidding)
    while (bombs.length > 0) {
        bombs.pop();
    }
    // END   Hack: This needs to be cleaned up later with a
    // better design
    bombs = newBombs;
}

// https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
// https://stackoverflow.com/questions/14308029/playing-a-chord-with-oscillatornodes-using-the-web-audio-api
function begin() {
    // https://svgjs.com/docs/3.0/tutorials/
    // create SVG document and set its size
    // var draw = SVG('#gameArea').size(gWidth, gHeight);
    // draw.viewbox(0, 0, gWidth, gHeight);
    $('#thisShouldReallyBeSomePopup').hide();

    // https://svgjs.com/docs/3.0/getting-started/
    // initialize SVG.js
    // SVG Context
    draw = SVG().addTo('body').size(gWidth, gHeight);
    var background = draw.rect(gWidth, gHeight);
    background.move(0, 0);
    background.fill('#000');

    // Draw "grass"
    var grassWidth = gWidth - bombdarWidth;
    var grassHeight = impactElevation;
    var grass = draw.rect(grassWidth, impactElevation);
    var grassX = bombdarWidth;
    var grassY = gHeight - impactElevation;
    grass.move(grassX, grassY);
    grass.fill("#20814C");

    // Draw Bombdar background
    var bombdar = draw.rect(bombdarWidth, gHeight);
    bombdar.move(0, 0);
    bombdar.fill("#222");

    // https://api.jquery.com/append/#:~:text=A%20function%20that%20returns%20an%20HTML%20string%2C%20DOM,refers%20to%20the%20current%20element%20in%20the%20set.
    $('#body').append(
        "<p>" +
        "Click Refresh, Press F5 or " +
        "close your bowser windows to " +
        "stop this silly 'program'" + 
        "</p>"
    );

    // https://svgjs.com/docs/3.0/shape-elements/#svg-text
    elevationTextObj = draw.text("Elevations:");
    elevationTextObj.move(bombdarWidth, 0);
    elevationTextObj.fill("#FFF");

    // Run every "frame" which I guess is
    // every 60th of a second...
    setInterval(updateBombs, 1000.0 / 60.0);
};

function getNumActiveBombs() {
    var numActiveBombs = 0;
    for (var j = 0; j < bombs.length; j++) {
        if (bombs[j].active) {
            numActiveBombs++;
        }
    }
    return numActiveBombs;
}

function getTotalBombLifefactor() {
    var totalLifeFactor = 0.0;
    for (var j = 0; j < bombs.length; j++) {
        var curBomb = bombs[j];
        if (curBomb.active) {
            var curLFRatio =
                curBomb.elevation / curBomb.originalElevation;
            totalLifeFactor += curLFRatio;
        }
    }
    return totalLifeFactor;
}

function updateBombs() {

    // "Garbage collect" dead bombs
    nukeDeadBombs();

    // At any frame update, there is a small chance that
    // another bomb might be created.
    // a) Never allow more bombs than the curent
    //    playerSubLevel
    // b) The probabity of annother bomb being created
    //    should maybe be greatest when existing bombs
    //    are "old"
    // c) To keep from breaking the program, there should
    //    never be more than cNUM_MAX_BOMBS
    var numActiveBombs = getNumActiveBombs();
    var totalBombLifeFactor = getTotalBombLifefactor();

    // Hopefully this number will be from zero to 1...
    var NTBLF = 0.0;
    if (numActiveBombs > 0) {
        NTBLF = totalBombLifeFactor / numActiveBombs;
    }
    
    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    var randNumZeroToOne = Math.random();

    if (randNumZeroToOne > NTBLF) {
        // See if we can create a new bomb
        if ((bombs.length <= playerSubLevel) &&
            (bombs.length <= cNUM_MAX_BOMBS)) {

            makeBomb();
        }
    }

    var elevationText = "";
    for (var j = 0; j < bombs.length; j++) {
        curBomb = bombs[j];

        // Only process active bombs.  This keeps me 
        // from having to recreate bombs all of the time
        // I can just reuse an inactive bomb when I need
        // to
        if (curBomb.active == true) {
            curBomb.elevation = curBomb.elevation - (80.0 / 60.0);

            // https://stackoverflow.com/questions/7641818/how-can-i-remove-the-decimal-part-from-javascript-number            
            elevationText += Math.floor(curBomb.elevation) + " ";

            // https://teropa.info/blog/2016/08/10/frequency-and-pitch.html
            var curBomb = bombs[j];
            curBomb.oscillator.frequency.value = curBomb.elevation;

            // https://svgjs.com/docs/3.0/getting-started/
            var bombImage = curBomb.img;
            var bombdarImage = curBomb.bImg;

            var physBombCord = logicalToPlayArea(
                {
                    x: curBomb.x,
                    y: curBomb.elevation
                }
            );
            bombImage.move(
                physBombCord.x,
                physBombCord.y
            );

            var physBombCord2 = logicalToBombdarArea(
                {
                    x: curBomb.x,
                    y: curBomb.elevation
                }
            );
            bombdarImage.move(
                physBombCord2.x,
                physBombCord2.y
            );

            // Turn the volume for the oscillator off when the 
            // "bomb" gets below 50 "Martian Feet"
            if (curBomb.elevation < impactElevation) {
                curBomb.active = false;
            } 
        }
    }
    
    // https://svgjs.com/docs/3.0/shape-elements/#svg-text
    elevationTextObj.text("Elevations: " + elevationText);
}

function logicalToPlayArea(c) {
    var physX = c.x + bombdarWidth;
    var physY = gHeight - c.y;
    var physical = {
        x: physX,
        y: physY
    };
    return physical;
}


function logicalToBombdarArea(c) {
    var physX = c.x / playAreaWidth * bombdarWidth;
    var scaledY = (c.y / maxElevation) * gHeight;
    var physY = gHeight - c.y;
    var physical = {
        x: physX,
        y: physY
    };
    return physical;
}


