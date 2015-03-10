/*! timer.js v1.1.1
 * https://github.com/adamcik/media-progress-timer
 * Copyright (c) 2015 Thomas Adamcik
 * Licensed under the Apache License, Version 2.0 */

(function() {

"use strict";

var now = typeof window.performance !== 'undefined' &&
          typeof window.performance.now !== 'undefined' &&
          window.performance.now || Date.now ||
          function() { return new Date().getTime(); };

function ProgressTimer(options) {
    if (!(this instanceof ProgressTimer)) {
        return new ProgressTimer(options);
    }
    if (typeof options === 'function') {
        options = {'callback': options};
    } else if (typeof options !== 'object') {
        throw "ProgressTimer must be called with a callback or options.";
    }
    if (typeof options.callback !== 'function') {
        throw "ProgressTimer needs a callback to operate.";
    }

    this._state = this._initialize(null, null);
    this._running = false;
    this._updateRate = Math.max(options.updateRate || 100, 10);
    this._callback = options.callback;
    this._fallback = typeof window.requestAnimationFrame === 'undefined' ||
                     options.disableRequestAnimationFrame|| false;

    if (!this._fallback) {
        this._initialUpdate = this._scheduleAnimationFrame;
        this._scheduleUpdate = this._scheduleAnimationFrame;
    }
}

ProgressTimer.prototype.start = function(position, duration) {
    this._state = this._initialize(position, duration);
    this._callback(this._initialPosition, this._duration);
    this._running = true;
    this._initialUpdate();
};

ProgressTimer.prototype.resume = function() {
    if (!this._running) {
        var state = this._state;
        this.start(state.previousPosition, state.duration);
    }
};

ProgressTimer.prototype.stop = function() {
    this._running = false;
};

ProgressTimer.prototype.reset = function() {
    this.start(0, 0);
};

ProgressTimer.prototype._initialize = function(position, duration) {
    position = Math.max(position || 0, 0);
    if (typeof duration === 'number') {
        duration = Math.max(duration, 0);
        position = Math.min(position, duration);
    } else {
        duration = null;
    }
    return {
        initialTimestamp: null,
        previousTimestamp: null,
        initialPosition: position,
        previousPosition: position,
        duration: duration
    };
};

ProgressTimer.prototype._initialUpdate = function() {
    this._update(now());
};

ProgressTimer.prototype._scheduleUpdate = function(state) {
    var adjustedTimeout = state.previousTimestamp + this._updateRate - now();
    setTimeout((function() {
        this._update(now());
    }).bind(this), adjustedTimeout);
};

ProgressTimer.prototype._scheduleAnimationFrame = function(state) {
    window.requestAnimationFrame(this._update.bind(this));
};

ProgressTimer.prototype._update = function(timestamp) {
    if (!this._running) {
        return;
    }

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

if(typeof module !== "undefined"){
    module.exports = ProgressTimer;
}
else{
    window.ProgressTimer = ProgressTimer;
}

}());
