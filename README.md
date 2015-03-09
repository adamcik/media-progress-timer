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

Obviously there is still a chance that the remote side and the web application
drift apart. With these measures polling code that resynchronizes can be run a
lot less frequently, possibly even removed.

Install
-------

There are no fancy build commands or minified versions. Just use the source
file as it is or your module loader of choice.

There is also an NPM package at https://www.npmjs.com/package/media-progress-timer

Usage
-----

    var timer = ProgressTimer({
        callback: function(position, duration) {
            // update your UI state in this funcion as need be
        },
        // Target number of milliseconds between callbacks.
        updateRate: 10,
        // Force the use of the legacy setTimeout fallback.
        disableRequestAnimationFrame: false
    });

    // Call with position, duration. Both arguments are optional.
    timer.start(0, 60000);

    // Stops the timer preventing any further callbacks.
    timer.stop();

    // Continue from the position of the last stop.
    timer.resume();

    // Resets the timer to a "blank" state.
    timer.reset();


``ProgressTimer`` can also be called with just the callback if no other options
are needed.

Background
----------

This helper was created in order to help Mopidy client developers handle time
better as too many of the clients have been constantly polling for the current
time position to "fix" the drifting.

There is nothing Mopidy, or even media specific about this code so if it comes
in handy for some other use cases then awesome :-)
