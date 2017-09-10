//Game constants
var box; //The box.png image
var num; //The num.png image
var zero; //The zero.png image
var flag; //The flag.png image - Not to be confused with the plural 'flags'
var bomb; //The bomb.png image - Not to be confused with the plural 'bombs'
var bombs; //The number of bombs in the game
var rows; //The number of rows in the game
var columns; //The number of columns in the game
var cellWidth; //The width of each cell
var cellHeight; //The height of each cell
//Game variables
var state; //The state of the game: 0 = initial, 1 = play, 2 = game over, 3 = game win
var time; //The elapsed time (in seconds) of the game
var timer; //The timer that takes controls time intervals in milliseconds
var numbers; //A 2D array representing the number/bomb inside each cell: -1 = bomb, 0+ = not a bomb
var covered; //A 2D array representing whether each cell is covered or not: 1 = yes, 0 = no
var flags; //A 2D array representing whether a flag is over any given cell: 1 = yes, 0 = no

//Set up all of the constants and variables when the window is first loaded
window.onload = function() {
	//Set the constants
	box = new Image();
	box.src = "box.png";
	num = new Image();
	num.src = "num.png";
	zero = new Image();
	zero.src = "zero.png";
	flag = new Image();
	flag.src = "flag.png";
	bomb = new Image();
	bomb.src = "bomb.png";
	bombs = 10;
	rows = 10;
	columns = 10;
	cellWidth = 40;
	cellHeight = 40;
	//Initialize the variables
	state = 0;
	time = 0;
	timer = 0;
	numbers = [];
	covered = [];
	flags = [];
	for (var i = 0; i < rows; i++) {
		numbers[i] = [];
		covered[i] = [];
		flags[i] = [];
		for (var j = 0; j < columns; j++) {
			numbers[i][j] = 0;
			covered[i][j] = 1;
			flags[i][j] = 0;
		}
	}
	document.getElementById("game_canvas").addEventListener("click", leftClick, false);
	document.getElementById("game_canvas").addEventListener("contextmenu", rightClick, false);
	document.getElementById("header").innerHTML = "Welcome to Minesweeper!";
	document.getElementById("time").innerHTML = "Time: " + time + "s";
	drawCanvas();
}

//draw canvas from the boxes (the box.png)
function drawCanvas() {
	var context = document.getElementById("game_canvas").getContext("2d");
	var x;
	var y;

	context.clearRect(0, 0, 400, 400);
	context.font = "20px arial";
	if (state > 0) {
		for (var i = 0; i < rows; i++) {
			for (var j = 0; j < columns; j++) {
				x = j * cellWidth;
				y = i * cellHeight;

				if (covered[i][j] == 1) {
					context.drawImage(box, x, y);
					if (flags[i][j] == 1) {
						context.drawImage(flag, x, y);
					}
				} else if (numbers[i][j] != 0) {
					context.drawImage(num, x, y);
					if (numbers[i][j] > 0) {
						context.fillText(numbers[i][j], x + 15, y + 30);
					} else {
						context.drawImage(bomb, x + 2, y - 1);
					}
				} else {
					context.drawImage(zero, x, y);
				}
			}
		}
	}
	document.getElementById("covered").innerHTML = "Covered cells: " + getCellsCovered();
	document.getElementById("flags").innerHTML = "Available flags: " + getFlagsAvailable();
}

//Returns the number of cells that are covered
function getCellsCovered() {
	var result = 0;

	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < columns; j++) {
			result += covered[i][j];
		}
	}

	return result;
}

//Returns the number of flags that are available to use
function getFlagsAvailable() {
	var result = bombs;

	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < columns; j++) {
			result -= flags[i][j];
		}
	}

	return result;
}


//Starts a new game up
function newGame() {
	var x;
	var y;

	//Reset the game variables
	state = 1;
	time = -1;
	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < columns; j++) {
			numbers[i][j] = 0;
			covered[i][j] = 1;
			flags[i][j] = 0;
		}
	}
	//Plant the bombs randomly
	for (var i = 0; i < bombs; i++) {
		x = Math.floor(Math.random() * columns);
		y = Math.floor(Math.random() * rows);
		if (numbers[y][x] != -1) {
			numbers[y][x] = -1;
		} else {
			i--;
		}
	}
	//Assign numbers adjacent to the bombs
	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < columns; j++) {
			if (numbers[i][j] != -1) {
				for (var k = i - 1; k < i + 2; k++) {
					for (var l = j - 1; l < j + 2; l++) {
						if (k >= 0 && k < rows && l >= 0 && l < columns && (k != i || l != j)) {
							if (numbers[k][l] == -1) {
								numbers[i][j]++;
							}
						}
					}
				}
			}
		}
	}
	//Draw the canvas and start up the timer
	document.getElementById("header").innerHTML = "Game start!";
	drawCanvas();
	clearTimeout(timer);
	alarm();
}

//Increases the time variable by 1 every second during gameplay
function alarm() {
	time++;
	document.getElementById("time").innerHTML = "Time: " + time + "s";
	timer = setTimeout(alarm, 1000);
}

//Uncovers a cell the user left clicks on
function leftClick(event) {
	var canvas = document.getElementById("game_canvas");
	var x = Math.floor((event.pageX - canvas.offsetLeft) / cellWidth);
	var y = Math.floor((event.pageY - canvas.offsetTop) / cellHeight);

	if (state == 1 && covered[y][x] == 1 && flags[y][x] == 0) {
		covered[y][x] = 0;
		//Check the contents of the uncovered cell
		if (numbers[y][x] >= 0) {
			//If a zero was uncovered, recursively flip over the neighbors
			checkNeighbors(x, y);
			//If all that remains covered are the bombs, then game win!
			if (getCellsCovered() == bombs) {
				state = 3;
				document.getElementById("header").innerHTML = "Game win! Congratulations!";
				clearTimeout(timer);
			}
		} else {
			//Game over, so uncover all of the bombs and stop the timer
			state = 2;
			for (var i = 0; i < rows; i++) {
				for (var j = 0; j < columns; j++) {
					if (numbers[i][j] == -1) {
						covered[i][j] = 0;
						flags[i][j] = 0;
					}
				}
			}
			document.getElementById("header").innerHTML = "Game over...";
			clearTimeout(timer);
		}
		drawCanvas();
	}
}

//Check the neighbors of the cell at the given (x, y) coordinate for emptiness
function checkNeighbors(x, y) {
	if (numbers[y][x] == 0) {
		for (var i = y - 1; i < y + 2; i++) {
			for (var j = x - 1; j < x + 2; j++) {
				if (i >= 0 && i < rows && j >= 0 && j < columns && (i != y || j != x)) {
					if (covered[i][j] == 1) {
						covered[i][j] = 0;
						flags[i][j] = 0;
						checkNeighbors(j, i);
					}
				}
			}
		}
	}
}

//Places a flag on a cell the user right clicks on
function rightClick(event) {
	var canvas = document.getElementById("game_canvas");
	var x = Math.floor((event.pageX - canvas.offsetLeft) / cellWidth);
	var y = Math.floor((event.pageY - canvas.offsetTop) / cellHeight);

	event.preventDefault(); //This prevents the right-click menu from showing up afterwards
	if (state == 1 && covered[y][x] == 1) {
		if (flags[y][x] == 0) {
			if (getFlagsAvailable() > 0) {
				flags[y][x] = 1;
			}
		} else {
			flags[y][x] = 0;
		}
		drawCanvas();
	}
}