// I can't believe I'm actually declaring a
// global variable (gasp).  Shame on me.
// More globals are sure to come...
//
// Maybe I should throw in a few GOTO statements
// for good measure (smirk)
// https://www.w3schools.com/js/js_arrays.asp
var bombs = [];

// https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
function start() {
    // Create up one bomb
    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    // var numBombs = Math.floor(Math.random() * 10.0) + 1;
    var numBombs = 2;

    for (var i = 0; i < numBombs; i++) {
        // Create a bomb between 400 and 800 ("Martian Feet") - Yeah Whatever..
        // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
        var bombElevation = Math.floor(Math.random() * 400.0) + 400.0;

        // https://www.w3schools.com/js/js_objects.asp
        var someOscillator = audioCtx.createOscillator();
        var someBomb = {
            elevation: bombElevation,
            oscillator: audioCtx.createOscillator()
        };
        bombs.push(someBomb);
    }

    // Create the oscillators for the bombs
    var someGainNode;
    var someBomb;
    for (var j = 0; j < bombs.length; j++) {
        someBomb = bombs[j];
        someGainNode = audioCtx.createGain();

        var curBombOscillator = someBomb.oscillator;
        curBombOscillator.connect(someGainNode);
        someGainNode.connect(audioCtx.destination);
        someGainNode.gain.value = 0.5;
        curBombOscillator.type = 'sine';
        curBombOscillator.frequency.value = someBomb.elevation;
        curBombOscillator.start();
    }

    // Run every "frame" which I guess is
    // every 60th of a second...
    setInterval(updateBombs, 1000.0 / 60.0);
};

function updateBombs() {
    for (var j = 0; j < bombs.length; j++) {
        curBomb = bombs[j];
        curBomb.elevation = curBomb.elevation - (80.0 / 60.0);

        // https://teropa.info/blog/2016/08/10/frequency-and-pitch.html
        var curBomb = bombs[j];
        var curBombOscillator = curBomb.oscillator;
        curBombOscillator.frequency.value = curBomb.elevation;

        if (curBomb.elevation < 50) {
            curBomb.oscillator.stop();
        }
    }
}
