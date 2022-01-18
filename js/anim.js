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

const gc_basicAdditionMinBound = 0;
const gc_basicAdditionMaxBound = 18;

const gc_numAmmoPods = 6;

const gc_defaultAmmoPodMass = 10.0;
const gc_defaultAmmoPodRotationalInertia = 8.0;

const gc_ammoPodColor = '#dcb3c6';
const gc_ammoPodSelectedColor = '#9b84ff'; 

g_selectedVal = 0;

function recolorAmmo(v) {
    for (var i = 0; i < g_ammoPods.length; i++) {
        var somePod = g_ammoPods[i];
        if (somePod.number === v) {
            somePod.i.fill('#9b84ff');
            somePod.selected = true;
        } else {
            somePod.i.fill('#dcb3c6');
            somePod.selected = false;
        }
    }
}

function makeAmmoPod() {
    // I think it's okay to reuse numbers.
    var ammoFloatVal = 
        getBoundedRandNum(gc_basicAdditionMinBound, gc_basicAdditionMaxBound);
    var ammoIntVal = Math.round(ammoFloatVal);

    var ammoPodIndex = g_ammoPods.length;

    var ammoPodImage = draw.rect(ammoPodWidth, ammoPodHeight);

    var spacingBetweenPods = playAreaWidth / (gc_numAmmoPods + 1);

    var x = (ammoPodIndex + 1) * spacingBetweenPods; 
    var centeredX = x - (ammoPodWidth / 2);
    ammoPodImage.fill(gc_ammoPodColor);
    var theY = impactElevation - (impactElevation / 10)
    var physAmmoPodCord= logicalToPlayArea(
        {
            x: centeredX,
            y: theY
        }
    );
    ammoPodImage.move(physAmmoPodCord.x, physAmmoPodCord.y);

    var theText = ammoIntVal;
    var ammoPodText = draw.text(
        function(add) {
            // Not sure what dx is supposed to do.  I need to be able
            // to scale the background of the bomb to fit the text
            var whatDoesDXDo = 80;
            add.tspan(theText).fill('#000').dx(whatDoesDXDo);
        }
    );

    // https://svgjs.dev/docs/3.0/events/#element-click
    ammoPodImage.click(        
        function() {
            g_selectedVal = ammoIntVal;
            recolorAmmo(ammoIntVal);
        } 
    );

    ammoPodText.move(
        physAmmoPodCord.x, physAmmoPodCord.y
    );

    // Sloppy. I should be using inheritance
    var ammoPod = {
        i: ammoPodImage,      // Image
        m: gc_defaultAmmoPodMass,      // Mass
        rm: gc_defaultAmmoPodRotationalInertia,    // Rotational Inertia
        x: centeredX,      // x cord
        y: theY,      // y cord
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
        podText: ammoPodText,
        number: ammoIntVal,  // The answer the ammo pod holds
        selected: false
    }

    g_ammoPods.push(ammoPod);
}

function updateFrame() {
    // There should always be gc_numAmmoPods 
    while(g_ammoPods.length < gc_numAmmoPods) {
        // Create ammo pods until we have gc_numAmmoPods of them
        makeAmmoPod();
    }

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

            adjustedBombY = physBombCord.y - gc_bombHeight; // Hack 
            bombImage.move(
                physBombCord.x,
                adjustedBombY
            );

            bombText.move(
                physBombCord.x,
                adjustedBombY
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

    // Cheat and assume.  We have plenty of vertical
    // realestate in the Bombdar so just assign the
    // height to bombdarImageWidth
    // NOTE: Bombdar is the Bomb "Radar"
    var bombdarImage = draw.rect(bombdarImageWidth, bombdarImageWidth);

    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_random
    var colorIndex = Math.floor(Math.random() * 5.0);


    // We can't randomly pick digits any more
    // the sum now needs to add up to a value
    // that is used for one of the ammo pods
    var digit1; // = Math.floor(Math.random() * 10.0);
    var digit2; // = Math.floor(Math.random() * 10.0);
    
    // First, pick a number from the Ammo
    var index = Math.round(getBoundedRandNum(0, g_ammoPods.length));
    var num = g_ammoPods[index].number;

    // Second, determine the value of one of the digits
    var digitA;
    if (num > 8) {
        digitA = getBoundedRandNum(0, 9);
    } else {
        digitA = getBoundedRandNum(0, num);
    }

    // Third, the value of the second digit is the sum we want
    // minus the first digit
    var digitB = num - digitA;

    // Lastly, swap the digits half of the time
    var swapFactor = getBoundedRandNum(0, 2);
    if(swapFactor > 1) {
        digit1 = digitA;
        digit2 = digitB;
    } else {
        digit1 = digitB;
        digit2 = digitA;
    }






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

    bombdarImage.fill('#ddd');

    var bombImage = draw.rect(gc_bombWidth, gc_bombHeight);
    bombImage.fill(color);

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
    // bombText.click(
    //     bombClickFunc
    // );



    // https://www.w3schools.com/js/js_objects.asp
    var theSum = (digit1 + digit2);
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
        bSum: theSum
    };
    // Only one bomb can be selected at a time



    // https://svgjs.com/docs/3.0/getting-started/
    var bombClickFunc = 
        function() {
            if (someBomb.bSum === g_selectedVal) {
                someBomb.active = false;
            }
        };
    bombImage.click(
        bombClickFunc
    );

    bombs.push(someBomb);
}

