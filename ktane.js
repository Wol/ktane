angular.module('ktane', [])
    .controller('ktaneController', function ($scope) {
        $scope.phrase = "";


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
                response: "(zero|one|two|three|four|five|six)"
            },
            frk: {value: null, question: "Is there an indicator saying F R K", response: "(yes|no)"},
            car: {value: null, question: "Is there an indicator saying F R K", response: "(yes|no)"},
            parallelport: {value: null, question: "Is there a parallel port", response: "(yes|no)"},
            serialnumber: {value: null, question: "Is the serial number even or odd", response: "(even|odd)"},
        };

        $scope.property = function (propertyname) {

            var property = $scope.bombproperties[propertyname];


            return new Promise(function (resolve, reject) {

                var assignProperty = function (value) {
                    $scope.annyang.removeCommands("property");
                    property.value = value;
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


            });

        };

        $scope.say = function (string) {
            console.log(string);
        };

        $scope.simplewires = function () {
            var name = "simplewires";
            var params = {
                numberOfWires: null,
            };


            var simpleWires = function (count) {
                console.log("Simple wires!" + count);
                $scope.currentmodule = this.name;

                var numbers = {
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

                params.numberOfWires = numbers[count];

                $scope.annyang.addCommands({
                    "simplewires:colours": {
                        'regexp': /^(red|blue|black|yellow|white) (red|blue|black|yellow|white) (red|blue|black|yellow|white) ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)?$/,
                        'callback': wireColours
                    }
                });

            };

            var wireColours = function (c1, c2, c3, c4, c5, c6) {
                console.log("Colours: " + c1 + c2 + c3 + c4 + c5 + c6);

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

                    $scope.property("serialnumber").then(function (serialnumber) {
                        if(counts.red > 1 && serialnumber === "odd"){
                            $scope.say("Cut the last red wire");
                        }else if(counts.red === 0 && c4 === "yellow"){
                            $scope.say("Cut the first wire");
                        }else if(counts.blue === 1){
                            $scope.say("Cut the first wire");
                        }else if(counts.yellow > 2){
                            $scope.say("Cut the last wire");
                        }else{
                            $scope.say("Cut the second wire");
                        }
                    });


                }

                if (params.numberOfWires === 5 && arguments.length === 5) {

                }

                if (params.numberOfWires === 6 && arguments.length === 6) {

                }
            };

            var finish = function () {
                $scope.annyang.removeCommands("simplewires:colours");
            };


            $scope.annyang.addCommands({
                "simple wires": {
                    'regexp': /^simple wires (three|four|for|4|3|5|6|five|six) wires$/,
                    'callback': simpleWires
                }
            });


            return params;
        }();

        $scope.buttons = {
            name: "buttons",
            init: function () {
                $scope.annyang.addCommands({
                    "buttons": {
                        'regexp': /^button (?=.*\b(red|blue|white|yellow|black)\b)(?=.*\b(abort|hold|press|detonate)\b).*$/,
                        'callback': this.buttons
                    }
                });

                return this;
            },
            buttons: function (colour, word) {
                console.log("Button. Colour: " + colour + " word: " + word);
                $scope.currentmodule = this.name;



                // $scope.annyang.addCommands({"buttons:colours" : {'regexp' : /^(red|blue|black|yellow|white) (red|blue|black|yellow|white) (red|blue|black|yellow|white) ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)?$/ , 'callback': simplewires.wireColours}});

            },
            wireColours: function (c1, c2, c3, c4, c5, c6) {
                console.log("Colours: " + c1 + c2 + c3 + c4 + c5 + c6);
            },

            finish: function () {
                // $scope.annyang.removeCommands("buttons:colours");
            }
        }.init();


        // Start listening. You can call this here, or attach this call to an event, button, etc.
        annyang.start({autoRestart: true});


    });

