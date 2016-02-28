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
        this._frameDuration = Math.max(options.updateRate, 1000 / 60);
    } else {
        this._frameDuration = 1000 / (options.fallbackTargetFrameRate || 30);
    }

    this._updateId = null;
    this._boundUpdate = this._update.bind(this);

    var useFallback = typeof window.requestAnimationFrame === 'undefined' ||
                      typeof window.cancelAnimationFrame === 'undefined' ||
                      options.disableRequestAnimationFrame || false;

    if (useFallback) {
        this._scheduleUpdate = this._scheduleTimeout;
        this._cancelUpdate = window.clearTimeout.bind(window);
    } else {
        this._scheduleUpdate = this._scheduleAnimationFrame;
        this._cancelUpdate = window.cancelAnimationFrame.bind(window);
    }

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

    // Update right away if we don't have anything running.
    if (this._updateId === null) {
        this._userCallback(position, duration);
    }
    return this;
};

// Marks the timer as running and then requests updates be scheduled.
ProgressTimer.prototype.start = function() {
    this._updateId = this._scheduleUpdate(0);
    return this;
};

// Marks the timer as stopped, and then does and explicit 'set()'. This should
// both ensure that initialPosition gets set to the current position and make
// sure the _userCallback gets triggered with this position.
ProgressTimer.prototype.stop = function() {
    this._cancelUpdate(this._updateId);
    var state = this._state;
    // TODO: check if the set() call is really needed any more, might have been
    // just related to the updateRate option...
    return this.set(state.previousPosition, state.duration);
};

// Marks the timer as stopped and sets position to zero and duration to inf.
ProgressTimer.prototype.reset = function() {
    this._cancelUpdate(this._updateId);
    return this.set(0, Infinity);
};

// Internal fallback for scheduling the next update, expects to get called with
// the timestamp of when we started handling the last frame.
ProgressTimer.prototype._scheduleTimeout = function(timestamp) {
    var adjustedTimeout = Math.max(timestamp + this._frameDuration - now(), 0);
    return window.setTimeout(this._boundUpdate, Math.floor(adjustedTimeout));
};

// Internal modern code path for triggering updates via RAF.
ProgressTimer.prototype._scheduleAnimationFrame = function() {
    return window.requestAnimationFrame(this._boundUpdate);
};

// Calls the user callback with the current position/duration and then
// schedules the next update run via _scheduleUpdate if we haven't finished.
ProgressTimer.prototype._update = function(timestamp) {
    // Make sure we have timestamp for the legacy case.
    timestamp = timestamp || now();

    // Copy the state in case it gets replaced by a set call.
    var state = this._state;
    state.initialTimestamp = state.initialTimestamp || timestamp;

    var position = state.initialPosition + timestamp - state.initialTimestamp;
    var duration = state.duration;

    // Make sure the callback gets an integer and that 'position <= duration'.
    this._userCallback(Math.min(Math.floor(position), duration), duration);
    state.previousPosition = position;

    if (position < duration) {
        // Keep scheduling if we haven't reached the end.
        this._updateId = this._schedule(timestamp);
    } else {
        // Signal that we are no longer running.
        this._updateId = null;
    }
};

if(typeof module !== 'undefined') {
    module.exports = ProgressTimer;
} else {
    window.ProgressTimer = ProgressTimer;
}

}());
