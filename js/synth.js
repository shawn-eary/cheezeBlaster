/*
MIT LICENSE
https://mit-license.org/

Copyright � 2020 Shawn Eary

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation
files(the �Software�), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and / or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED �AS IS�, WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

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
const cNUM_MAIN_OSCILLATORS = cNUM_MAX_BOMBS;
var mainBombOscillators = [cNUM_MAIN_OSCILLATORS];
var mainBombGains = [cNUM_MAIN_OSCILLATORS];

// // https://stackoverflow.com/questions/62768780/how-feasible-is-it-to-use-the-oscillator-connect-and-oscillator-disconnect-m
// Initialize the oscillators
function initAudio() {
    var someOscillator;
    var someGain;
    for (var i = 0; i < cNUM_MAIN_OSCILLATORS; i++) {
        someOscillator = audioCtx.createOscillator();
        someGain = audioCtx.createGain();
        someOscillator.connect(someGain);
        someGain.gain.value = 0.0; /* No Sound at First */
        someGain.connect(audioCtx.destination);
        mainBombOscillators[i] = someOscillator;
        mainBombGains[i] = someGain;
        someOscillator.start();
    }

    // Run every "frame" which I guess is
    // every 60th of a second...
    setInterval(updateBombs, 1000.0 / 60.0);
}

// https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
// https://stackoverflow.com/questions/14308029/playing-a-chord-with-oscillatornodes-using-the-web-audio-api
function dropBombs() {
    // Create 2 two cNUM_MAX_BOMBS number of bombs
    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    var numBombs = Math.floor(Math.random() * 2.0) + (cNUM_MAX_BOMBS - 2.0);
    // var numBombs = 2;

    // BEGIN Hack: This needs to be cleaned up later with a
    // better design
    // "Nuke" old Bombs (Just Kidding)
    while (bombs.length > 0) {
        bombs.pop();
    }
    // END   Hack: This needs to be cleaned up later with a
    // better design

    for (var i = 0; i < numBombs; i++) {
        // Create a bomb between 400 and 800 ("Martian Feet") - Yeah Whatever..
        // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
        var bombElevation = Math.floor(Math.random() * 400.0) + 400.0;

        // https://www.w3schools.com/js/js_objects.asp
        var someBomb = {
            elevation: bombElevation,
            oscillatorIndex: i,
            active: true
        };
        bombs.push(someBomb);
    }

    // Activate the bomb oscillators
    var curGain;
    var curBomb;
    var curBombOscillator;
    for (var j = 0; j < bombs.length; j++) {
        curBomb = bombs[j];

        // https://middleearmedia.com/web-audio-api-oscillators/
        curBombOscillator =
            mainBombOscillators[curBomb.oscillatorIndex];
        curBombOscillator.type = 'sine';
        curBombOscillator.frequency.value = curBomb.elevation;

        curGain = mainBombGains[curBomb.oscillatorIndex];
        curGain.gain.value = 0.1;
    }
};

function updateBombs() {
    for (var j = 0; j < bombs.length; j++) {
        curBomb = bombs[j];

        // Only process active bombs.  This keeps me 
        // from having to recreate bombs all of the time
        // I can just reuse an inactive bomb when I need
        // to
        if (curBomb.active == true) {
            curBomb.elevation = curBomb.elevation - (80.0 / 60.0);

            // https://teropa.info/blog/2016/08/10/frequency-and-pitch.html
            var curBomb = bombs[j];
            var curBombOscillator =
                mainBombOscillators[curBomb.oscillatorIndex];
            curBombOscillator.frequency.value = curBomb.elevation;

            // Turn the volume for the oscillator off when the 
            // "bomb" gets beelow 50 "Martian Feet"
            if (curBomb.elevation < 50) {
                mainBombGains[curBomb.oscillatorIndex].gain.value = 0.0;
                curBomb.active = false;
            }
        }
    }
}
