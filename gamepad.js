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
        if (!('ongamepadconnected' in window || 'GamepadEvent' in window)) {
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
            var trigger = function(fn){ setTimeout(fn, 0) };
            if(typeof window != 'undefined') trigger = window.requestAnimationFrame;
            module.exports = factory(
                browserConnections,
                trigger,
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

    var controllers = {}

    var gamePad = {
        setHandler : function(fn){
            handler = fn;
        },
        setController : function(type){
            if(!controllers[type]) throw new Error('unknown type');
            gamePad.map = controllers[type];
        },
        map : {}
    }

    function buttonPressed(b) {
      if(typeof(b) == "object") return b.pressed;
      return b == 1.0;
    }
    var lastButtons = {};
    var lastAxes = {};

    handleConnections(function(gamepad){
        Object.keys(controllers).forEach(function(name){
            if(gamepad.id.indexOf(name) === 0){
                console.log('Autodetected Controller: '+name)
                gamePad.setController(name);
            }
        });
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
        var handleButton = function(id, pressed){
            if(lastButtons[id] && !pressed) buttonUnsets[id] = true;
            if(pressed) buttons[id] = true;
        }
        var handleAxis = function(id, value){
            var range = gamePad.range;
            if(gamePad.offsets && gamePad.offsets[id]){
                value = value + gamePad.offsets[id]
                if(gamePad.extent && !range){
                    range = {
                        upper: gamePad.extent,
                        mid: gamePad.offsets[id],
                        lower: gamePad.extent*-1
                    }
                }
            }
            if(
                range &&
                range.upper !== null &&
                range.mid !== null &&
                range.lower !== null
            ){
                var top;
                var bottom;
                if(value >= range.mid){ //positive
                    top = range.upper;
                    bottom = range.mid;
                }else{ //negative
                    top = range.mid;
                    bottom = range.lower;
                }
                var dist = top - bottom;
                var remainder = (1-dist);
                var offsetValue = value - bottom
                var extra = remainder * (dist-offsetValue);
                value = top - offsetValue - extra;
            }
            if(gamePad.quantize){
                value = Math.floor(value / gamePad.quantize) * gamePad.quantize;
            }
            if(lastAxes[id] && value === 0) axesUnsets[id] = value;
            if(value !== 0) axes[id] = value;
        }
        if(gp && gp.buttons) gp.buttons.forEach(function(button, index){
            if(map[index] && map[index].indexOf(':') !== -1){
                //map buttons to axes, because of awesome implementations
                var parts = map[index].split(':');
                if(buttonPressed(button)){
                    handleAxis(parts[0], parseFloat(parts[1]));
                }
            }else{
                handleButton(map[index]||index, buttonPressed(button))
            }
        });
        if(gp && gp.axes) gp.axes.forEach(function(axis, index){
            if(gamePad.map.invert.indexOf(index) !== -1) axis = -1 * axis;
            handleAxis(amap[index]||index, axis);
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
                //console.log('gamepad>', gp.axes, gp.buttons);
            }
        }
        start = raf(gameLoop);
    };

    controllers['8Bitdo'] = {
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
            4 : 'dummy-pad-x',
            5 : 'dummy-pad-y',
            6 : 'left-pad-x',
            7 : 'left-pad-y'
        },
        invert : [6, 7]
    };

    controllers['Sony PLAYSTATION(R)3 Controller'] = {
        buttons : {
            0 : 'b',
            1 : 'a',
            2 : 'y',
            3 : 'x',
            4 : 'l1',
            5 : 'r1',
            6 : 'l2',
            7 : 'r2',
            8 : 'select',
            9 : 'start',
            10 : 'left-stick-click',
            11 : 'right-stick-click',
            12 : 'left-pad-y:1',
            13 : 'left-pad-y:-1',
            14 : 'left-pad-x:1',
            15 : 'left-pad-x:-1',
            16 : 'system'
        },
        axes : {
            0 : 'left-stick-x',
            1 : 'left-stick-y',
            2 : 'right-stick-x',
            3 : 'right-stick-y',
        }
    };

    controllers['Logitech Logitech Dual Action'] = {
        buttons : {
            0 : 'b',
            1 : 'a',
            2 : 'y',
            3 : 'x',
            4 : 'l1',
            5 : 'r1',
            6 : 'l2',
            7 : 'r2',
            8 : 'select',
            9 : 'start',
            10 : 'left-stick-click',
            11 : 'right-stick-click',
            12 : 'left-pad-y:1',
            13 : 'left-pad-y:-1',
            14 : 'left-pad-x:1',
            15 : 'left-pad-x:-1'
        },
        axes : {
            0 : 'left-stick-x',
            1 : 'left-stick-y',
            2 : 'right-stick-x',
            3 : 'right-stick-y',
        }
    };
    //gamePad.quantize = 0.1;
    //gamePad.offsets = { 'right-stick-y':-0.4, 'right-stick-x':-0.1 };
    //gamePad.extent = 0.6

    return gamePad;
}));
