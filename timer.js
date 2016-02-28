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
    window.setTimeout(function() { throw msg; }, 0);
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
        throw '"ProgressTimer" must be called with a callback or options.';
    } else if (typeof options.callback !== 'function') {
        throw '"ProgressTimer" needs a callback to operate.';
    }

    this._userCallback = options.callback;
    this._updateId = null;
    this._state = null;

    if (options.updateRate && !options.fallbackTargetFrameRate) {
        warn('"ProgressTimer" no longer supports the updateRate option.');
        this._frameDuration = Math.max(options.updateRate, 1000 / 60);
    } else {
        this._frameDuration = 1000 / (options.fallbackTargetFrameRate || 30);
    }

    var update = this._update.bind(this);
    var useFallback = typeof window.requestAnimationFrame === 'undefined' ||
                      typeof window.cancelAnimationFrame === 'undefined' ||
                      options.disableRequestAnimationFrame || false;

    if (useFallback) {
        this._schedule = this._scheduleTimeout.bind(this, update);
        this._cancel = window.clearTimeout.bind(window);
    } else {
        this._schedule = window.requestAnimationFrame.bind(window, update);
        this._cancel = window.cancelAnimationFrame.bind(window);
    }

    this.reset(); // Reuse reset code to ensure we start in the same state.
}

// If called with one argument the previous duration is preserved. Note that
// the position can be changed while the timer is running.
ProgressTimer.prototype.set = function(position, duration) {
    if (arguments.length === 0) {
        throw '"ProgressTimer.set" requires the "position" arugment.';
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
        position: position,
        duration: duration
    };

    // Update right away if we don't have anything running.
    if (this._updateId === null) {
        this._userCallback(position, duration);
    }
    return this;
};

// Start the timer if it is not already running.
ProgressTimer.prototype.start = function() {
    if (this._updateId === null) {
        // Make sure to reset the timestamp and position before scheduling to
        // ensure things are now relative to the new reference times.
        this._state.initialTimestamp = null;
        this._state.initialPosition = this._state.position;
        this._updateId = this._schedule(0);
    }
    return this;
};

// Cancel the timer if it us currently tracking progress.
ProgressTimer.prototype.stop = function() {
    if (this._updateId !== null) {
        this._cancel(this._updateId);
        this._updateId = null;
    }
    return this;
};

// Marks the timer as stopped and sets position to zero and duration to inf.
ProgressTimer.prototype.reset = function() {
    return this.stop().set(0, Infinity);
};

// Internal fallback for scheduling the next update, expects to get called with
// the timestamp of when we started handling the last frame.
ProgressTimer.prototype._scheduleTimeout = function(update, timestamp) {
    var adjustedTimeout = Math.max(timestamp + this._frameDuration - now(), 0);
    return window.setTimeout(update, Math.floor(adjustedTimeout));
};

// Calls the user callback with the current position/duration and then
// schedules the next update run via _scheduleUpdate if we haven't finished.
ProgressTimer.prototype._update = function(timestamp) {
    var state = this._state;  // We refer a lot to state, this is shorter.

    // Make sure setTimeout has a timestamp and store first reference time.
    timestamp = timestamp || now();
    state.initialTimestamp = state.initialTimestamp || timestamp;

    // Recalculate position according to start location and initial reference.
    state.position = state.initialPosition + timestamp - state.initialTimestamp;

    // Make sure the callback gets an integer and that 'position <= duration'.
    var userPosisition = Math.min(Math.floor(state.position), state.duration);
    this._userCallback(userPosisition, state.duration);

    if (state.position < state.duration) {
        this._updateId = this._schedule(timestamp);  // Schedule update.
    } else {
        this._updateId = null;  // Unset since we didn't reschedule.
    }
};

if(typeof module !== 'undefined') {
    module.exports = ProgressTimer;
} else {
    window.ProgressTimer = ProgressTimer;
}

}());
