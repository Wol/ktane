angular.module('ktane', [])
    .controller('ktaneController', function ($scope, $q) {
        $scope.phrase = "";
        $scope.$q = $q;
        $scope.logitems = [];

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

        $scope.annyang = annyang;
        annyang.debug(true);

        $scope.simulateSpeech = function () {
            annyang.trigger($scope.phrase);
            $scope.phrase = '';
        };


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
            serialnumber_evenodd: {value: null, question: "Is the serial number even or odd", response: "(even|odd)"},
            serialnumber_vowel: {value: null, question: "Does the serial number contain a vowel", response: "(yes|no)"},
        };

        // Returns a promise which gets the value of a property of the bomb. If it knows it already, it'll resolve
        // instantly, but otherwise it'll ask the user.
        $scope.property = function (propertyname) {

            var property = $scope.bombproperties[propertyname];


            return $scope.$q.when( new Promise(function (resolve, reject) {

                var assignProperty = function (value) {
                    $scope.annyang.removeCommands("property");
                    if(property.remap){
                        property.value = property.remap[value];
                    }else {
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

        $scope.say = function (string) {
            $scope.log(string);
        };

        $scope.log = function (string){
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

                params.numberOfWires = numbers[count];

                $scope.annyang.addCommands({
                    "simplewires:colours": {
                        'regexp': /^(red|blue|black|yellow|white) (red|blue|black|yellow|white) (red|blue|black|yellow|white) ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)?$/,
                        'callback': wireColours
                    }
                });

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

                    var stage2 = function(){
                        if(counts.red === 0 && c4 === "yellow"){
                            $scope.say("Cut the first wire");
                            finish();
                        }else if(counts.blue === 1){
                            $scope.say("Cut the first wire");
                            finish();
                        }else if(counts.yellow > 1){
                            $scope.say("Cut the last wire");
                            finish();
                        }else{
                            $scope.say("Cut the second wire");
                            finish();
                        }
                    };


                    // Check to see if the count of reds is more than 1, and if so, ask what the serial number is.
                    if(counts.red > 1){
                        $scope.property("serialnumber_evenodd").then(function (serialnumber) {
                            if (serialnumber === "odd") {
                                $scope.say("Cut the last red wire");
                                finish();
                            } else {
                                stage2();
                            }
                        });
                    }else{
                        stage2();
                    }

                }

                if (params.numberOfWires === 5 && arguments.length === 5) {

                    var stage2 = function(){
                        if(counts.red === 1 && counts.yellow > 1){
                            $scope.say("Cut the first wire");
                            finish();
                        }else if(counts.black === 0) {
                            $scope.say("Cut the second wire");
                            finish();
                        }else{
                            $scope.say("Cut the first wire");
                            finish();
                        }
                    };



                    if(c5 === "black"){
                        $scope.property("serialnumber_evenodd").then(function (serialnumber) {
                            if (serialnumber === "odd") {
                                $scope.say("Cut the fourth wire");
                                finish();
                            } else {
                                stage2();
                            }
                        });
                    }else{
                        stage2();
                    }

                }

                if (params.numberOfWires === 6 && arguments.length === 6) {
                    var stage2 = function(){
                        if(counts.yellow === 1 && counts.white > 1){
                            $scope.say("Cut the fourth wire");
                            finish();
                        }else if(counts.red === 0) {
                            $scope.say("Cut the last wire");
                            finish();
                        }else{
                            $scope.say("Cut the fourth wire");
                            finish();
                        }
                    };



                    if(counts.yellow === 0){
                        $scope.property("serialnumber_evenodd").then(function (serialnumber) {
                            if (serialnumber === "odd") {
                                $scope.say("Cut the third wire");
                                finish();
                            } else {
                                stage2();
                            }
                        });
                    }else{
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

                if(word === "detonate"){
                    $scope.property("batteries").then(function (batterycount) {
                        if (batterycount > 1) {
                            pressandrelease();
                        } else {
                            holdandchecklight();
                        }
                    });
                }
                if(colour === "white"){
                    $scope.property("car").then(function (car) {
                        if (car === "yes") {
                            holdandchecklight();
                        } else {
                            checkfrk();
                        }
                    });
                }

                if(colour === "red" && word === "hold"){
                    pressandrelease();
                }

                if(colour === "blue" && word === "abort"){
                    holdandchecklight();
                }

                checkfrk();

            };

            var pressandrelease = function(){
                $scope.say("Press and release the button");
                finish();
            };


            var holdandchecklight = function() {
                $scope.say("Press and hold the button");

                $scope.annyang.addCommands({
                    "button:heldcolour": {
                        'regexp': /^(red|blue|yellow|white)?$/,
                        'callback': heldcolour
                    }
                });

            };

            var heldcolour = function(colour){
                params.heldcolour = colour;
                if(colour === "blue"){
                    $scope.say("Release when timer has 4");
                }else if(colour === "yellow"){
                    $scope.say("Release when timer has 5");
                }else{
                    $scope.say("Release when timer has 1");
                }
                finish();
            };

            var checkfrk = function(){
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
                $scope.annyang.removeCommands("button:heldcolour");
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "button": {
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
            };

            // top = 1
            // left = 2
            // bottom = 4
            // right = 8

            // topleft = 3

            var selectedmaze = null;

            // Converts the 'top/left' only values into a top/left/bottom/right value
            var tl2tlbr = function(maze){
                var i, j;

                for(i = 0; i < 6; i++){
                    for(j = 0; j < 6; j++){
                        if(i === 5 || (maze[i + 1][j] & 1)){ // If we're at the bottom, or if the next row down has the 'top' bit set
                            maze[i][j] |= 4; // then set the 'bottom' bit on this row
                        }
                    }
                }

                for(j = 0; j < 6; j++){
                    for(i = 0; i < 6; i++){
                        if(j === 5 || (maze[i][j+1] & 2)){ // If we're at the right, or if the next column across has the 'left' bit set
                            maze[i][j] |= 8; // then set the 'bottom' bit on this row
                        }
                    }
                }

                return maze;

            };

            var mazes = {
                a: tl2tlbr([ // 1,5 6,4
                    [3, 1, 1, 3, 1, 1],
                    [2, 3, 0, 2, 1, 1],
                    [2, 2, 1, 3, 1, 0],
                    [2, 3, 0, 0, 3, 0],
                    [2, 1, 1, 3, 1, 2],
                    [2, 1, 2, 0, 3, 0],
                ]),
                b: tl2tlbr([ // 2,3 5,5
                    [3, 1, 1, 3, 1, 1],
                    [3, 0, 3, 0, 2, 1],
                    [2, 3, 0, 3, 1, 0],
                    [2, 0, 3, 0, 3, 2],
                    [2, 3, 2, 3, 0, 2],
                    [2, 2, 0, 2, 1, 0],
                ]),
                // TODO : Add other mazes in here
            };

            var mazemarkers = {
                12: mazes.a,
                63: mazes.a,
                24: mazes.b,
                52: mazes.b,
            };

            var maze = function (x, y) {

                console.log(mazes);
                $scope.log("Maze");
                $scope.currentmodule = name;

                x = numbers[x];
                y = numbers[y];

                selectedmaze = mazemarkers[(x * 10) + y];

                $scope.say("Starting position");

                $scope.annyang.addCommands({
                    "maze:startingposition": {
                        'regexp': /^(one|two|too|to|three|four|for|1|2|4|3|5|6|five|six) (one|two|too|to|three|four|for|1|2|4|3|5|6|five|six)$/,
                        'callback': currentposition
                    }
                });

            };

            var currentposition = function(x, y){
                x = numbers[x];
                y = numbers[y];

                params.startingposition = [x - 1, y - 1];

                $scope.annyang.removeCommands("maze:startingposition");
                $scope.say("Target");

                $scope.annyang.addCommands({
                    "maze:target": {
                        'regexp': /^(one|two|too|to|three|four|for|1|2|4|3|5|6|five|six) (one|two|too|to|three|four|for|1|2|4|3|5|6|five|six)$/,
                        'callback': target
                    }
                });


            };


            var visited = null;

            var target = function(x, y){

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

                while (queue.length > 0) {
                    // Take the first location off the queue
                    var currentLocation = queue.shift();

                    var _y = currentLocation._y;
                    var _x = currentLocation._x;


                    if(params.targetposition[0] === _x && params.targetposition[1] === _y){
                        location = currentLocation;
                        break;
                    }

                    visited[_y][_x] = 1;


                    _.each(directions, function(direction){
                        var newPath = currentLocation.path.slice();
                        newPath.push(direction.label); // Textual description of this current path.

                        // If we can transition in the direction we want to go, and we've not visited that cell, add it to the queue
                        if((selectedmaze[_y][_x] & direction.bit) === 0 && visited[_y + direction.dy][_x + direction.dx] === 0) {
                            queue.push( {
                                _x: _x + direction.dx,
                                _y: _y + direction.dy,
                                path: newPath,
                            });
                        }


                    });


                } // end while


                $scope.say(currentLocation.path.join(" "));

                finish();
            };


            var finish = function () {
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "maze": {
                    'regexp': /^maze (one|two|too|to|three|four|for|1|2|4|3|5|6|five|six) (one|two|too|to|three|four|for|1|2|4|3|5|6|five|six)$/,
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

            var password = function (count) {
                $scope.log("Password");
                $scope.currentmodule = name;


                $scope.annyang.addCommands({
                    "password:letter": {
                        'regexp': /^(first|second|third|fourth|fifth) letter (\w+) (\w+) (\w+) (\w+) (\w+)$/,
                        'callback': letter
                    }
                });

            };

            var letter = function (position) {

                var words = Array.prototype.slice.call(arguments, 1);


                $scope.log("Words for " + position + " character were " + words.join(" "));


                // Grab the first letter of each word and load it into the array
                _.each(words, function(word){
                    word = word.toUpperCase();
                    params.letters[position] += word[0];
                });


                // check to see if this matches anything yet.
                // Build a regex string to match each character in turn if we know it by generating character classes
                var regexstring = "";
                _.each(params.letters,function(value){
                    if(value === ""){
                        regexstring += ".";
                    }else{
                        regexstring += ("[" + value + "]");
                    }
                });
                regexstring += " ";

                var matches = possiblewords.match(new RegExp(regexstring, "g"));

                // If we only have two matches, just read them now. It'll either be THING or THINK
                if(matches.length === 2){
                    $scope.say("Word is either " + matches.join(" or "));
                    finish();
                }else if(matches.length === 1){
                    $scope.say("Word is " + matches[0]);
                    finish();
                }else{
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


                $scope.annyang.addCommands({
                    "wiresequence:letter": {
                        'regexp': /^(red|blue|black|done) (\w+)$/,
                        'callback': wire
                    }
                });

            };

            var wire = function (colour, position) {

                if(colour === "done"){
                    finish();
                    return;
                }
                position = position.toUpperCase()[0];

                if(definition[colour][params.counts[colour]].includes(position)){
                    $scope.say("Cut");
                }else{
                    $scope.say("Do not cut");
                }

                params.counts[colour]++;

            };

            var finish = function () {
                $scope.annyang.removeCommands("wiresequence:wire");
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
                stage: 0,
                stages: {
                    1: {"position": null, "label": null},
                    2: {"position": null, "label": null},
                    3: {"position": null, "label": null},
                    4: {"position": null, "label": null},
                    5: {"position": null, "label": null},
                },
            };


            var memory = function (value) {
                $scope.log("Memory");
                $scope.currentmodule = name;


                $scope.annyang.addCommands({
                    "memory:display": {
                        'regexp': /^display says (one|1|two|to|too|2|three|four|for|4|3)$/,
                        'callback': display
                    },
                    "memory:label": {
                        'regexp': /^label (?:was)? (one|1|two|to|too|2|three|four|for|4|3)$/,
                        'callback': label
                    },
                    "memory:position": {
                        'regexp': /^position (?:was)? (one|1|two|to|too|2|three|four|for|4|3)$/,
                        'callback': position
                    }

                });

                display(value);

            };

            var display = function (value) {

                value = numbers[value];
                params.stage++; // Increase the stage number

                if(params.stage === 1){
                    switch(value) {
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

                if(params.stage === 2){
                    switch(value) {
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

                if(params.stage === 3){
                    switch(value) {
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

                if(params.stage === 4){
                    switch(value) {
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

                if(params.stage === 5){
                    switch(value) {
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
                $scope.say("Label " + value); // There's a delay before the next one appears, so we can repeat this back
            };

            var position = function (value) {
                value = numbers[value];
                params.stages[params.stage].label = value;
                $scope.say("Position " + value);
            };


            var finish = function () {
                $scope.annyang.removeCommands(["memory:display", "memory:label", "memory:position"]);
                $scope.currentmodule = null;
            };


            $scope.annyang.addCommands({
                "memory": {
                    'regexp': /^memory display says (one|1|two|to|too|2|three|four|for|4|3)$/,
                    'callback': memory
                }
            });


            return params;
        }();

        // Start listening. You can call this here, or attach this call to an event, button, etc.
        annyang.start({autoRestart: true});


    });

