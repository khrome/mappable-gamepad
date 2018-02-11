(function(root, factory){
    var getGamePads = function(){
        var gamepads = navigator.getGamepads?
            navigator.getGamepads():
            (
                navigator.webkitGetGamepads?
                navigator.webkitGetGamepads:
                []
            );
        return gamepads;
    }
    var browserConnections = function(handler){
        var interval;
        if (!('ongamepadconnected' in window)) {
            // No gamepad events available, poll instead.
            interval = setInterval(function pollGamepads() {
                var gamepads = getGamePads();
                for (var i = 0; i < gamepads.length; i++) {
                    var gp = gamepads[i];
                    if(gp){
                        handler(gp);
                        clearInterval(interval);
                    }
                }
            }, 500);
        }else{
            window.addEventListener("gamepadconnected", function(e) {
                handler(e.gamepad);
            });
        }
    }

    if (typeof define === 'function' && define.amd){
        define([], function(){
            return factory(
                browserConnections,
                requestAnimationFrame,
                getGamePads
            );
        });
    }else if(typeof exports === 'object'){
        var isElectron = require('is-electron');
        if(isElectron){
            module.exports = factory(
                browserConnections,
                requestAnimationFrame,
                getGamePads
            );
        }else{
            //TODO: nodejs support
        }
    }else{
        root.MappableGamepad = factory(
            browserConnections,
            requestAnimationFrame,
            getGamePads
        );
    }
}(this, function(handleConnections, raf, getGamepads){
    var handler = function(buttons, axes, buttonUp, axesUp){
        console.log('gamepad>', buttons, axes, buttonUp, axesUp)
    };

    var gamePad = {
        setHandler : function(fn){
            handler = fn;
        },
        map : {
            buttons : {
                0 : 'a',
                1 : 'b',
                2 : 'stick-click',
                3 : 'x',
                4 : 'y',
                5 : 'xl2',
                6 : 'l1',
                7 : 'r1',
                8 : 'l2',
                9 : 'r2',
                10 : 'select',
                11 : 'start',
                13 : 'left-stick-click',
                14 : 'right-stick-click',
            },
            axes : {
                0 : 'left-stick-x',
                1 : 'left-stick-y',
                2 : 'right-stick-x',
                3 : 'right-stick-y',
                4 : 'left-pad-x',
                5 : 'left-pad-y'
            }
        }
    }

    function buttonPressed(b) {
      if(typeof(b) == "object") return b.pressed;
      return b == 1.0;
    }
    var lastButtons = {};
    var lastAxes = {};

    handleConnections(function(gamepad){
        gameLoop(); //TODO: multi-controller, connect/disconnect support
    })

    function gameLoop() {
        var gamepads = getGamepads();
        if(!gamepads) return;
        var gp = gamepads[0];
        var buttons = {};
        var axes = {};
        var axesUnsets = {};
        var map = gamePad.map.buttons;
        var amap = gamePad.map.axes;
        var buttonUnsets = {};
        gp.buttons.forEach(function(button, index){
            if(lastButtons[map[index]||index]){
                if(!buttonPressed(button) ){
                    buttonUnsets[map[index]||index] = true;
                }
            }
            if(buttonPressed(button)) buttons[map[index]||index] = true;
        });
        gp.axes.forEach(function(axis, index){
            if(lastAxes[amap[index]||index]){
                if(axis === 0){
                    axesUnsets[amap[index]||index] = axis;
                }
            }
            if(axis !== 0) axes[amap[index]||index] = axis;
        });
        lastButtons = buttons;
        lastAxes = axes;
        if(handler){
            if(
                Object.keys(buttons).length ||
                Object.keys(axes).length ||
                Object.keys(buttonUnsets).length ||
                Object.keys(axesUnsets).length
            ){
                handler(buttons, axes, buttonUnsets, axesUnsets);
            }
        }
        start = raf(gameLoop);
    };

    return gamePad;
}));
