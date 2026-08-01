var board = null;
var game = new Chess();
var $status = $('#status');
var $capturedWhite = $('#captured-white .pieces-list');
var $capturedBlack = $('#captured-black .pieces-list');

var gameMode = 'bot';
var selectedSquare = null;

var pieceSymbols = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

function customPieceTheme (piece) {
  return 'https://chessboardjs.com/img/chesspieces/wikipedia/' + piece + '.png';
}

function removeHighlights () {
  $('#myBoard .square-55d63').removeClass('highlight-square selected-square');
}

function highlightSquare (square) {
  $('#myBoard .square-' + square).addClass('highlight-square');
}

function highlightSelectedSquare (square) {
  $('#myBoard .square-' + square).addClass('selected-square');
}

function showLegalMoves (square) {
  removeHighlights();
  var moves = game.moves({ square: square, verbose: true });
  if (moves.length === 0) return;

  highlightSelectedSquare(square);
  for (var i = 0; i < moves.length; i++) {
    highlightSquare(moves[i].to);
  }
}

// BOT LOGIC
function makeBotMove () {
  var possibleMoves = game.moves();
  if (game.game_over() || possibleMoves.length === 0) return;

  var captureMoves = game.moves({ verbose: true }).filter(m => m.captured);
  var chosenMove;

  if (captureMoves.length > 0) {
    var randomCapture = captureMoves[Math.floor(Math.random() * captureMoves.length)];
    chosenMove = randomCapture.san;
  } else {
    var randomIndex = Math.floor(Math.random() * possibleMoves.length);
    chosenMove = possibleMoves[randomIndex];
  }

  game.move(chosenMove);
  board.position(game.fen());
  updateStatus();
  updateCaptured();
}

// CLICK / TAP TO MOVE LOGIC
function handleSquareClick (square) {
  if (gameMode === 'bot' && game.turn() === 'b') return;

  var pieceOnSquare = game.get(square);

  // 1. First selection
  if (selectedSquare === null) {
    if (!pieceOnSquare) return;
    if ((game.turn() === 'w' && pieceOnSquare.color === 'w') ||
        (game.turn() === 'b' && pieceOnSquare.color === 'b')) {
      selectedSquare = square;
      showLegalMoves(square);
    }
    return;
  }

  // 2. Unselect if tapping same square
  if (selectedSquare === square) {
    selectedSquare = null;
    removeHighlights();
    return;
  }

  // 3. Attempt move
  var move = game.move({
    from: selectedSquare,
    to: square,
    promotion: 'q'
  });

  if (move === null) {
    // If clicked on another piece of same color, switch selection
    if (pieceOnSquare && pieceOnSquare.color === game.turn()) {
      selectedSquare = square;
      showLegalMoves(square);
    } else {
      selectedSquare = null;
      removeHighlights();
    }
    return;
  }

  // Success
  board.position(game.fen());
  selectedSquare = null;
  removeHighlights();
  updateStatus();
  updateCaptured();

  if (gameMode === 'bot' && !game.game_over()) {
    window.setTimeout(makeBotMove, 300);
  }
}

function onDragStart (source, piece) {
  if (game.game_over()) return false;
  if (gameMode === 'bot' && game.turn() === 'b') return false;
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop (source, target) {
  removeHighlights();
  selectedSquare = null;

  var move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';

  updateStatus();
  updateCaptured();

  if (gameMode === 'bot' && !game.game_over()) {
    window.setTimeout(makeBotMove, 300);
  }
}

function onSnapEnd () {
  board.position(game.fen());
}

function updateStatus () {
  var status = '';
  var moveColor = (game.turn() === 'w') ? 'White' : 'Black';

  if (game.in_checkmate()) {
    status = '🏆 Game over, ' + moveColor + ' is in checkmate!';
  } else if (game.in_draw()) {
    status = '🤝 Game over, drawn position';
  } else {
    status = (gameMode === 'bot' && game.turn() === 'b') ? "Computer is thinking..." : moveColor + "'s Turn";
    if (game.in_check()) {
      status += ' — ⚠️ CHECK!';
    }
  }

  $status.html(status);
}

function updateCaptured() {
  var history = game.history({ verbose: true });
  $capturedWhite.empty();
  $capturedBlack.empty();

  history.forEach(function(move) {
    if (move.captured) {
      var symbol = pieceSymbols[move.captured] || move.captured;
      if (move.color === 'w') {
        $capturedWhite.append('<span>' + symbol + '</span>');
      } else {
        $capturedBlack.append('<span>' + symbol + '</span>');
      }
    }
  });
}

var config = {
  draggable: true,
  position: 'start',
  pieceTheme: customPieceTheme,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
};

board = Chessboard('myBoard', config);

// Bind click handler directly to board squares for instant mobile taps
$('#myBoard').on('click', '.square-55d63', function() {
  var square = $(this).attr('data-square');
  handleSquareClick(square);
});

updateStatus();
