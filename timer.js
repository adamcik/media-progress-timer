/*! timer.js v2.0.1
 * https://github.com/adamcik/media-progress-timer
 * Copyright (c) 2015 Thomas Adamcik
 * Licensed under the Apache License, Version 2.0 */

(function() {

'use strict';

var now = typeof window.performance !== 'undefined' &&
          typeof window.performance.now !== 'undefined' &&
          window.performance.now.bind(window.performance) || Date.now ||
          function() { return new Date().getTime(); };

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

    this._running = false;
    this._updateRate = Math.max(options.updateRate || 100, 10);
    this._callback = options.callback;
    this._fallback = typeof window.requestAnimationFrame === 'undefined' ||
                     options.disableRequestAnimationFrame|| false;

    if (!this._fallback) {
        this._initialUpdate = this._scheduleAnimationFrame;
        this._scheduleUpdate = this._scheduleAnimationFrame;
    }

    this.reset();
}

ProgressTimer.prototype.set = function(position, duration) {
    if (arguments.length === 0) {
        throw 'set requires at least a position argument.';
    } else if (arguments.length === 1) {
        duration = this._state.duration;
    } else {
        duration = Math.floor(
            Math.max(duration === null ? Infinity : duration || 0, 0));
    }
    position = Math.floor(Math.min(Math.max(position || 0, 0), duration));

    this._state = {
        initialTimestamp: null,
        previousTimestamp: null,
        initialPosition: position,
        previousPosition: position,
        duration: duration
    };

    this._callback(position, duration);
    return this;
};

ProgressTimer.prototype.start = function() {
    this._running = true;
    this._initialUpdate(this._state);
    return this;
};

ProgressTimer.prototype.stop = function() {
    this._running = false;
    var state = this._state;
    return this.set(state.previousPosition, state.duration);
};

ProgressTimer.prototype.reset = function() {
    this._running = false;
    return this.set(0, Infinity);
};

ProgressTimer.prototype._initialUpdate = function(state) {
    this._update();
};

ProgressTimer.prototype._scheduleUpdate = function(state) {
    var adjustedTimeout = state.previousTimestamp + this._updateRate - now();
    setTimeout(this._update.bind(this), adjustedTimeout);
};

ProgressTimer.prototype._scheduleAnimationFrame = function(state) {
    window.requestAnimationFrame(this._update.bind(this));
};

ProgressTimer.prototype._update = function(timestamp) {
    if (!this._running) {
        return;
    }

    timestamp = typeof timestamp !== 'undefined' ? timestamp : now();

    var state = this._state;
    state.initialTimestamp = state.initialTimestamp || timestamp;
    state.previousTimestamp = timestamp;

    var position = Math.floor(
        state.initialPosition + (timestamp - state.initialTimestamp));

    if (state.duration === null || position < state.duration) {
        var delta = position - state.previousPosition;
        if (this._fallback || delta >= this._updateRate) {
            this._callback(position, state.duration);
            state.previousPosition = position;
        }
        this._scheduleUpdate(state);
    } else {
        this._running = false;
        this._callback(state.duration, state.duration);
    }
};

if(typeof module !== 'undefined'){
    module.exports = ProgressTimer;
}
else{
    window.ProgressTimer = ProgressTimer;
}

}());
