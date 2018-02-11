mappable-gamepad
========================

Sometimes you need to map controllers, both for differences in manufacture and for player controls customization.

Usage
-----
First enable
```javascript
    var gamepad = require('mappable-gamepad');
```
The actual key events come through a handler function... which you can react to, spawn events from or whatever:

```javascript
    var gamepad.handler = function(buttons, axes, buttonUp, axesUp){
        // handle this input
        // the Up arrays refer to outgoing
        // events if you need to
    }
```
If you want to replace the default mapping it is:

```javascript
    gamepad.map = {
        buttons : {
            0 : 'a',
            1 : 'b',
            3 : 'x',
            4 : 'y',
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
```
Testing
-------
Eventually it'll be:

    mocha

Enjoy,

 -Abbey Hawk Sparrow
