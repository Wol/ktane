angular.module('ktane', [])
    .factory('AnnyangService', function AnnyangService($rootScope, $timeout) {
            var service = {};

            service.addCommands = function(commands) {

                _.each(commands, function(value, key){

                    var _c = value.callback;

                    value.callback = function() {
                        // As per the instructions here: https://docs.angularjs.org/error/$rootScope/inprog
                        $timeout(_c.apply(this, arguments), 5);
                    };
                });


                // Add the commands to annyang
                annyang.addCommands(commands);

            };

            service.removeCommands  = annyang.removeCommands;
            service.trigger = annyang.trigger;


            service.start = function() {
                annyang.debug(true);
                annyang.start();
            };

            return service;
        }
    )
    .controller('ktaneController', function ($scope, $q, AnnyangService, $timeout, $rootScope) {
        $scope.phrase = "";
        $scope.$q = $q;
        $scope.logitems = [];
        $scope.annyang = AnnyangService;

        var homonyms = {
            'SEE': 'C',
            'SEA': 'C',
            'EYE': 'I',
            'ARE': 'R',
            'YOU': 'U',
            'EGGS': 'X',
            'WHY': 'Y',
        };

        // We have an array of commonly misheard words for numbers here.
        var numbers = {
            '0': 0,
            'zero': 0,
            'none': 0,
            '1': 1,
            'one': 1,
            '2': 2,
            'two': 2,
            'too': 2,
            'to': 2,
            '3': 3,
            'three': 3,
            'four': 4,
            'for': 4,
            '4': 4,
            'five': 5,
            '5': 5,
            'six': 6,
            '6': 6,
        };


        $scope.simulateSpeech = function () {
            $scope.annyang.trigger($scope.phrase);
            $scope.phrase = '';
        };

        $scope.bombproperties = {};

        var newbomb = function() {
            $scope.bombproperties = {
                batteries: {
                    value: null,
                    question: "How many batteries are there",
                    response: "(zero|none|one|two|too|to|three|four|for|five|six)",
                    remap: numbers,
                },
                frk: {value: null, question: "Is there an indicator saying F R K", response: "(yes|no)"},
                car: {value: null, question: "Is there an indicator saying F R K", response: "(yes|no)"},
                parallelport: {value: null, question: "Is there a parallel port", response: "(yes|no)"},
                serialnumber_evenodd: {
                    value: null,
                    question: "Is the serial number even or odd",
                    response: "(even|odd)"
                },
                serialnumber_vowel: {
                    value: null,
                    question: "Does the serial number contain a vowel",
                    response: "(yes|no)"
                },
            };
        };

        $scope.annyang.addCommands({
            "property:clear": {
                'regexp': /^new bomb$/,
                'callback': newbomb(),
            }
        });

        newbomb();


        $scope.setCurrentModule = function (modulename, finishfunction){
            // TODO: Have a function which sets the current module name that can dynamically un-register
            // the module specific callbacks.
        };

        // Returns a promise which gets the value of a property of the bomb. If it knows it already, it'll resolve
        // instantly, but otherwise it'll ask the user.
        $scope.property = function (propertyname) {

            var property = $scope.bombproperties[propertyname];


            return $scope.$q.when(new Promise(function (resolve, reject) {

                var assignProperty = function (value) {
                    $scope.annyang.removeCommands("property");
                    if (property.remap) {
                        property.value = property.remap[value];
                    } else {
                        property.value = value;
                    }
                    resolve(property.value);
                };

                // Do the usual XHR stuff
                if (property.value !== null) {
                    resolve(property.value);
                } else {

                    $scope.annyang.addCommands({
                        "property": {
                            'regexp': new RegExp("^" + property.response + "$"),
                            'callback': assignProperty
                        }
                    });

                    $scope.say(property.question);
                }


            }));

        };

        $scope.shutup = function() {
            speechSynthesis.cancel();
        };

        $scope.say = function (string, rate) {

            var selectedvoice = null;
            var voices = speechSynthesis.getVoices();

            voices.forEach(function(voice, i) {
                if(voice.name === "Google UK English Female"){
                    selectedvoice = voice;
                }
            });

            $scope.log(string);

            // Create a new instance of SpeechSynthesisUtterance.
            var msg = new SpeechSynthesisUtterance();

            // Set the text.
            msg.text = string;

            if(rate !== undefined) {
                msg.rate = parseFloat(rate);
            }

            if(selectedvoice === null){
                return;
            }
            msg.voice = selectedvoice;

            window.speechSynthesis.speak(msg);

        };

        $scope.log = function (string) {
            $scope.logitems.push(string);
        };

        $scope.simplewires = function () {
            var name = "simplewires";
            var params = {
                numberOfWires: null,
            };

            var simpleWires = function (count) {
                $scope.log("Simple wires!" + count);
                $scope.currentmodule = name;

                if(count !== undefined) {
                    params.numberOfWires = numbers[count];
                }else{
                    params.numberOfWires = null;
                }

                $scope.annyang.addCommands({
                    "simplewires:colours": {
                        'regexp': /^(red|blue|black|yellow|white) (red|blue|black|yellow|white) (red|blue|black|yellow|white) ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)?$/,
                        'callback': wireColours
                    }
                });

                $scope.say("Colours?")

            };

            var wireColours = function (c1, c2, c3, c4, c5, c6) {
                $scope.log("Colours: ");

                var arguments = _.filter(arguments);

                var counts = {
                    red: 0,
                    blue: 0,
                    black: 0,
                    yellow: 0,
                    white: 0,
                };

                if(params.numberOfWires === null){
                    params.numberOfWires = arguments.length;
                }

                _.each(arguments, function (val) {
                    counts[val]++;
                    $scope.log(val);
                });

                if (params.numberOfWires === 3 && arguments.length === 3) {
                    if (counts.red === 0) {
                        $scope.say("Cut the second wire");
                        finish();
                    }
                    else if (counts.blue > 1) {
                        $scope.say("Cut the last blue wire");
                        finish();
                    }
                    else {
                        $scope.say("Cut the last wire");
                        finish();
                    }
                }

                if (params.numberOfWires === 4 && arguments.length === 4) {

                    var stage2 = function () {
                        if (counts.red === 0 && c4 === "yellow") {
                            $scope.say("Cut the first wire");
                            finish();
                        } else if (counts.blue === 1) {
                            $scope.say("Cut the first wire");
                            finish();
                        } else if (counts.yellow > 1) {
                            $scope.say("Cut the last wire");
                            finish();
                        } else {
                            $scope.say("Cut the second wire");
                            finish();
                        }
                    };


                    // Check to see if the count of reds is more than 1, and if so, ask what the serial number is.
                    if (counts.red > 1) {
                        $scope.property("serialnumber_evenodd").then(function (serialnumber) {
                            if (serialnumber === "odd") {
                                $scope.say("Cut the last red wire");
                                finish();
                            } else {
                                stage2();
                            }
                        });
                    } else {
                        stage2();
                    }

                }

                if (params.numberOfWires === 5 && arguments.length === 5) {

                    var stage2 = function () {
                        if (counts.red === 1 && counts.yellow > 1) {
                            $scope.say("Cut the first wire");
                            finish();
                        } else if (counts.black === 0) {
                            $scope.say("Cut the second wire");
                            finish();
                        } else {
                            $scope.say("Cut the first wire");
                            finish();
                        }
                    };


                    if (c5 === "black") {
                        $scope.property("serialnumber_evenodd").then(function (serialnumber) {
                            if (serialnumber === "odd") {
                                $scope.say("Cut the fourth wire");
                                finish();
                            } else {
                                stage2();
                            }
                        });
                    } else {
                        stage2();
                    }

                }

                if (params.numberOfWires === 6 && arguments.length === 6) {
                    var stage2 = function () {
                        if (counts.yellow === 1 && counts.white > 1) {
                            $scope.say("Cut the fourth wire");
                            finish();
                        } else if (counts.red === 0) {
                            $scope.say("Cut the last wire");
                            finish();
                        } else {
                            $scope.say("Cut the fourth wire");
                            finish();
                        }
                    };


                    if (counts.yellow === 0) {
                        $scope.property("serialnumber_evenodd").then(function (serialnumber) {
                            if (serialnumber === "odd") {
                                $scope.say("Cut the third wire");
                                finish();
                            } else {
                                stage2();
                            }
                        });
                    } else {
                        stage2();
                    }

                }
            };

            var finish = function () {
                $scope.annyang.removeCommands("simplewires:colours");
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "simple wires": {
                    'regexp': /^simple wires (three|four|for|4|3|5|6|five|six) wires$/,
                    'callback': simpleWires
                }
            });

            $scope.annyang.addCommands({
                "simple wires": {
                    'regexp': /^simple wires$/,
                    'callback': simpleWires
                }
            });



            return params;
        }();

        $scope.button = function () {
            var name = "button";
            var params = {
                colour: null,
                word: null,
            };

            var button = function (colour, word) {
                $scope.log("Button. Colour: " + colour + " word: " + word);
                $scope.currentmodule = name;
                params.colour = colour;
                params.word = word;


                if(colour === undefined && word === undefined) {
                    $scope.annyang.addCommands({
                        "button:description": {
                            'regexp': /^(?=.*\b(red|blue|white|yellow|black)\b)(?=.*\b(abort|hold|press|detonate)\b).*$/,
                            'callback': button
                        }
                    });
                    $scope.say("What is the colour and word?");
                    return;
                }

                if (word === "detonate") {
                    $scope.property("batteries").then(function (batterycount) {
                        if (batterycount > 1) {
                            pressandrelease();
                        } else {
                            holdandchecklight();
                        }
                    });
                    return;
                }
                if (colour === "white") {
                    $scope.property("car").then(function (car) {
                        if (car === "yes") {
                            holdandchecklight();
                        } else {
                            checkfrk();
                        }
                    });
                    return;
                }

                if (colour === "red" && word === "hold") {
                    pressandrelease();
                    return;
                }

                if (colour === "blue" && word === "abort") {
                    holdandchecklight();
                    return;
                }

                checkfrk();

            };

            var pressandrelease = function () {
                $scope.say("Press and release the button");
                finish();
            };


            var holdandchecklight = function () {
                $scope.say("Press and hold the button");

                $scope.annyang.addCommands({
                    "button:heldcolour": {
                        'regexp': /^(red|blue|yellow|white)?$/,
                        'callback': heldcolour
                    }
                });

            };

            var heldcolour = function (colour) {
                params.heldcolour = colour;
                if (colour === "blue") {
                    $scope.say("Release when timer has 4");
                } else if (colour === "yellow") {
                    $scope.say("Release when timer has 5");
                } else {
                    $scope.say("Release when timer has 1");
                }
                finish();
            };

            var checkfrk = function () {
                $scope.property("batteries").then(function (batterycount) {
                    if (batterycount > 2) {
                        $scope.property("frk").then(function (frk) {
                            if (frk === "yes") {
                                pressandrelease();
                            } else {
                                holdandchecklight();
                            }
                        });

                    } else {
                        holdandchecklight();
                    }
                });
            };


            var finish = function () {
                $scope.annyang.removeCommands("button:heldcolour", "button:description");
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "button": {
                    'regexp': /^button$/,
                    'callback': button
                },
                "button:withinfo": {
                    'regexp': /^button (?=.*\b(red|blue|white|yellow|black)\b)(?=.*\b(abort|hold|press|detonate)\b).*$/,
                    'callback': button
                }
            });


            return params;

        }();

        $scope.maze = function () {
            var name = "maze";
            var params = {
                startingposition: [null, null],
                targetposition: [null, null],
                selectedmaze: null,
                selectedmazeid: null,
            };

            // top = 1
            // left = 2
            // bottom = 4
            // right = 8

            // topleft = 3


            // Converts the 'top/left' only values into a top/left/bottom/right value
            var tl2tlbr = function (maze) {
                var i, j;

                for (i = 0; i < 6; i++) {
                    for (j = 0; j < 6; j++) {
                        if (i === 5 || (maze[i + 1][j] & 1)) { // If we're at the bottom, or if the next row down has the 'top' bit set
                            maze[i][j] |= 4; // then set the 'bottom' bit on this row
                        }
                    }
                }

                for (j = 0; j < 6; j++) {
                    for (i = 0; i < 6; i++) {
                        if (j === 5 || (maze[i][j + 1] & 2)) { // If we're at the right, or if the next column across has the 'left' bit set
                            maze[i][j] |= 8; // then set the 'bottom' bit on this row
                        }
                    }
                }

                return maze;

            };

            var mazes = {
                a: {'maze': tl2tlbr([ // 1,5 6,4
                    [3, 1, 1, 3, 1, 1],
                    [2, 3, 0, 2, 1, 1],
                    [2, 2, 1, 3, 1, 0],
                    [2, 3, 0, 0, 3, 0],
                    [2, 1, 1, 3, 1, 2],
                    [2, 1, 2, 0, 3, 0],
                ]), 'image': 'maze0.svg'},
                b: {'maze': tl2tlbr([ // 2,3 5,5
                    [3, 1, 1, 3, 1, 1],
                    [3, 0, 3, 0, 2, 1],
                    [2, 3, 0, 3, 1, 0],
                    [2, 0, 3, 0, 3, 2],
                    [2, 3, 2, 3, 0, 2],
                    [2, 2, 0, 2, 1, 0],
                ]), 'image': 'maze1.svg'},
                c: {'maze': tl2tlbr([
                    [3, 1, 1, 3, 3, 1],
                    [2, 3, 2, 2, 0, 2],
                    [3, 0, 2, 3, 1, 2],
                    [2, 2, 2, 2, 2, 2],
                    [2, 2, 0, 2, 2, 2],
                    [2, 1, 1, 0, 2, 0],
                ]), 'image': 'maze2.svg'},
                d: {'maze': tl2tlbr([
                    [3, 1, 3, 1, 1, 1],
                    [2, 2, 3, 1, 1, 0],
                    [2, 2, 0, 3, 1, 2],
                    [2, 3, 1, 0, 1, 0],
                    [2, 1, 1, 1, 1, 2],
                    [2, 1, 1, 3, 0, 2],
                ]), 'image': 'maze3.svg'},
                e: {'maze': tl2tlbr([
                    [3, 1, 1, 1, 1, 1],
                    [3, 1, 1, 1, 0, 2],
                    [2, 1, 3, 0, 3, 1],
                    [2, 2, 1, 1, 2, 2],
                    [2, 3, 1, 0, 1, 2],
                    [2, 2, 1, 1, 1, 0],
                ]), 'image': 'maze4.svg'},
                f: {'maze': tl2tlbr([
                    [3, 3, 1, 3, 1, 1],
                    [2, 2, 2, 3, 0, 2],
                    [2, 0, 2, 2, 3, 0],
                    [2, 1, 3, 0, 2, 3],
                    [3, 0, 2, 2, 2, 0],
                    [2, 1, 1, 0, 3, 0],
                ]), 'image': 'maze5.svg'},
                g: {'maze': tl2tlbr([
                    [3, 1, 1, 1, 3, 1],
                    [2, 3, 1, 2, 0, 2],
                    [2, 0, 3, 1, 3, 0],
                    [3, 1, 2, 1, 0, 3],
                    [2, 2, 2, 1, 1, 2],
                    [2, 1, 1, 1, 0, 0],
                ]), 'image': 'maze6.svg'},
                h: {'maze': tl2tlbr([
                    [3, 3, 1, 1, 3, 1],
                    [2, 0, 1, 2, 0, 2],
                    [2, 3, 1, 1, 1, 2],
                    [2, 2, 1, 3, 0, 0],
                    [2, 3, 2, 1, 1, 1],
                    [2, 0, 1, 1, 1, 1],
                ]), 'image': 'maze7.svg'},
                i: {'maze': tl2tlbr([
                    [3, 3, 1, 1, 1, 1],
                    [2, 2, 3, 1, 2, 2],
                    [2, 0, 0, 3, 0, 2],
                    [2, 3, 3, 0, 3, 0],
                    [2, 2, 2, 3, 1, 2],
                    [2, 0, 2, 0, 2, 1],
                ]), 'image': 'maze8.svg'},
            };

            var mazemarkers = {
                12: "a",
                63: "a",
                24: "b",
                52: "b",
                44: "c",
                64: "c",
                11: "d",
                14: "d",
                53: "e",
                46: "e",
                35: "f",
                51: "f",
                21: "g",
                26: "g",
                34: "h",
                41: "h",
                32: "i",
                15: "i",
            };

            var maze = function (x, y) {

                $scope.log("Maze");
                $scope.currentmodule = name;

                if(x === undefined && y === undefined){
                    $scope.say("Give the coordinates of a green circle");
                    params.selectedmaze = null;

                    $scope.annyang.addCommands({
                        "maze:markerposition": {
                            'regexp': /^(one|two|too|to|three|four|for|1|2|4|3|5|6|five|six) (one|two|too|to|three|four|for|1|2|4|3|5|6|five|six)$/,
                            'callback': maze
                        }
                    });

                    return;
                }


                x = numbers[x];
                y = numbers[y];

                params.selectedmazeid = mazemarkers[(x * 10) + y];

                if(params.selectedmazeid === undefined){
                    $scope.say("This is an invalid marker. Coordinates from top left, x first, then y.");
                    params.selectedmaze = null;
                    return;
                }

                params.selectedmaze = mazes[params.selectedmazeid];

                $scope.say("Starting position?");
                $scope.annyang.removeCommands("maze:markerposition");
                $scope.annyang.addCommands({
                    "maze:startingposition": {
                        'regexp': /^(one|two|too|to|three|four|for|1|2|4|3|5|6|five|six) (one|two|too|to|three|four|for|1|2|4|3|5|6|five|six)$/,
                        'callback': currentposition
                    }
                });

            };

            var currentposition = function (x, y) {
                x = numbers[x];
                y = numbers[y];

                params.startingposition = [x - 1, y - 1];

                $scope.annyang.removeCommands("maze:startingposition");
                $scope.say("Target?");

                $scope.annyang.addCommands({
                    "maze:target": {
                        'regexp': /^(one|two|too|to|three|four|for|1|2|4|3|5|6|five|six) (one|two|too|to|three|four|for|1|2|4|3|5|6|five|six)$/,
                        'callback': target
                    }
                });


            };


            var visited = null;

            var target = function (x, y) {

                $scope.annyang.removeCommands("maze:target");

                x = numbers[x];
                y = numbers[y];

                params.targetposition = [x - 1, y - 1];

                // Now we have to solve it! Woot.

                // Log which cells have been visited (so that we don't backtrack)
                visited = [
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                ];


                var location = {
                    _x: params.startingposition[0],
                    _y: params.startingposition[1],
                    path: [],
                };


                var queue = [location];

                var directions = [
                    {label: 'up', dy: -1, dx: 0, bit: 1},
                    {label: 'left', dy: 0, dx: -1, bit: 2},
                    {label: 'down', dy: 1, dx: 0, bit: 4},
                    {label: 'right', dy: 0, dx: 1, bit: 8},
                ];

                var solution = null;

                // Whilst there are still squares to check....
                while (queue.length > 0) {
                    // Take the first location off the queue
                    var currentLocation = queue.shift();

                    var _y = currentLocation._y;
                    var _x = currentLocation._x;

                    // Have we hit the target point.
                    if (params.targetposition[0] === _x && params.targetposition[1] === _y) {
                        solution = currentLocation;
                        break;
                    }

                    visited[_y][_x] = 1;

                    // For each of the directions, test to see if this is a valid move.
                    _.each(directions, function (direction) {
                        var newPath = currentLocation.path.slice();
                        newPath.push(direction.label); // Textual description of this current path.

                        // If we can transition in the direction we want to go, and we've not visited that cell, add it to the queue
                        if ((params.selectedmaze.maze[_y][_x] & direction.bit) === 0 && visited[_y + direction.dy][_x + direction.dx] === 0) {
                            queue.push({
                                _x: _x + direction.dx,
                                _y: _y + direction.dy,
                                path: newPath,
                            });
                        }


                    });


                } // end while

                if(solution) {
                    $scope.say(currentLocation.path.join(". "), 0.7);
                }else{
                    $scope.say("No solution could be found");
                }

                finish();
            };


            var finish = function () {
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "maze:marker": {
                    'regexp': /^maze (one|two|too|to|three|four|for|1|2|4|3|5|6|five|six) (one|two|too|to|three|four|for|1|2|4|3|5|6|five|six)$/,
                    'callback': maze
                }
            });

            $scope.annyang.addCommands({
                "maze": {
                    'regexp': /^maze$/,
                    'callback': maze
                }
            });


            return params;

        }();

        $scope.password = function () {
            var name = "password";
            var params = {
                letters: {
                    'first': "",
                    'second': "",
                    'third': "",
                    'fourth': "",
                    'fifth': "",
                }
            };

            var possiblewords = "ABOUT AFTER AGAIN BELOW COULD EVERY FIRST FOUND GREAT HOUSE LARGE LEARN NEVER OTHER PLACE PLANT POINT RIGHT SMALL SOUND SPELL STILL STUDY THEIR THERE THESE THING THINK THREE WATER WHERE WHICH WORLD WOULD WRITE ";

            var password = function () {
                $scope.log("Password");
                $scope.currentmodule = name;


                params.letters = {
                    'first': "",
                    'second': "",
                    'third': "",
                    'fourth': "",
                    'fifth': "",
                };


                $scope.say("Please give letters for first, third and fourth positions.");
                $scope.annyang.addCommands({
                    "password:letter": {
                        'regexp': /^(first|second|third|fourth|fifth) letter (\S+) (\S+) (\S+) (\S+) (\S+) (\S+)$/,
                        'callback': letter
                    }
                });

            };

            var letter = function (position) {

                var words = Array.prototype.slice.call(arguments, 1);


                $scope.log("Words for " + position + " character were " + words.join(" "));


                // Grab the first letter of each word and load it into the array
                _.each(words, function (word) {
                    word = word.toUpperCase();
                    if(homonyms[word] !== undefined){
                        params.letters[position] += homonyms[word];
                    }else {
                        params.letters[position] += word[0];
                    }
                });


                // check to see if this matches anything yet.
                // Build a regex string to match each character in turn if we know it by generating character classes
                var regexstring = "";
                _.each(params.letters, function (value) {
                    if (value === "") {
                        regexstring += ".";
                    } else {
                        regexstring += ("[" + value + "]");
                    }
                });
                regexstring += " ";

                var matches = possiblewords.match(new RegExp(regexstring, "g"));

                // If we only have two matches, just read them now. It'll either be THING or THINK
                if(matches === null){
                    $scope.say("No words matched. Please try again");
                    password();
                    return;
                }
                if (matches.length === 2) {
                    $scope.say("Word is either " + matches[0] + ". Or " + matches[1] + ".");
                    finish();
                } else if (matches.length === 1) {
                    $scope.say("Word is " + matches[0]);
                    finish();
                } else {
                    $scope.say("More letters needed");
                }

            };

            var finish = function () {
                $scope.annyang.removeCommands("password:letter");
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "password": {
                    'regexp': /^password$/,
                    'callback': password
                }
            });


            return params;
        }();

        $scope.wiresequence = function () {
            var name = "wiresequence";
            var params = {
                counts: {
                    'red': 0,
                    'blue': 0,
                    'black': 0,
                }
            };

            var definition = {
                red: ['C', 'B', 'A', 'AC', 'B', 'AC', 'ABC', 'AB', 'B'],
                blue: ['B', 'AC', 'B', 'A', 'B', "BC", "C", "AC", "A"],
                black: ["ABC", "AC", "B", "AC", "B", "BC", "AB", "C", "C"],
            };

            var wiresequence = function (count) {
                $scope.log("Wire Sequence");
                $scope.currentmodule = name;

                $scope.say("List colour and letter");

                $scope.annyang.addCommands({
                    "wiresequence:wire": {
                        'regexp': /^(red|blue|black) (\w+)$/,
                        'callback': wire
                    },
                    "wiresequence:done": {
                        'regexp': /^done$/,
                        'callback': finish
                    }
                });

            };

            var wire = function (colour, position) {

                if (colour === "done") {
                    finish();
                    return;
                }
                position = position.toUpperCase()[0];
                if(position === "P") position = "B"; // Peter (beta)
                if(position === "S") position = "C"; // Sea (c)

                colour = colour.toLowerCase();

                if (definition[colour][params.counts[colour]].includes(position)) {
                    $scope.say("Cut");
                } else {
                    $scope.say("Do not cut");
                }

                params.counts[colour]++;

            };

            var finish = function () {
                $scope.annyang.removeCommands(["wiresequence:wire", "wiresequence:done"]);
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "wiresequence": {
                    'regexp': /^wire sequence$/,
                    'callback': wiresequence
                }
            });


            return params;
        }();

        $scope.memory = function () {
            var name = "memory";
            var params = {
                stage: null,
                stages: null,
            };


            var memory = function (value) {
                $scope.log("Memory");
                $scope.currentmodule = name;

                params.stage = 0;
                params.stages = {
                    1: {"position": null, "label": null},
                    2: {"position": null, "label": null},
                    3: {"position": null, "label": null},
                    4: {"position": null, "label": null},
                    5: {"position": null, "label": null},
                };

                $scope.annyang.addCommands({
                    "memory:display": {
                        'regexp': /^display (?:says|is)? ?(one|1|two|to|too|2|three|four|for|4|3)$/,
                        'callback': display
                    },
                    "memory:label": {
                        'regexp': /^label (?:was|is|says)? ?(one|1|two|to|too|2|three|four|for|4|3)$/,
                        'callback': label
                    },
                    "memory:position": {
                        'regexp': /^position (?:was|is|says)? ?(one|1|two|to|too|2|three|four|for|4|3)$/,
                        'callback': position
                    }

                });

                if(value === undefined){
                    $scope.say("Display says?");
                    $scope.annyang.addCommands({
                        "memory:singledisplay": {
                            'regexp': /^(one|1|two|to|too|2|three|four|for|4|3)$/,
                            'callback': display
                        }
                    });
                }else{
                    display(value);
                }

            };


            var display = function (value) {

                $scope.annyang.removeCommands("memory:singledisplay");

                value = numbers[value];
                params.stage++; // Increase the stage number

                if (params.stage === 1) {
                    switch (value) {
                        case 1:
                        case 2:
                            $scope.say("Position two");
                            params.stages['1'].position = 2;
                            break;
                        case 3:
                            $scope.say("Position three");
                            params.stages['1'].position = 3;
                            break;
                        case 4:
                            $scope.say("Position four");
                            params.stages['1'].position = 4;
                    }
                }

                if (params.stage === 2) {
                    switch (value) {
                        case 1:
                            $scope.say("Label four");
                            params.stages['2'].label = 4;
                            break;
                        case 2:
                        case 4:
                            $scope.say("Position " + params.stages['1'].position);
                            params.stages['2'].position = params.stages['1'].position;
                            break;
                        case 3:
                            $scope.say("Position 1");
                            params.stages['2'].position = 1;
                            break;
                    }
                }

                if (params.stage === 3) {
                    switch (value) {
                        case 1:
                            $scope.say("Label " + params.stages['2'].label);
                            params.stages['3'].label = params.stages['2'].label;
                            break;
                        case 2:
                            $scope.say("Label " + params.stages['1'].label);
                            params.stages['3'].label = params.stages['1'].label;
                            break;
                        case 3:
                            $scope.say("Position 3");
                            params.stages['3'].position = 3;
                            break;
                        case 4:
                            $scope.say("Label 4");
                            params.stages['3'].label = 4;
                            break;

                    }
                }

                if (params.stage === 4) {
                    switch (value) {
                        case 1:
                            $scope.say("Position " + params.stages['1'].position);
                            params.stages['4'].position = params.stages['1'].position;
                            break;
                        case 2:
                            $scope.say("Position 1");
                            params.stages['4'].position = 1;
                            break;
                        case 3:
                        case 4:
                            $scope.say("Position " + params.stages['2'].position);
                            params.stages['4'].position = params.stages['2'].position;
                            break;

                    }
                }

                if (params.stage === 5) {
                    switch (value) {
                        case 1:
                            $scope.say("Label " + params.stages['1'].label);
                            break;
                        case 2:
                            $scope.say("Label " + params.stages['2'].label);
                            break;
                        case 3:
                            $scope.say("Label " + params.stages['4'].label);
                            break;
                        case 4:
                            $scope.say("Label " + params.stages['3'].label);
                            break;
                    }

                    finish();
                }


            };

            var label = function (value) {
                value = numbers[value];
                params.stages[params.stage].label = value;
                $scope.say("OK"); // There's a delay before the next one appears, so we can repeat this back
            };

            var position = function (value) {
                value = numbers[value];
                params.stages[params.stage].position = value;
                $scope.say("OK");
            };


            var finish = function () {
                $scope.annyang.removeCommands(["memory:display", "memory:label", "memory:position"]);
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "memory": {
                    'regexp': /^memory$/,
                    'callback': memory
                },
                "memory:display": {
                    'regexp': /^memory display says (one|1|two|to|too|2|three|four|for|4|3)$/,
                    'callback': memory
                }
            });


            return params;
        }();

        $scope.complicatedwires = function () {
            var name = "complicatedwires";
            var params = {
                red: null,
                blue: null,
                light: null,
                star: null,
            };


            var complicatedwires = function (count) {
                $scope.log("Complicated wires");
                $scope.currentmodule = name;

                $scope.say("Complicated wires");

                $scope.annyang.addCommands({
                    "complicatedwires:wire": {
                        'regexp': /^(?=.*?\b(white|red and blue|blue and red|red|blue)\b)(?=.*?\b(no light|light)\b)(?=.*?\b(no star|star*)\b).*$/,
                        'callback': wire
                    },
                    "complicatedwires:done": {
                        'regexp': /^done$/,
                        'callback': finish
                    }
                });

            };

            var wire = function (colour, light, star) {

                var red = colour.includes("red");
                var blue = colour.includes("blue");
                var light = !light.includes("no");
                var star = !star.includes("no");

                params.red = red;
                params.blue = blue;
                params.light = light;
                params.star =  star;

                if ((red === false && blue === false && light === false) ||
                    (red === true && blue === false && star === true && light === false)) {
                    $scope.say("Cut the wire");
                } else if ((red === false && blue === false && star === false && light === true) ||
                    (red === false && blue === true && star === true && light === false) ||
                    (red === true && blue === true && star === true && light === true)) {
                    $scope.say("Do not cut the wire");
                } else if ((red === false && blue === false && star === true && light === true) ||
                    (red === true && blue === false && light === true)) {
                    $scope.property("batteries").then(function (batterycount) {
                        if (batterycount >= 2) {
                            $scope.say("Cut the wire");
                        } else {
                            $scope.say("Do not cut the wire");
                        }
                    });

                } else if ((red === true && blue === true && star === true && light === false) ||
                    (red === false && blue === true && light === true)) {
                    // Cut if parallel port
                    $scope.property("parallel").then(function (parallel) {
                        if (parallel === "yes") {
                            $scope.say("Cut the wire");
                        } else {
                            $scope.say("Do not cut the wire");
                        }
                    });
                } else
                // In theory everything else should now be this option.....
                if ((red === true && blue === true && star === false && light === true) ||
                    ((red === true || blue === true) && star === false && light === false)) {
                    // Cut if serial number even
                    $scope.property("serialnumber_evenodd").then(function (evenodd) {
                        if (evenodd === "even") {
                            $scope.say("Cut the wire");
                        } else {
                            $scope.say("Do not cut the wire");
                        }
                    });
                }

            };

            var finish = function () {
                $scope.annyang.removeCommands(["complicatedwires:wire","complicatedwires:done"]);
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "complicatedwires": {
                    'regexp': /^complicated wires$/,
                    'callback': complicatedwires
                }
            });


            return params;
        }();




        $scope.keypad = function () {
            var name = "keypad";
            var params = {
                columnhits: {},
                words: [],
            };

            var icons = {
                1: { filename: "28-balloon.png", names: ["balloon", "O with a tick", "0 with a tick", "zero with a tick", "Stick figure head"], columns:[1, 2]},
                2: { filename: "13-at.png", names: ["A T", "80", "A with a dong"], columns:[1]},
                3: { filename: "30-upsidedowny.png", names: ["Lambda", "LAMDA"], columns:[1, 3]},
                4: { filename: "12-squigglyn.png", names: ["Curly N", "Kelly N", "squiggly n", "Kelly-Anne"], columns:[1]},
                5: { filename: "7-squidknife.png", names: ["H triangle semicircle", "triangle semicircle", "H semicircle triangle", "semicircle triangle", "triangle", "semi-circle", "semi circle", "squid knife"], columns:[1, 4]},
                6: { filename: "9-hookn.png", names: ["Curly H", "Kelly H", "H with a tail"], columns:[1, 2]},
                7: { filename: "23-leftc.png", names: ["Backwards C with a dot", "Backwards C"], columns:[1, 2]},
                8: { filename: "16-euro.png", names: ["Backwards E", "Backwards E with two dots"], columns:[2, 6]},
                9: { filename: "26-cursive.png", names: ["Curly C"], columns:[2, 3]},
                10: {filename: "3-hollowstar.png", names: ["Star"], columns:[2, 3]},
                11: {filename: "20-questionmark.png", names: ["Upside down question mark", "Upsidedown questionmark", "Question mark", "Questionmark"], columns:[2, 4]},
                12: {filename: "1-copyright.png", names: ["Copyright mark", "copyright symbol", "Copyright"], columns:[3]},
                13: {filename: "8-pumpkin.png", names: ["Saggy tits", "Boobs"], columns:[3]},
                14: {filename: "5-doublek.png", names: ["Double K", "Reverse K"], columns:[3, 4]},
                15: {filename: "15-meltedthree.png", names: ["Three with a tail", "Three with a tick"], columns:[3]},
                16: {filename: "11-six.png", names: ["Six", "6"], columns:[4]},
                17: {filename: "21-paragraph.png", names: ["Paragraph mark", "Paragraph symbol"], columns:[4, 5]},
                18: {filename: "31-bt.png", names: ["PT", "BT", "P T", "B T", "B", "Bee"], columns:[4, 5]},
                19: {filename: "4-smileyface.png", names: ["Smiley face", ":-)"], columns:[4, 5]},
                20: {filename: "24-pitchfork.png", names: ["Trident", "Pitchfork"], columns:[5, 6]},
                21: {filename: "22-rightc.png", names: ["C with a dot"], columns:[5]},
                22: {filename: "19-dragon.png", names: ["Snake 3", "three with a tail"], columns:[5]},
                23: {filename: "2-filledstar.png", names: ["Star"], columns:[5]},
                24: {filename: "27-tracks", names: ["Bell bar", "Railroad", "Rail road"], columns:[6]},
                25: {filename: "14-ae.png", names: ["Diphthong", "Dipthong", "A E"], columns:[6]},
                26: {filename: "18-nwithhat.png", names: ["N with a hat", "in with a hat"], columns:[6]},
                27: {filename: "6-omega", names: ["Omega"], columns:[6]},
            };

            // This is the order in which each icon is in the column
            var columns = {
                1: [1, 2, 3, 4, 5, 6, 7],
                2: [8, 1, 7, 9, 10, 6, 11],
                3: [12, 13, 9, 14, 15, 3, 10],
                4: [16, 17, 18, 5, 14, 11, 19],
                5: [20, 19, 18, 21, 17, 22, 23],
                6: [16, 8, 24, 25, 20, 26, 27],
            };


            var keypad = function (count) {
                $scope.log("Keypad");
                $scope.currentmodule = name;

                $scope.say("Symbols");

                reset();

                $scope.annyang.addCommands({
                    "keypad:symbols": {
                        'regexp': /^(.*)$/, // at this point we're just matching a variable number of words!
                        'callback': symbols
                    },
                });



            };

            var columnhits = {};

            var reset = function() {

                params.columnhits = {
                    1: [],
                    2: [],
                    3: [],
                    4: [],
                    5: [],
                    6: [],
                };

                params.words = [];

            };

            var symbols = function (words) {


                if(words.includes("reset")){
                    reset();
                    return;
                }

                var spokenwords = " " + words.toUpperCase() + " ";




                // First try and tokenise the string into what symbols are found
                // Have a list of the icons and which columns theyre in
                // filter this list

                var position = null;


                // lambda H triangle semicircle backwards c with a dot o with a tick
                // h semicircle triangle double k paragraph symbol :-)
                // three with a tail saggy tits lambda copyright symbol
                // star h with a tail backwards c upside down question mark
                // CURLY N O WITH A TICK BACKWARDS C WITH A DOT CURLY H

                var wordfound = false;

                _.each(icons, function(icon, idx){
                    _.each(icon.names, function(name){
                        var n = " " + name.toUpperCase() + " ";

                        if((position = spokenwords.indexOf(n)) > -1){
                            if(!params.words.includes(words)){
                                params.words.push(words); // This counts for the weird 'star' situation which is two icons with the same word
                            }
                            wordfound = true;
                            // We've found an icon in the string.
                            _.each(icon.columns,function(c) {
                                // Add it to the array if it isn't in there already
                                if(!params.columnhits[c].includes(parseInt(idx))) {
                                    params.columnhits[c].push(parseInt(idx));
                                }
                            });

                        }
                    });
                });

                if(!wordfound){
                    $scope.say("Could not find " + words);
                    return;
                }

                var possiblecolumns = [];
                // Work out which options have 4 or more matches
                _.each(params.columnhits, function(c, idx){
                    // If a column has as many words as we've said in it....
                    if(c.length >= params.words.length){
                        possiblecolumns.push(idx);
                    }
                });

                if(possiblecolumns.length === 1 && params.words.length === 4){
                    // We've only got one column thats got 4 (or more) matches, read them out in turn:

                    var columnid = possiblecolumns[0];

                    // Loop through each iconID in order from top to bottom
                    _.each(columns[columnid], function(iconid){

                        if(params.columnhits[columnid].includes(iconid)) {
                            $scope.say(icons[iconid].names[0]); // read out the first name found.
                        }

                        finish();
                    });
                }else if(possiblecolumns.length === 0){
                    $scope.say("Couldn't find a match. Try again.")
                }else{
                    $scope.say("Next")
                }

            };

            var finish = function () {
                $scope.annyang.removeCommands(["keypad:symbols"]);
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "keypad": {
                    'regexp': /^keypad$/,
                    'callback': keypad
                }
            });


            return params;
        }();


        $scope.simonsays = function () {
            var name = "simonsays";
            var params = {

            };


            var simonsays = function (count) {
                $scope.log("Simon Says");
                $scope.currentmodule = name;

                // Todo: Should probably handle the case of more than 0 strikes on here
                $scope.property("serialnumber_vowel").then(function(vowel){
                    if(vowel === "yes"){
                        $scope.say("Red and blue swap. Green and yellow swap");
                    }else{
                        $scope.say("Blue to yellow to red to blue. Green is the same");
                    }

                    finish();
                });


            };

            var finish = function () {
                // $scope.annyang.removeCommands();
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "simonsays": {
                    'regexp': /^simon says$/,
                    'callback': simonsays
                }
            });


            return params;
        }();



        $scope.whosonfirst = function () {
            var name = "whosonfirst";
            var params = {
                displayword: null,
                buttonword: null,
                position: null,
                answer: null,
            };

            var wordmapping = {
                'YES' : 'ml',
                'FIRST': 'tr',
                'DISPLAY': 'br',
                'OKAY' : 'tr',
                'SAYS' : 'br',
                'NOTHING' : 'ml',
                '' : 'bl',
                'BLANK' : 'mr',
                'NO' : 'br',
                'LED' : 'ml',
                'LEAD' : 'br',
                'READ' : 'mr',
                'RED' : 'mr',
                'REED' : 'bl',
                'LEED' : 'bl',
                'HOLD ON' : 'br',
                'YOU' : 'mr',
                'YOU ARE' : 'br',
                'YOUR' : 'mr',
                "YOU'RE" : 'mr',
                'UR' : 'tl',
                'THERE' : 'br',
                "THEY'RE" : 'bl',
                'THEIR' : 'mr',
                'THEY ARE' : 'ml',
                'SEE' : 'br',
                'C' : 'tr',
                'CEE': 'br',
            };

            var buttonpositions = {
              'br': "Bottom right",
              'mr': "Middle right",
              'tr': "Top right",
              'bl': "Bottom left",
              'ml': "Middle left",
              'tl': "Top left",
            };

            var answers = {
                "BLANK": "WAIT,RIGHT,OKAY,MIDDLE,BLANK",
                "DONE": "SURE,UH HUH,NEXT,WHAT?,YOUR,UR,YOU'RE,HOLD,LIKE",
                "FIRST": "LEFT,OKAY,YES,MIDDLE,NO,RIGHT,NOTHING,UHHH,WAIT",
                "HOLD": "YOU ARE,U,DONE,UH UH,YOU,UR,SURE,WHAT?,YOU'RE",
                "LEFT": "RIGHT,LEFT",
                "LIKE": "YOU'RE,NEXT,U,UR,HOLD,DONE,UH UH,WHAT?,UH HUH",
                "MIDDLE": "BLANK,READY,OKAY,WHAT,NOTHING,PRESS,NO,WAIT,LEFT",
                "NEXT": "WHAT?,UH HUH,UH UH,YOUR,HOLD,SURE,NEXT",
                "NO": "BLANK,UHHH,WAIT,FIRST,WHAT,READY,RIGHT,YES,NOTHING",
                "NOTHING": "UHHH,RIGHT,OKAY,MIDDLE,YES,BLANK,NO,PRESS,LEFT",
                "OKAY": "MIDDLE,NO,FIRST,YES,UHHH,NOTHING,WAIT,OKAY",
                "PRESS": "RIGHT,MIDDLE,YES,READY,PRESS",
                "READY": "YES,OKAY,WHAT,MIDDLE,LEFT,PRESS,RIGHT,BLANK,READY",
                "RIGHT": "YES,NOTHING,READY,PRESS,NO,WAIT,WHAT,RIGHT",
                "SURE": "YOU ARE,DONE,LIKE,YOU'RE,YOU,HOLD,UH HUH,HR,SURE",
                "U": "UH HUH,SURE,NEXT,WHAT?,YOU'RE,UR,UH HUH,DONE,U",
                "UHHH": "READY,NOTHING,LEFT,WHAT,OKAY,YES,RIGHT,NO,PRESS",
                "UH HUH": "UH HUH",
                "UH UH": "UR,U,YOU ARE,YOU'RE,NEXT,UH UH",
                "UR": "DONE,U,UR",
                "WAIT": "UHHH,NO,BLANK,OKAY,YES,LEFT,FIRST,PRESS,WHAT",
                "WHAT": "UHHH,WHAT",
                "WHAT?": "YOU,HOLD,YOU'RE,YOUR,U,DONE,UH UH,LIKE,YOU ARE",
                "YES": "OKAY,RIGHT,UHHH,MIDDLE,FIRST,WHAT,PRESS,READY,NOTHING",
                "YOU": "SURE,YOU ARE,YOUR,YOU'RE,NEXT,UH HUH,UR,HOLD,WHAT?",
                "YOU'RE": "YOU,YOU'RE",
                "YOU ARE": "YOUR,NEXT,LIKE,UH HUH,WHAT?,DONE,UH UH,HOLD,YOU",
                "YOUR": "UH UH,YOU ARE,UH HUH,YOUR",
            };





            var whosonfirst = function (_words) {
                $scope.log("Who's on first");
                $scope.currentmodule = name;

                params.buttonword = null;
                params.displayword = null;
                params.position = null;
                params.answer = null;


                $scope.annyang.addCommands({
                    "whosonfirst:words": {
                        'regexp': /^(.*)$/, // at this point we're just matching a variable number of words!
                        'callback': words
                    },
                    "whosonfirst:done": {
                        'regexp': /^done$/,
                        'callback': finish
                    }
                });

                if(_words === undefined){
                    $scope.say("Letters?");
                }else{
                    words(_words);
                }

            };

            var words = function(words){

                if(words === "done"){
                    finish();
                    return;
                }
                if(words === "continue" || words === "next"){
                    $scope.shutup();
                    params.displayword = null;
                    return;
                }

                words = words.split(' ');


                var letters = "";
                // Grab the first letter of each word and load it into the array
                _.each(words, function (word) {
                    word = word.toUpperCase();
                    if(word === "SPACE"){
                        letters += " ";
                    }else if(word === "APOSTROPHE") {
                        letters += "'";
                    }else if(word === "BLANK" || word === "NOTHING") {
                        letters = "";
                    }else if(homonyms[word] !== undefined){
                        letters += homonyms[word];
                    }else {
                        letters += word[0];
                    }
                });


                $scope.log(letters);

                if(params.displayword === null){

                    var position = wordmapping[letters];

                    if(position){
                        params.position = buttonpositions[position];
                        $scope.say("What is the button in the " + params.position + " position");
                        params.displayword = letters;
                    } else {
                        $scope.say(letters + " was not found. Repeat");
                    }


                }else{
                    // displayword wasn't null, so this is the second stage
                    params.buttonword = letters;

                    var answer = answers[letters];

                    if(answer){
                        params.buttonword = letters;
                        params.answer = answer;
                        var _answers = answer.split(",");
                        _.each(_answers, function(answer) {
                            $scope.say(answer.split(" ").join("%").split("").join(" ").split("%").join(" space ").split("?").join(" questionmark ").split("'").join(" apostrophe "), 0.75);

                        });

                    }else{
                        $scope.say(letters + " was not found. Repeat");
                    }




                }

            };



            var finish = function () {
                $scope.annyang.removeCommands(["whosonfirst:words","whosonfirst:done","whosonfirst:next"]);
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "whosonfirst": {
                    'regexp': /^who's on first$/,
                    'callback': whosonfirst
                },
                "whosonfirst:withwords": {
                    'regexp': /^who's on first (.*)$/,
                    'callback': whosonfirst
                }
            });


            return params;
        }();


        $scope.needycapacitor = function () {
            var name = "needycapacitor";
            var params = {

            };


            var needycapacitor = function (count) {
                $scope.say("OK. Starting timer.");
                // We don't set the 'currentmodule' to this as these are needy

                // Set a timer:

                $timeout(function(){
                    $scope.say("Check needy capacitor")
                }, 35000);


            };

            $scope.annyang.addCommands({
                "needycapacitor": {
                    'regexp': /^capacitor discharged$/,
                    'callback': needycapacitor
                }
            });

            return params;
        }();


        $scope.morsecode = function () {
            var name = "morsecode";
            var params = {
                maxamplitude: 0,
                amplitudes: [],
                streaks: [],
                maxdash: null,
                mindot: null,
                text: "",
            };

            var words = [

                {morse: "... .... . .-.. .-..", word: "shell", frequency: "3.505 MHz"},
                {morse: ".... .- .-.. .-.. ...", word: "halls", frequency: "3.515 MHz"},
                {morse: "... .-.. .. -.-. -.-", word: "slick", frequency: "3.522 MHz"},
                {morse: "... - .. -. --.", word: "sting", frequency: "3.592 MHz"},
                {morse: "... - . .- -.-", word: "steak", frequency: "3.582 MHz"},
                {morse: "...- . -.-. - --- .-.", word: "vector", frequency: "3.595 MHz"},
                {morse: "... - .-. --- -... .", word: "strobe", frequency: "3.545 MHz"},
                {morse: "..-. .-.. .. -.-. -.-", word: "flick", frequency: "3.555 MHz"},
                {morse: ".-.. . .- -.- ...", word: "leaks", frequency: "3.542 MHz"},
                {morse: "-... .. ... - .-. ---", word: "bistro", frequency: "3.552 MHz"},
                {morse: "-... . .- - ...", word: "beats", frequency: "3.600 MHz"},
                {morse: "-... .-. .. -.-. -.-", word: "brick", frequency: "3.575 MHz"},
                {morse: "-... .-. . .- -.-", word: "break", frequency: "3.572 MHz"},
                {morse: "-... --- -- -... ...", word: "bombs", frequency: "3.565 MHz"},
                {morse: "- .-. .. -.-. -.-", word: "trick", frequency: "3.532 MHz"},
                {morse: "-... --- -..- . ...", word: "boxes", frequency: "3.535 MHz"},
            ];

            var morsecode = function (count) {
                $scope.log("Morse code");
                $scope.currentmodule = name;

                $scope.annyang.addCommands({
                    "morsecode": {
                        'regexp': /^done$/,
                            'callback': finish
                    }
                });

                $scope.say("Go");

                resetvariables();

                navigator.mediaDevices.getUserMedia({
                        audio: true
                    })
                    .then(initialisestream)
                    .catch(
                        function(err) {
                            console.log("The following error occured: " + err.name)
                        }
                    );

            };

            var resetvariables = function(){

                params.maxamplitude = 0;
                params.amplitudes = [];
                params.streaks = [];
                params.maxdash = null;
                params.mindot = null;
                params.text = "";

            };

            var audioContext = null;

            var initialisestream = function(stream) {
                if(!audioContext || (audioContext && audioContext.state === "closed")) {
                    audioContext = new AudioContext();
                }
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                javascriptNode = audioContext.createScriptProcessor(512, 1, 1);

                analyser.smoothingTimeConstant = 0.0;
                analyser.fftSize = 256;

                microphone.connect(analyser);
                analyser.connect(javascriptNode);
                javascriptNode.connect(audioContext.destination);


                javascriptNode.onaudioprocess = function() {
                    var array = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteTimeDomainData(array);

                    var max = _.max(array) - 127;

                    if(max > params.maxamplitude){
                        params.maxamplitude = max;
                    }

                    params.amplitudes.push(max);

                    analyseaudio();
                }; // end fn stream
            };

            var analyseaudio = function() {

                // Work out the noise / silence threshold
                var len = params.amplitudes.length;

                if(len % 50){ // analyse every half second (ish)
                    return;
                }

                // This passes the audio readings through a filter which increases or decreases a value depending on if it
                // has heard noise or silence. This is limited to +/- <smoothing>. When it crosses 0, it tags the streak.
                var streaks = []; // Probably shouldn't recalculate this whole thing every time?

                var oldcalcvalue = 0; // This is the value we animate up and down;
                var calcvalue = 0; // This is the value we animate up and down;
                var value = -1; // the limited version of the value
                var smoothing = 5; // How many successive on/off values are required for it to get to the maximum amount
                var cutoff = 5;
                var starti = _.findIndex(params.amplitudes, function(i) { return i < cutoff });

                for(var i = starti; i < len; i++){

                    calcvalue += (params.amplitudes[i] > cutoff) ? 1 : -1; // If its greater than 5, then increase
                    calcvalue = Math.max(-5, calcvalue);
                    calcvalue = Math.min(5, calcvalue);

                    // This will only be triggered if calcvalue is -1 or 1, as it can only go up or down 1, and the previous value was 0.
                    if(oldcalcvalue === 0 && value !== calcvalue) {
                        // It was 0, and its now changed from what we previously thought the value was:
                        streaks.push({value: Math.max(0, value), streak: i - starti});

                        value = calcvalue; // The current value is now either 1 or -1
                        calcvalue = calcvalue * smoothing; // force calc value to go to a strong value. This adds a hysteresis
                        starti = i; // Reset the streak counter.
                    }

                    oldcalcvalue = calcvalue;
                }


                streaks.push({value: Math.max(0, value), streak: i - starti});


                if((i - starti) > 100 && value === 1) {
                    // If we've heard nothing but noise for 1 second solid, reset
                    resetvariables();
                } else {

                    $rootScope.$apply(function(){
                        analysestreaks(streaks);
                    });
                }




            };

            var analysestreaks = function(streaks) {

                if($scope.currentmodule !== name){
                    return; // We've exited this module, so don't process anything more
                }

                params.streaks = streaks;

                if(!streaks.length) {
                    return; // Don't do anything yet.
                }

                // Filter out the dots and dashes, calculate the max and min, and quantify the array.
                var dotsanddashes = _.filter(streaks, function(o) { return o.value > 0; });
                if(!dotsanddashes || !dotsanddashes.length){
                    return; // No dots found yet!
                }

                var maxdash = _.maxBy(dotsanddashes, function(o) { return o.streak; }).streak;
                var mindot = _.minBy(dotsanddashes, function(o) { return o.streak; }).streak;

                if(maxdash === mindot){
                    return; // Well this ain't right!
                }

                if(maxdash < mindot * 1.5){
                    // Make sure that the dash length is more than 1.5 times the dot, otherwise skip.
                    return;
                }

                params.maxdash = maxdash;
                params.mindot = mindot;

                var threshold = (maxdash + mindot) / 2;

                var text = _.map(streaks, function(o) {
                    if(o.value === 1){ // this is for noises
                        return o.streak > threshold ? '-' : '.';
                    }else if(o.value === 0){ // For silences, return a space
                        if(o.streak > 250){
                            // long silence:
                            return "|";
                        }else{
                            return o.streak > maxdash ? ' ' : '';
                        }
                    }else if(o.value === -1){ // End of string?
                        return "|";
                    }

                }).join("");

                text = text.trim();
                if(text[0] === "|"){
                    text = text.substr(1);
                }


                params.text = text;

                if(text.length < 8){
                    // Don't try to match on the odd character. Only once we have 8 or more chars.
                    return;
                }



                splittext = text.split("|", 2);

                var candidates = _.filter(words, function(word){
                    if(splittext.length === 2){
                        // Check whether the first part matches the end, and the second part matches the first.
                        if(word.morse.startsWith(splittext[1]) && word.morse.endsWith(splittext[0])){
                            return true;
                        }else if(word.morse.includes(text)){
                            return true;
                        }
                    }else if(splittext.length === 1){
                        if(word.morse.includes(text)){
                            return true;
                        }
                    }
                });

                var weakcandidates = _.filter(words, function(word){
                    // Do a comparison without checking for letter boundaries (spaces) in case these haven't been picked up clearly.
                    if(word.morse.replace(" ", "").includes(text.replace(" ", ""))){
                        return true;
                    }
                });

                params.candidates = candidates;

                if(candidates.length === 1){
                    $scope.say("Frequency is " + candidates[0].frequency.replace("MHz" , ""));
                    finish();
                }else if(candidates.length === 0){
                    $scope.log("No match found. Try again?");

                }


            };



            var finish = function () {
                $scope.annyang.removeCommands("morsecode:done");
                if(audioContext.state !== "closed") { audioContext.close(); }
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "morsecode": {
                    'regexp': /^morse code$/,
                    'callback': morsecode
                }
            });


            return params;
        }();




        $scope.needyknob = function () {
            var name = "needyknob";
            var params = {

            };


            var needyknob = function (count) {
                $scope.log("Needy Knob");
                $scope.currentmodule = name;


                if(count === undefined){
                    $scope.say("How many lights are lit on the left hand side");
                    $scope.annyang.addCommands({
                        "needyknob:count": {
                            'regexp': /^(zero|0|one|1|three|four|for|4|3|five|5)$/,
                            'callback': direction
                        }
                    });
                }else{
                    direction(count);
                }


            };

            var direction = function(value){
                var count = numbers[value];
                $scope.annyang.removeCommands("needyknob:count");

                if(count === 4){
                    $scope.say("Up");
                    finish();
                }else if(count === 1 || count === 0){
                    $scope.say("Left");
                    finish();
                }else if(count === 3){
                    $scope.say("Down");
                    finish();
                }else if(count === 5){
                    $scope.say("Corner or middle?");
                    $scope.annyang.addCommands({
                        "needyknob:position": {
                            'regexp': /^(corner|middle|center)$/,
                            'callback': fivelights
                        }
                    });
                }
            };

            var fivelights = function(position){
                if(position === "corner"){
                    $scope.say("Down");
                }else{
                    $scope.say("Right");
                }
                finish();
            };

            var finish = function () {
                $scope.annyang.removeCommands(["needyknob:count", "needyknob:position"]);
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "needyknob": {
                    'regexp': /^needy knob$/,
                    'callback': needyknob
                },
                "needyknob:withcount": {
                    'regexp': /^needy knob (zero|0|one|1|three|four|for|4|3|five|5)$/,
                    'callback': needyknob
                }
            });


            return params;
        }();





        // Start listening. You can call this here, or attach this call to an event, button, etc.
        $scope.annyang.start();

        $scope.say("Welcome");


    });

