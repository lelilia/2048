"use strict"

const NUMBER_OF_SQUARES = 4

function Game() {
  this.squares = []
  this.events = {}
}

Game.prototype.newGame = function newGame() {
  this.squares = []
  for (let row = 0; row < NUMBER_OF_SQUARES; row++) {
    for (let col = 0; col < NUMBER_OF_SQUARES; col++){
      this.squares.push({
        row,
        col,
        val: 0
      })
    }
  }
  // two new vals 
  this.fillRandomEmptySquare()
  this.fillRandomEmptySquare()
  this.emit("draw")
}

// find an empty squar on the board 

Game.prototype.findEmptySquares = function findEmptySquares() {
  const emptySquares = []
  for (const square of this.squares) {
    if (square.val === 0) {
      emptySquares.push(square.row * NUMBER_OF_SQUARES + square.col)
    }
  }
  return emptySquares
}

// get a specific square on the board 
Game.prototype.getSquare = function getSquare(row, col) {
  return this.squares[row * NUMBER_OF_SQUARES + col]
}

Game.prototype.maxSquare = function maxSquare(){
  const squares = []
  for (const square of this.squares) {
    squares.push(square.val)
  }
  return Math.max(...squares)
}

// fill a random empty square with a random start value 

Game.prototype.fillRandomEmptySquare = function fillRandomEmptySquare() {
  const emptySquares = this.findEmptySquares()
  const indexEmptySquare = emptySquares[~~(Math.random() * emptySquares.length)]
  let randomNewValue = Math.random()
  if (randomNewValue > 0.99) {
    randomNewValue = 8
  }
  else if (randomNewValue > 0.8) {
    randomNewValue = 4
  }
  else {
    randomNewValue = 2
  }
  this.squares[indexEmptySquare].val = randomNewValue
  this.emit("new", indexEmptySquare)
}

// checkes if there are possible moves left 

Game.prototype.isGameLost = function isGameLost() {
  const emptySquares = this.findEmptySquares()
  if (emptySquares.length !== 0) {
    return false
  }
  const arrayOfValues = []
  for (const square of this.squares) {
    arrayOfValues.push(square.val)
  }
  for (let row = 0; row < NUMBER_OF_SQUARES; row++) {
    for (let col = 0; col < NUMBER_OF_SQUARES - 1; col++) {
      const index = row * NUMBER_OF_SQUARES + col
      if (arrayOfValues[index] === arrayOfValues[index+1] || arrayOfValues[index] === arrayOfValues[index + NUMBER_OF_SQUARES]){
        return false
      }
    }
    if (arrayOfValues[row * NUMBER_OF_SQUARES + 3] === arrayOfValues[(row + 1) * NUMBER_OF_SQUARES + 3]) {
      return false
    }
  }
  return true
}


Game.prototype.emit = function emit(eventName, param = 0) {
  if (eventName in this.events) {
    for (const f of this.events[eventName]) {
      f(param)
    }
  }
}

Game.prototype.on = function on(eventName, cb) {
  if (!(eventName in this.events)){
    this.events[eventName] = []
  }
  this.events[eventName].push(cb)
}

// handle the line that is being moved 

Game.prototype.handleStack = function handleStack(arr) {
  let changeBool = false
  let merges = new Array(NUMBER_OF_SQUARES)
  for (let i = 0; i < NUMBER_OF_SQUARES; i++) {
    if (arr[i] === 0) {
      for (let j = i+1; j < NUMBER_OF_SQUARES; j++) {
        if (arr[j] !== 0) {
          arr[i] = arr[j]
          arr[j] = 0
          changeBool = true
          break
        }
      }
    }
    if (arr[i] !== 0) {
      for (let j = i + 1; j < NUMBER_OF_SQUARES; j++) {
        if (arr[i] === arr[j]){
          arr[i] *= 2
          arr[j] = 0
          changeBool = true
          merges[i] = 1
          break
        }
        else if (arr[j] !== 0) {
          break
        }
      }
    }
  }
  return [changeBool, arr, merges]
}

// handle a move 

Game.prototype.move = function move(direction) {
  this.emit("clearClass")
  let somethingHappend = false
  for (let row = 0; row < NUMBER_OF_SQUARES; row++) {
    let arr = []
    for (let col = 0; col < NUMBER_OF_SQUARES; col++) {
      if (direction === "right" || direction === "left") {
        arr.push(this.getSquare(row,col).val)
      }
      else {
        arr.push(this.getSquare(col,row).val)
      }
    }
    if (direction === "right" || direction === "down"){
      arr = arr.reverse()
    }
    let [changeBool, newArr, merges] = this.handleStack(arr)
    if (changeBool) {
      if (direction === "right" || direction === "down") {
        newArr = newArr.reverse()
        merges = merges.reverse()
      }
      somethingHappend = true
      for (let col = 0; col < NUMBER_OF_SQUARES; col++) {
        if (direction === "right" || direction === "left"){
          this.getSquare(row,col).val = newArr[col]
          if (merges[col] === 1) {
            this.emit("merged", [row,col])
          }
        }
        else {
          this.getSquare(col,row).val = newArr[col]
          if (merges[col] === 1) {
            this.emit("merged", [col,row])
          }
        }
      }
    }
  }
  if (somethingHappend) {
    this.fillRandomEmptySquare()
  }
  this.emit("draw")
  if (this.isGameLost()){
    this.emit("lost")
  }
}
// ------------------------------------------------------------------------------------
// ------------------------ Index File ------------------------------------------------
// ------------------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const game = new Game()
  const elements = {
    squares: document.querySelectorAll(".board-square"),
    gameContainer: document.querySelector(".game-container")
  }

  game.on("draw", () => {
    
    for (const index in game.squares) {
      if (game.squares[index].val !== 0) {
        elements.squares[index].innerText = game.squares[index].val
      }
      else {
        elements.squares[index].innerText = ""
      }
      elements.squares[index].setAttribute("data-value", game.squares[index].val)
    }
  })

  game.on("lost", () => {
    const score = game.maxSquare()
    alert("You have lost\nYour best square has a value of: "+score)
    game.newGame()
  })

  game.on("merged", ([row, col]) => {
    const index = row * NUMBER_OF_SQUARES + col 
    elements.squares[index].classList.add("merged")
  })

  game.on("new", (index) => {
    elements.squares[index].classList.add("new")
  })

  game.on("clearClass", () => {
    for (const square of elements.squares) {
      square.classList.remove("new")
      square.classList.remove("merged")
    }
  })


  game.newGame()

  // handle Key Input
  document.addEventListener("keydown", (key) => {
    key.preventDefault()
    if (key.key === "ArrowRight") {
      game.move("right")
    }
    else if (key.key === "ArrowLeft") {
      game.move("left")
    }
    else if (key.key === "ArrowUp") {
      game.move("up")
    }
    else if (key.key === "ArrowDown") {
      game.move("down")
    }
  })


  


  // handle swipes 

  let startX
  let startY
  let distX
  let distY
  let distance 
  const minDistance = 15

  elements.gameContainer.addEventListener("touchstart", (touch) => {
    touch.preventDefault()
    distance = 0
    distX = 0
    distY = 0
    startX = touch.changedTouches[0].pageX
    startY = touch.changedTouches[0].pageY
  })
  elements.gameContainer.addEventListener("touchmove", (touch) => {
    touch.preventDefault()
  })

  elements.gameContainer.addEventListener("touchend", (touch) => {
    touch.preventDefault()
    distX = startX - touch.changedTouches[0].pageX
    distY = startY - touch.changedTouches[0].pageY
    distance = Math.sqrt(distX ** 2 + distY ** 2)
    if (distance > minDistance) {
      if (Math.abs(distX) > Math.abs(distY) * 2) {
        // left or right
        if (distX < 0) {
          game.move("right")
        }
        else {
          game.move("left")
        }
      }
      else if (Math.abs(distY) > Math.abs(distX) * 2){
        // up or down
        if (distY < 0) {
          game.move("down")
        }
        else {
          game.move("up")
        }
      }
    }
  })
})

