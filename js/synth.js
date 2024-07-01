/*
MIT LICENSE
https://mit-license.org/

Copyright (c) 2024, 2021, 2020 Shawn Eary, Gemini and Chat GPT

  [Note: In many cases, it is impossible for me to tell from whom
         or where Gemini and/or Chat GPT got their information
         from. When I find an obvious source, I will cite it, but
         when I do not know, I simply cite Chat GPT or Gemini
         as applicable. This code is as much an exploratory
         learning opportunity as it is anything else and it's
         designed to be free even if I may charge for
         distribution, packaging and/or support some day]

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


// #####################################################################
// # BEGIN Constants                                                   #
// #####################################################################
var gWidth = 800;
var gHeight = 600;

// Hard coded for now 
const c_numHouses = 4;

const gc_defaultHouseMass = 10.0;
const gc_defaultHouseRotationalInertia = 8.0;
const gc_defaultWindowMass = 3.0;
const gc_defaultWindowRotationalInertia = 0.8;
const gc_defaultRoofMass = 7.0;
const gc_defaultRoofRotationalInertia = 1.6;

const gc_floatingPointFudgeFactor = 0.01;

// BEGIN: 
// https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/math/sin
const sine = Math.sin;
const cos = Math.cos;
const pi = Math.PI; 
// https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/math/sin
// END 

const rand = Math.random();
function getBoundedRandNum(min, max) {
    var spread = max - min;
    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    var returnValue = Math.floor(Math.random() * spread) + min;
    return returnValue;
}

// Just picking numbers most out of thin air right now
const gc_launch_angle_min = pi / 4.0;
const gc_launch_angle_max = 3.0 * pi / 4.0;
const gc_launch_magnitude_min = 8.0;
const gc_launch_magnitude_max = 40.0;

// const gc_gravitational_acceleration = 2.0;
const gc_gravitational_acceleration = 0.03;

const gc_launch_rotation_min = -5.0;
const gc_launch_rotation_max = 5.0;
// #####################################################################
// # END Constants                                                     #
// #####################################################################

var g_audioCtx;

// https://svgjs.com/docs/3.0/getting-started/
var draw;

var elevationTextObj;

var frameUpdateId;
var theEntireWorldHasBeenDestroyedByEvilWickedBrainwashingAliens = false;



// https://jsfiddle.net/wout/ncb3w5Lv/1/
// define document width and height


var minElevation = gHeight;
var elevationRange = 400.0;
var maxElevation = minElevation + elevationRange;


var bombdarWidth = gWidth * 0.1;

var playAreaWidth = gWidth - bombdarWidth;
var playAreaHeight = gHeight;

var houseWidth = playAreaWidth / 20;
var houseHeight = houseWidth;

// var houseWidth = playAreaWidth / 20;
// var houseHeight = houseWidth;
// const gc_bombWidth = 50;
// const gc_bombHeight = 20;
var gc_bombWidth = playAreaWidth / 10;
var gc_bombHeight = playAreaHeight / 12;



// The Bombda is always going to be small so
// just pick a small but reasonable width
// and height
var bombdarImageWidth = 2;

var impactElevation = gHeight * 0.10;

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

var houses = [];

var ammoPodWidth = playAreaWidth / 20;
var ammoPodHeight = ammoPodWidth;
var g_ammoPods = [];


// https://stackoverflow.com/questions/62768780/how-feasible-is-it-to-use-the-oscillator-connect-and-oscillator-disconnect-m
const cNUM_MAX_BOMBS = 5;

function numUnexplodedHouses() {
    var count = 0;
    for (i = 0; i < houses.length; i++) {
        if (houses[i].hasBeenBlownToBits == false) {
            count++;
        }
    }
    return count;
}

// ##############################################################
// # BEGIN: Original drafts of this code were written by        #
// #    Google Gemini and MS Bing Chat GPT. It has been         #
// #    modified slightly by Shawn Eary as needed.              #
// #                                                            #
// #    One of the sources Gemini Used appears to be            #
// #    https://noisehack.com/generate-noise-web-audio-api/     #
// ##############################################################
function playExplosion(force) {
    // Longer durations, higher frequencies and larger amplitudes 
    // for stronger explosions    
    secondsToPlay = force;
    msToPlay = secondsToPlay * 1000;
    filterFreq = (force - 0.8) * 700;  // Hack modification from original Gemini code
    gainOriginalValue = 0.7;

    // if (!window.AudioContext) {
    //   throw new Error("Web Audio API not supported");
    // }
    // const audioCtx = new AudioContext();
  
    // Create ScriptProcessorNode for custom oscillator
    const bufferSize = 4096;
    const whiteNoise = g_audioCtx.createScriptProcessor(bufferSize, 1, 1);

    // Generate random white noise values in the audio process callback
    whiteNoise.onaudioprocess = function(event) {
        const outputBuffer = event.outputBuffer;
        const outputData = outputBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // Generate random values between -1 and 1 for white noise
            outputData[i] = Math.random() * 2 - 1;
        }
    };
  
    // Create low-pass filter
    const filter = g_audioCtx.createBiquadFilter();
    filter.type = "lowpass";
  
    // Gain node for volume control
    const gainNode = g_audioCtx.createGain();
  
    // Connect nodes
    whiteNoise.connect(filter);
    filter.connect(gainNode);
    // gainNode.gain.value = 0.5;
    gainNode.gain.value = gainOriginalValue;
    gainNode.connect(g_audioCtx.destination);
    // gainNode.gain.value = 0.0;

    filter.frequency.value = filterFreq;

    // BEGIN: This is broke for some weird reason
    // Apply gradual volume envelope (fade out)
    // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/linearRampToValueAtTime
    // This is not working for unknown reasons
    // gainNode.gain.linearRampToValueAtTime(0, msToPlay);
    // END  : This is broke for some weird reason
    // BEGIN: Alternate Code
    // Hack because linearRampToValueAtTime isn't working
    // Run every 60th of a second...
    // https://developer.mozilla.org/en-US/docs/Web/API/setInterval
    numAudioFrames = secondsToPlay * 60.0;
    gainStepDown = gainOriginalValue / numAudioFrames;
    dropVolumeId = setInterval(() => {
            gainNode.gain.value -= gainStepDown;
        }, 
        1000.0 / 60.0
    );
    // END  : Alternate Code

    // Stop after a duration based on force
    // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
    setTimeout(() => {
        whiteNoise.disconnect();
        filter.disconnect();
        gainNode.disconnect();
        clearInterval(dropVolumeId);
      }, msToPlay); // Timeout in milliseconds
}
// ##############################################################
// # BEGIN: Original drafts of this code were written by        #
// #    Google Gemini and MS Bing Chat GPT. It has been         #
// #    modified slightly by Shawn Eary as needed.              #
// #                                                            #
// #    One of the sources Gemini Used appears to be            #
// #    https://noisehack.com/generate-noise-web-audio-api/     #
// ##############################################################

function blowUpHouse(h) {
    h.hasBeenBlownToBits = true;

    // For now, just fade the house out
    // Since that is easy. Can do better
    // animations in the future
    var houseParts = h.parts;
    var totalForce = 0.0;
    for (var i = 0; i < houseParts.length; i++) {
        var aPart = houseParts[i];
        // https://svgjs.dev/docs/3.0/animating/
        // aPart.i.animate(8000, 0, 'now').attr({ fill: '#000' });
        
        var lA = getBoundedRandNum(gc_launch_angle_min, gc_launch_angle_max);
        var lM = getBoundedRandNum(gc_launch_magnitude_min, gc_launch_magnitude_max);
        var lR = getBoundedRandNum(gc_launch_rotation_min, gc_launch_rotation_max);

        aPart.fx = lM * cos(lA);
        aPart.fy = lM * sine(lA);
        aPart.fr = lR;

        totalForce += aPart.fx;
        totalForce += aPart.fy;
        totalForce += aPart.fr;
    }

    // Normalize explosion forces between 3 and 6
    const maxForce = 
        (gc_launch_angle_max + 
        gc_launch_magnitude_max + 
        gc_launch_rotation_max) * houseParts.length; 
    const forceFloor = 1.0;
    const forceCeiling = 7.0;
    forceSpread = forceCeiling - forceFloor;
    forceOffset = forceSpread * totalForce / maxForce;
    normalizedForce = forceOffset + forceFloor;
    playExplosion(normalizedForce);
}

function bombHitHouse(b, h) {
    var bombXMin = b.x;
    var bombXMax = b.x + gc_bombWidth;

    var houseXMin = h.physCord.x;
    var houseXMax = h.physCord.x + houseWidth;    

    if (bombXMin > houseXMax) {
        // Left edge of bomb exceeds this house's right X edge
        // Bomb is to right of house
        return false;
    } else if (bombXMax < houseXMin) {
        // Right edge of bomb preceeds this house's left X edge
        // Bobm is to the left of house
        return false;
    } else {
        // Bomb ain't to the right or the left of the house
        // so it must have blown up the house
        return true;
    }
}

function drawWindow(x, y) {
    var window1 = draw.rect(houseWidth / 6, houseHeight / 6);
    window1.fill('#3DD8FF');
    var window1Cord = logicalToPlayArea(
        {
            x: x,
            y: y
        }
    );
    window1.move(window1Cord.x, window1Cord.y);
    return window1;
}

function makeHousePart(i, m, rm, x, y, t) {
    var someHousePart = {
        i: i,      // Image
        m: m,      // Mass
        rm: rm,    // Rotational Inertia
        x: x,      // x cord
        y: y,      // y cord
        r: 0,      // rotation position
        fx: 0.0,   // force x
        fy: 0.0,   // force y [Other than gravity]
        fr: 0.0,   // rotational force
        ax: 0.0,   // acceleration x
        ay: 0.0,   // acceleration y
        ar: 0.0,   // totational acceleration
        vx: 0.0,   // velocity x
        vy: 0.0,   // velocity y
        vr: 0.0,   // rotational velocity
        type: t    // "Window", "Roof", "Body"
    }
    return someHousePart;
}

function makeHouse(x) {
    var houseParts = [];

    // House Body
    var houseImg = draw.rect(houseWidth, houseHeight);
    var centeredX = x - (houseWidth / 2);
    houseImg.fill('#F4E900');
    var physHouseCord = logicalToPlayArea(
        {
            x: centeredX,
            y: impactElevation + houseHeight
        }
    );
    houseImg.move(physHouseCord.x, physHouseCord.y);
    
    var someHousePart;
    someHousePart = 
        makeHousePart(
            houseImg, 
            gc_defaultHouseMass, 
            gc_defaultHouseRotationalInertia, 
            centeredX, 
            impactElevation + houseHeight, 
            "Body"
        );
    houseParts.push(someHousePart);

    // Bad Windows
    var windowElevation = impactElevation + (houseHeight * 7.0 / 8.0);
    var window1x = x - (houseWidth / 4.0);
    var window2x = x + (houseWidth / 4.0);
    var someWindow; 
    someWindow = drawWindow(window1x, windowElevation);
    someHousePart = 
        makeHousePart(
            someWindow, 
            gc_defaultWindowMass, 
            gc_defaultWindowRotationalInertia, 
            window1x, 
            windowElevation, 
            "Window",
        );
    houseParts.push(someHousePart);
    someWindow = drawWindow(window2x, windowElevation);    
    someHousePart = 
        makeHousePart(
            someWindow, 
            gc_defaultWindowMass, 
            gc_defaultWindowRotationalInertia, 
            window2x, 
            windowElevation, 
            "Window"
        );
    houseParts.push(someHousePart);

    // Roof 
    var polyString = "";
    polyString += x + "," + houseHeight + " ";
    polyString += x + houseWidth / 2 + "," + (houseHeight * 2) + " ";
    polyString += x - houseWidth / 2 + "," + (houseHeight * 2);
    var houseTop = draw.polygon(polyString);
    houseTop.fill('#FF0000');
    var physBombCord2 = logicalToPlayArea(
        {
            x: centeredX,
            y: impactElevation + (houseHeight*2)
        }
    );
    houseTop.move(physBombCord2.x, physBombCord2.y);
    someHousePart = 
        makeHousePart(
            houseTop, 
            gc_defaultRoofMass, 
            gc_defaultRoofRotationalInertia, 
            centeredX, 
            impactElevation + (houseHeight*2),
            "Roof"
        );
    houseParts.push(someHousePart);

    var someHouse = {
        physCord: {
            x: x,
            y: impactElevation + houseHeight
        },
        parts: houseParts, 
        hasBeenBlownToBits: false
    };
    houses.push(someHouse);
}

function nukeBombs(justDeadOnes) {
    // Remove dead bombs
    // https://www.w3schools.com/js/js_arrays.asp
    var newBombs = [];
    for (var i = 0; i < bombs.length; i++) {
        var curBomb = bombs[i];
        if ((curBomb.active) && (justDeadOnes)) {
            newBombs.push(curBomb);
        } else {
            // This is either a Dead Bomb or the world
            // had ended...

            // Deactivate the oscillator
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
    if (!window.AudioContext) {
        throw new Error("Web Audio API not supported");
    }  
    g_audioCtx = new AudioContext();

    // Test
    // playExplosion(5.0);
    // return;

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

    // Draw houses
    var spacingBetweenHouses = playAreaWidth / (c_numHouses + 1);
    for (var i = 0; i < c_numHouses; i++) {
        var houseLoc = (i + 1) * spacingBetweenHouses;
        makeHouse(houseLoc);
    }    

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

    // Draw a Bombdar Guideline
    // https://svgjs.com/docs/3.0/shape-elements/#svg-line
    var lineYMin = minElevation; 
    var physBombCord2 = logicalToBombdarArea(
        {
            x: 0,
            y: lineYMin
        }
    );
    var bombdarGuideLine = draw.rect(bombdarWidth, 2);
    bombdarGuideLine.move(0, physBombCord2.y);
    bombdarGuideLine.fill("#eee");

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
    // https://developer.mozilla.org/en-US/docs/Web/API/setInterval
    frameUpdateId = setInterval(updateFrame, 1000.0 / 60.0);
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
    var physY = gHeight - scaledY;
    var physical = {
        x: physX,
        y: physY
    };
    return physical;
}


