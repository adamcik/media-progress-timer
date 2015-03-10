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
        // Your callback for updating UI state, required.
        callback: function(position, duration) {
        },
        // Target milliseconds between callbacks, default: 100, min: 10.
        updateRate: 10,
        // Force the use of the legacy setTimeout fallback, default: false.
        disableRequestAnimationFrame: false
    });

    // When playback starts set the timer and start it:
    timer.set(0, 60000).start();

    // When playback pauses, stop the timer:
    timer.stop();

    // When playback resumes, start the timer:
    timer.start();

    // When a seek event occours update the position:
    timer.set(position)

    // When playback stops, reset the timer.
    timer.reset();

- Just running ``new ProgressTimer(callback)`` is also possible if you don't
  want to set any options.
- All function return `this` and are thus chainable.
- The initial state of the timer is a position of zero and an infinite duration.
- For the ``set`` call you may omit duration, in this case the timer will
  continue using the previous duration.
- Positions will always be normalized to a number between zero and duration.
- Durations will be normalized to a number between zero and infinite, null is
  considered an alias for infinite.

Background
----------

This helper was created in order to help Mopidy client developers handle time
better as too many of the clients have been constantly polling for the current
time position to "fix" the drifting.

There is nothing Mopidy, or even media specific about this code so if it comes
in handy for some other use cases then awesome :-)
