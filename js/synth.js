/*
MIT LICENSE
https://mit-license.org/

Copyright (c) 2021, 2020 Shawn Eary

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
const gc_bombWidth = 50;
const gc_bombHeight = 20;

const gc_defaultHouseMass = 20.0;
const gc_defaultHouseRotationalInertia = 10.0;
const gc_defaultWindowMass = 2.0;
const gc_defaultWindowRotationalInertia = 1.0;
const gc_defaultRoofMass = 10.0;
const gc_defaultRoofRotationalInertia = 2.0;

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
const gc_launch_magnitude_min = 20.0;
const gc_launch_magnitude_max = 30.0;

const gc_gravitational_acceleration = 2.0;

const gc_launch_rotation_min = -10.0;
const gc_launch_rotation_max = 10.0;
// #####################################################################
// # END Constants                                                     #
// #####################################################################

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

var houseWidth = playAreaWidth / 20;
var houseHeight = houseWidth;

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

var houses = [];

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

function blowUpHouse(h) {
    h.hasBeenBlownToBits = true;

    // For now, just fade the house out
    // Since that is easy. Can do better
    // animations in the future
    var houseParts = h.parts;
    for (var i = 0; i < houseParts.length; i++) {
        var aPart = houseParts[i];
        // https://svgjs.dev/docs/3.0/animating/
        aPart.i.animate(2000, 0, 'now').attr({ fill: '#000' });
        
        var lA = getBoundedRandNum(gc_launch_angle_min, gc_launch_angle_max);
        var lM = getBoundedRandNum(gc_launch_magnitude_min, gc_launch_magnitude_max);
        var lR = getBoundedRandNum(gc_launch_rotation_min, gc_launch_rotation_max);

        aPart.fx = lM * sine(lA);
        aPart.fy = lM * cos(lA);
        aPart.fr = lR;
    }

    // Need sound here too but that's later...
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
    var bombX = Math.floor(Math.random() * playAreaWidth);
    // var bombX = Math.floor(Math.random() * 400.0);

    // https://svgjs.com/docs/3.0/getting-started/
    var bombImage = draw.rect(gc_bombWidth, gc_bombHeight);

    // Cheat and assume.  We have plenty of vertical
    // realestate in the Bombdar so just assign the
    // height to bombdarImageWidth
    // NOTE: Bombdar is the Bomb "Radar"
    var bombdarImage = draw.rect(bombdarImageWidth, bombdarImageWidth);

    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    var colorIndex = Math.floor(Math.random() * 5.0);
    var digit1 = Math.floor(Math.random() * 10.0);
    var digit2 = Math.floor(Math.random() * 10.0);
    const sum = digit1 + digit2;
    var color; 
    var r;
    var g;
    var b;
    if (colorIndex > 3.9) {
        r = 6; g = 0; b = 100;
    } else if (colorIndex > 2.9) {
        r = 6; g = 97; b = 14;
    } else if (colorIndex > 1.9) {
        r = 41; g = 97; b = 100;
    } else if (colorIndex > 0.9) {
        r = 94; g = 76; b = 90;
    } else {
        r = 113; g = 255; b = 120;
        // bombImage.fill(color);        
        // bombImage.fill('#3ff');
    }
    // https://stackoverflow.com/questions/2173229/how-do-i-write-a-rgb-color-value-in-javascript
    var color = "rgb(" + r + ", " + g + ", " + b + ")";

    // Not sure this is 100% accurate, but it's likely good
    // enough for me...
    // rjmunro
    // https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color
    const Y = 0.375 * r + 0.5 * g + 0.125 * b;

    bombImage.fill(color);
    bombdarImage.fill('#ddd');

    // https://svgjs.dev/docs/3.0/shape-elements/#svg-text
    var bombString = digit1 + ' + ' + digit2;
    var bombText = draw.text(
        function(add) {
            // Not sure what dx is supposed to do.  I need to be able
            // to scale the background of the bomb to fit the text
            var whatDoesDXDo = 80;
            
            if (Y > (255.0 / 2.0)) {
                add.tspan(bombString).fill('#000').dx(whatDoesDXDo);
            } else {
                add.tspan(bombString).fill('#fff').dx(whatDoesDXDo);
            }            
        }
    );
    

    // https://www.w3schools.com/js/js_objects.asp
    var someBomb = {
        elevation: bombElevation,
        originalElevation: bombElevation,
        oscillator: someOscillator, 
        gain: someGain, 
        active: true, 
        x: bombX,
        img: bombImage,
        bText: bombText,
        bImg: bombdarImage,
        bSum: (digit1 + digit2)
    };
    bombs.push(someBomb);
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
    frameUpdateId = setInterval(updateBombs, 1000.0 / 60.0);
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
    if(theEntireWorldHasBeenDestroyedByEvilWickedBrainwashingAliens) {
        // https://developer.mozilla.org/en-US/docs/Web/API/setInterval
        clearInterval(frameUpdateId);

        // https://svgjs.dev/docs/3.0/shape-elements/#svg-text
        var text = draw.text(
            "The entire world has been destroyed by evil wicked\n" +
            "brainwashing aliens. I'm sorry to give such a\n" +
            "mellowdramatic ending. Now we should all run into\n" +
            "the corner and cry like raving lunatics.\n" +
            "(Make sure to get permission from your parents before" +
            "doing that...)\n\n" + 
            "Press F5 to restart.\n" + 
            "Not that you would want too..."
        );
        text.fill('#FFF');
        text.move(gWidth / 4.5, gHeight / 4.5); // Hack for now. Need better corrdinate determinations

        nukeBombs(false);
        return; 
    }

    // "Garbage collect" dead bombs
    nukeBombs(true);

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
            var bombText = curBomb.bText;
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
            bombText.move(
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

                // See if the bomb hit a house
                var houseHit = false;
                for(var i = 0; ((i < houses.length) && (!houseHit)); i++) {
                    var aHouse = houses[i];
                    if ((aHouse.hasBeenBlownToBits == false) && 
                        (bombHitHouse(curBomb, aHouse))) {

                        blowUpHouse(aHouse);

                        // Likely an example of premature optimization
                        // on my part
                        houseHit = true; 
                    }
                }                
            } 

            // numUnexplodedHouses is not an efficient function
            // but I don't care
            if (numUnexplodedHouses() < 1) {
                theEntireWorldHasBeenDestroyedByEvilWickedBrainwashingAliens = true;
            }
        }
    }
    
    // Cheat and Sneek in house animation here also
    for (var k = 0; k < houses.length; k++) {
        var someHouse = houses[k];
        if (someHouse.hasBeenBlownToBits) {
            // Need to update the physics for each house part
            for(var l = 0; l < someHouse.parts.length; l++) {
                var someHousePart = someHouse.parts[l];
                var mass;
                var rI; 
                if (someHousePart.type === "Window") {
                    mass = gc_defaultWindowMass;
                    rI = gc_defaultWindowRotationalInertia;
                } else if (someHousePart.type = "Roof") {
                    mass = gc_defaultRoofMass;
                    rI = gc_defaultRoofRotationalInertia;
                } else {
                    // Assume house body
                    mass = gc_defaultHouseMass;
                    rI = gc_defaultHouseRotationalInertia;
                }

                // For now, we are only dealing with impact forces
                // except for gravity
                var pFX = someHousePart.fx;
                if (Math.abs(pFX) > gc_floatingPointFudgeFactor) {
                    someHousePart.ax += pFX / mass;

                    /* Since this is a impact force for now,
                       set it back to zero */ 
                    someHousePart.fx = 0.0; 
                }
                var pFY = someHousePart.fy;
                if (Math.abs(pFY) > gc_floatingPointFudgeFactor) {
                    someHousePart.ay += pFY / mass;                  

                    /* Since this is a impact force for now,
                       set it back to zero */ 
                    someHousePart.fy = 0.0; 

                    // Account for gravity
                    someHousePart.ay -= gc_gravitational_acceleration;
                }
                var pFR = someHousePart.fr;
                if (Math.abs(pFR) > gc_floatingPointFudgeFactor) {
                    someHousePart.ar += pFR / rI;

                    /* Since this is a impact force for now,
                       set it back to zero */ 
                    someHousePart.fr = 0.0; 
                }

                // Now update velocity and position based on the accelerations
                // that were calculated
                someHousePart.vx += someHousePart.ax;
                someHousePart.vy += someHousePart.ay;
                someHousePart.vr += someHousePart.ar;

                someHousePart.x += someHousePart.vx;
                someHousePart.y += someHousePart.vy;
                someHousePart.r += someHousePart.vr;

                var window1Cord = logicalToPlayArea(
                    {
                        x: someHousePart.x,
                        y: someHousePart.y
                    }
                );
                someHousePart.i.move(window1Cord.x, window1Cord.y);
                someHousePart.i.rotate(someHousePart.r);
            }

            // Ideally, we would stop doing this at some point
            // but i'll get to that later. I probably need
            // to conver this little code to TypeScript before
            // I drive myself crazy...
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
    var physY = gHeight - scaledY;
    var physical = {
        x: physX,
        y: physY
    };
    return physical;
}


