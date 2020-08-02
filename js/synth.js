// https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
function start() {
    var oscillator = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = 0.5;
    oscillator.frequency.value = 300;
    oscillator.type = 'sine';

    oscillator.start();

    // https://teropa.info/blog/2016/08/10/frequency-and-pitch.html
    setTimeout(() => oscillator.frequency.value = oscillator.frequency.value / 2.0, 1000);
    setTimeout(() => oscillator.frequency.value = oscillator.frequency.value / 2.0, 2000);

    setTimeout(
        function () {
            oscillator.stop();
        },
        5000
    );
};
