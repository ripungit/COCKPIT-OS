"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondsToMs = secondsToMs;
exports.nowSeconds = nowSeconds;
exports.addSeconds = addSeconds;
exports.isPast = isPast;
exports.isFuture = isFuture;
function secondsToMs(seconds) {
    return seconds * 1000;
}
function nowSeconds() {
    return Math.floor(Date.now() / 1000);
}
function addSeconds(date, seconds) {
    return new Date(date.getTime() + seconds * 1000);
}
function isPast(date) {
    return date.getTime() < Date.now();
}
function isFuture(date) {
    return date.getTime() > Date.now();
}
//# sourceMappingURL=time.util.js.map