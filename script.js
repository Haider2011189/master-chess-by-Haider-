// High-definition classic chess pieces configuration
var config = {
    position: 'start',
    draggable: true,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

var board = Chessboard('myBoard', config);
var game = new Chess();