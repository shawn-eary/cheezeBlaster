// https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
function start() {
    // Create up to ten bombs
    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    var numBombs = Math.floor(Math.random() * 10.0) + 1;

    // https://www.w3schools.com/js/js_arrays.asp
    var bombs = [];
    for (var i = 0; i < numBombs; i++) {
        // Create a bomb between 400 and 800 ("Martian Feet") - Yeah Whatever..
        // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
        var bombElevation = Math.floor(Math.random() * 400.0) + 400.0;

        // https://www.w3schools.com/js/js_objects.asp
        var someBomb = { elevation: bombElevation};
        bombs.push(someBomb);
    }

    // Create the oscillators for the bombs
    var someOscillator;
    var someGainNode;
    var someBomb;
    for (var j = 0; j < bombs.length; j++) {
        someBomb = bombs[j];
        someOscillator = audioCtx.createOscillator();
        someGainNode = audioCtx.createGain();

        someOscillator.connect(someGainNode);
        someGainNode.connect(audioCtx.destination);
        someGainNode.gain.value = 0.5;
        someOscillator.type = 'sine';
        someOscillator.frequency.value = someBomb.elevation;
        someOscillator.start();

        // https://teropa.info/blog/2016/08/10/frequency-and-pitch.html
        setTimeout(() => someOscillator.frequency.value = oscillator.frequency.value / 2.0, 1000);
        setTimeout(() => someOscillator.frequency.value = oscillator.frequency.value / 2.0, 2000);

        setTimeout(
            function () {
                someOscillator.stop();
            },
            5000
        );
    }
};
