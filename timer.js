/*! timer.js v1.0
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
    }

    this._initialize(null, null);
    this._updateRate = Math.max(options.updateRate || 100, 10);
    this._callback = options.callback || function() {};
    this._fallback = typeof window.requestAnimationFrame === 'undefined' ||
                     options.disableRequestAnimationFrame|| false;

    if (!this._fallback) {
        this._initialUpdate = this._scheduleAnimationFrame;
        this._scheduleUpdate = this._scheduleAnimationFrame;
    }
}

ProgressTimer.prototype.start = function(position, duration) {
    this._initialize(position, duration);
    this._callback(this._initialPosition, this._duration);
    this._initialUpdate();
};

ProgressTimer.prototype.stop = function() {
    this._stopped = true;
};

ProgressTimer.prototype.reset = function() {
    this._stopped = true;
    this._callback(0, 0);
};

ProgressTimer.prototype._initialize = function(position, duration) {
    this._initialTimestamp = null;
    this._previousTimestamp = null;
    this._initialPosition = Math.max(position || 0, 0);
    this._previousPosition = null;
    this._duration =
        typeof duration === 'number' ? Math.max(duration, 0) : null;
    this._stopped = false;
};

ProgressTimer.prototype._initialUpdate = function() {
    this._update(now());
};

ProgressTimer.prototype._scheduleUpdate = function(first) {
    var adjustedTimeout = this._previousTimestamp + this._updateRate - now();
    setTimeout((function() {
        this._update(now());
    }).bind(this), adjustedTimeout);
};

ProgressTimer.prototype._scheduleAnimationFrame = function() {
    window.requestAnimationFrame(this._update.bind(this));
};

ProgressTimer.prototype._update = function(timestamp) {
    if (this._stopped) {
        return;
    }

    this._initialTimestamp = this._initialTimestamp || timestamp;
    this._previousTimestamp = timestamp;

    var position = Math.floor(
        this._initialPosition + (timestamp - this._initialTimestamp));

    if (this._duration === null || position < this._duration) {
        var delta = position - this._previousPosition;
        if (this._fallback || delta >= this._updateRate) {
            this._callback(position, this._duration);
            this._previousPosition = position;
        }
        this._scheduleUpdate();
    } else {
        this._callback(this._duration, this._duration);
    }
};

if(typeof module !== "undefined"){
    module.exports = ProgressTimer;
}
else{
    window.ProgressTimer = ProgressTimer;
}

}());
