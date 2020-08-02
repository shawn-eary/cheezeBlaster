// https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
function show() {
    frequency = document.getElementById("fIn").value;
    document.getElementById("fOut").innerHTML = frequency + ' Hz';

    switch (document.getElementById("tIn").value * 1) {
        case 0: type = 'sine'; break;
        case 1: type = 'square'; break;
        case 2: type = 'sawtooth'; break;
        case 3: type = 'triangle'; break;
    }
    document.getElementById("tOut").innerHTML = type;

    volume = document.getElementById("vIn").value / 100;
    document.getElementById("vOut").innerHTML = volume;

    duration = document.getElementById("dIn").value;
    document.getElementById("dOut").innerHTML = duration + ' ms';
}

function beep() {
    var oscillator = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = volume;
    oscillator.frequency.value = 300;    
    oscillator.type = type;

    oscillator.start();

    // https://teropa.info/blog/2016/08/10/frequency-and-pitch.html
    setTimeout(() => oscillator.frequency.value = oscillator.frequency.value / 2.0, 1000);
    setTimeout(() => oscillator.frequency.value = oscillator.frequency.value / 2.0, 2000);

    setTimeout(
        function () {
            oscillator.stop();
        },
        duration
    );
};
