if (annyang) {
    // Let's define our first command. First the text we expect, and then the function it should call
    var commands = {};


    var simplewires = {
        numberOfWires: 0,
        simpleWires: function (count) {
            console.log("Simple wires!" + count);
        },
        wireColours: function(c1, c2, c3, c4, c5, c6) {
            console.log("Colours: " + c1 + c2 + c3 + c4 + c5 + c6);
        },
    };



    commands['simple wires'] = {'regexp' : /^simple wires (three|four|five|six) wires$/, 'callback': simplewires.simpleWires};
    commands['wire colours'] = {'regexp' : /^(red|blue|black|yellow|white) (red|blue|black|yellow|white) (red|blue|black|yellow|white) ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)? ?(red|blue|black|yellow|white)?$/ , 'callback': simplewires.wireColours};



    annyang.debug(true);

    // Add our commands to annyang
    annyang.addCommands(commands);

    // Start listening. You can call this here, or attach this call to an event, button, etc.
    annyang.start({ autoRestart: true });


    console.log("Started");
}



angular.module('todoApp', [])
    .controller('TodoListController', function() {
        var todoList = this;

        todoList.addTodo = function() {

            annyang.trigger(todoList.todoText);
            todoList.todoText = '';
        };


    });

