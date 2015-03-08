Media progress timer
====================

This library provides a helper designed for accurate tracking of remote
playback position in media applications.

The typical naive approach I've come across simply uses ``setTimeout`` without
a reference time and quickly drifts out of sync. To avoid this the library:

- Always uses a reference time to avoid drifting.
- Calls a user provided callback with the current position and duration.
- Supports missing durations to make sure radio streams still count play time.
- Uses ``requestAnimationFrame`` for performance / battery friendly updates.
- Supports a legacy ``setTimeout`` based fallback mode.

Obviously there is still a chance the remote side and the web application
drifting, but with these measures in place polling code that resynchronizes
can be run a lot less frequently.

Install
-------

There are no fancy build commands or minified versions. Just use the source
file as it is or include it with ``require.js``.

However, if you use an npm based build system you can use:

    npm install media-progress-timer

Usage
-----

    var ProgresTimer = require('media-progress-timer');

    var timer = ProgressTimer({
        callback: function(position, duration) {
            // update your UI state in this funcion as need be
        },
        updateRate: 10,  // min number of ms between callbacks
        fallback: false  // force setTimeout based legacy mode
    });

    // Call with position, duration. Both arguments are optional.
    timer.start(0, 60000);

    // Stops the timer preventing any further callbacks.
    timer.stop();

    // Resets the timer to a "blank" state.
    timer.reset();

Background
----------

This helper was created in order to help mopidy client developers handle time
better as too many of the clients have been constantly polling for the current
time position to "fix" the drifting.

There is nothing mopidy, or even media specific about this code so if it comes
in handy for some other use cases then awesome :-)
