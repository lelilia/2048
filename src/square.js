"use strict"

function Square(row, col) {
  this.col = col,
  this.row = row,
  this.val = 0
  this.events = {}
}

Square.prototype.clear = function clear() {
  this.val = 0
}

Square.prototype.set = function set(val) {
  this.val = val
}

Square.prototype.emit = function emit(eventName, param) {
  if (eventName in this.events) {
    for (const f of this.events[eventName]) {
      f(param)
    }
  }
}

Square.prototype.on = function on(eventName, cb) {
  if (!(eventName in this.events)) {
    this.events[eventName] = []
  }
  this.events[eventName].push(cb)
}

module.exports = Square