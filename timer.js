/*! timer.js v2.0.2
 * https://github.com/adamcik/media-progress-timer
 * Copyright (c) 2015 Thomas Adamcik
 * Licensed under the Apache License, Version 2.0 */

(function() {

'use strict';

// Helper function to provide the current time in milliseconds.
var now = typeof window.performance !== 'undefined' &&
          typeof window.performance.now !== 'undefined' &&
          window.performance.now.bind(window.performance) || Date.now ||
          function() { return new Date().getTime(); };

// Helper to warn library users about deprecated features etc.
var warn = function(msg) {
    setTimeout(function() { throw msg; }, 0);
};

// Creates a new timer object, works with both 'new ProgressTimer(options)' and
// just 'ProgressTimer(options). Optionally the timer can also be called with
// only the callback instead of options.
function ProgressTimer(options) {
    if (!(this instanceof ProgressTimer)) {
        return new ProgressTimer(options);
    } else if (typeof options === 'function') {
        options = {'callback': options};
    } else if (typeof options !== 'object') {
        throw 'ProgressTimer must be called with a callback or options.';
    } else if (typeof options.callback !== 'function') {
        throw 'ProgressTimer needs a callback to operate.';
    }

    this._userCallback = options.callback;

    if (options.updateRate && !options.fallbackTargetFrameRate) {
        warn('ProgressTimer no longer supports the updateRate option.');
        this._fallbackRate = Math.max(options.updateRate, 10);
    } else {
        this._fallbackRate = 1000 / (options.fallbackTargetFrameRate || 30);
    }

    this._running = false;

    var useFallback = typeof window.requestAnimationFrame === 'undefined' ||
                      options.disableRequestAnimationFrame || false;
    if (!useFallback) {
        this._callUpdate = this._scheduleAnimationFrame;
        this._scheduleUpdate = this._scheduleAnimationFrame;
    }

    // Pre-bind these functions as the get called a lot.
    this._boundCallUpdate = this._callUpdate.bind(this);
    this._boundUpdate = this._update.bind(this);

    // TODO: document what this initializes
    this.reset();
}

// Updates the timer state to set the position and optionally the duration.
ProgressTimer.prototype.set = function(position, duration) {
    if (arguments.length === 0) {
        throw 'set requires at least a position argument.';
    } else if (arguments.length === 1) {
        // Fallback to previous duration, whatever that was.
        duration = this._state.duration;
    } else {
        // Round down and make sure zero and null are treated as inf.
        duration = Math.floor(
            Math.max(duration === null ? Infinity : duration || Infinity, 0));
    }
    // Make sure '0 <= position <= duration' always holds.
    position = Math.floor(Math.min(Math.max(position || 0, 0), duration));

    this._state = {
        initialTimestamp: null,
        initialPosition: position,
        previousPosition: position,
        duration: duration
    };

    this._userCallback(position, duration);
    return this;
};

// Marks the timer as running and then requests updates be scheduled.
ProgressTimer.prototype.start = function() {
    this._running = true;
    this._callUpdate();
    return this;
};

// Marks the timer as stopped, and then does and explicit 'set()'. This should
// both ensure that initialPosition gets set to the current position and make
// sure the _userCallback gets triggered with this position.
ProgressTimer.prototype.stop = function() {
    this._running = false;
    var state = this._state;
    // TODO: check if the set() call is really needed any more, might have been
    // just related to the updateRate option...
    return this.set(state.previousPosition, state.duration);
};

// Marks the timer as stopped and sets position to zero and duration to inf.
ProgressTimer.prototype.reset = function() {
    this._running = false;
    return this.set(0, Infinity);
};

// Internal fallback code for calling the _update method.
ProgressTimer.prototype._callUpdate = function() {
    this._update(now());
};

// Internal fallback for scheduling the next update, expects to get called with
// the timestamp of when we started handling the last frame.
ProgressTimer.prototype._scheduleUpdate = function(timestamp) {
    var adjustedTimeout = Math.floor(timestamp + this._fallbackRate - now());
    setTimeout(this._boundCallUpdate, adjustedTimeout);
};

// Internal modern code path for triggering updates via RAF.
ProgressTimer.prototype._scheduleAnimationFrame = function() {
    window.requestAnimationFrame(this._boundUpdate);
};

// Calls the user callback with the current position/duration and then
// schedules the next update run via _scheduleUpdate if we haven't finished.
ProgressTimer.prototype._update = function(timestamp) {
    if (!this._running) {
        return;
    }

    var state = this._state;  // Copy the state in case it gets replaced.
    state.initialTimestamp = state.initialTimestamp || timestamp;

    var position = state.initialPosition + timestamp - state.initialTimestamp;
    var duration = state.duration;

    // Make sure the callback gets an integer and that 'position <= duration'.
    this._userCallback(Math.min(Math.floor(position), duration), duration);

    // Keep scheduling if we haven't reached the end.
    if (position < duration) {
        state.previousPosition = position;
        this._scheduleUpdate(timestamp);
    } else {
        this._running = false;
    }
};

if(typeof module !== 'undefined') {
    module.exports = ProgressTimer;
} else {
    window.ProgressTimer = ProgressTimer;
}

}());
