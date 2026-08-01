var board = null;
var game = new Chess();
var $status = $('#status');
var $capturedWhite = $('#captured-white .pieces-list');
var $capturedBlack = $('#captured-black .pieces-list');

var pieceSymbols = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

// Points directly to default Chessboard.js hosted pieces
function customPieceTheme (piece) {
  return 'https://chessboardjs.com/img/chesspieces/wikipedia/' + piece + '.png';
}

// HIGHLIGHTING LOGIC
function removeHighlights () {
  $('#myBoard .square-55d63').removeClass('highlight-square');
}

function highlightSquare (square) {
  var $square = $('#myBoard .square-' + square);
  $square.addClass('highlight-square');
}

function onMouseoverSquare (square, piece) {
  // Get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  });

  // Exit if there are no legal moves available
  if (moves.length === 0) return;

  // Highlight the hovered square
  highlightSquare(square);

  // Highlight all valid destination squares
  for (var i = 0; i < moves.length; i++) {
    highlightSquare(moves[i].to);
  }
}

function onMouseoutSquare (square, piece) {
  removeHighlights();
}

// GAMEPLAY LOGIC
function onDragStart (source, piece, position, orientation) {
  if (game.game_over()) return false;

  // Only pick up pieces for the side whose turn it is
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop (source, target) {
  removeHighlights();

  // Check if move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // Auto-promote to queen
  });

  // If illegal, snap back
  if (move === null) return 'snapback';

  updateStatus();
  updateCaptured();
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
    status = moveColor + "'s Turn";
    if (game.in_check()) {
      status += ' — ⚠️ ' + moveColor + ' is in CHECK!';
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

// CONFIGURATION
var config = {
  draggable: true,
  position: 'start',
  pieceTheme: customPieceTheme,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoverSquare: onMouseoverSquare,
  onMouseoutSquare: onMouseoutSquare,
  onSnapEnd: onSnapEnd
};

board = Chessboard('myBoard', config);
updateStatus();
