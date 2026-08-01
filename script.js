var board = null;
var game = new Chess();
var $status = $('#status');
var $capturedWhite = $('#captured-white .pieces-list');
var $capturedBlack = $('#captured-black .pieces-list');

var pieceSymbols = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

// Explicit Wikimedia SVG mapping to guarantee pieces load without CORS blocks
function customPieceTheme (piece) {
  var pieces = {
    'wP': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'wR': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'wN': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'wB': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'wQ': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'wK': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    'bP': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    'bR': 'https://upload.wikimedia.org/wikipedia/commons/ff/ff/Chess_rdt45.svg',
    'bN': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Chess_ndt45.svg',
    'bB': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'bQ': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'bK': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
  };
  return pieces[piece];
}

// --- HIGHLIGHTING LOGIC ---
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

  // Exit if there are no moves available for this square
  if (moves.length === 0) return;

  // Highlight the square being hovered
  highlightSquare(square);

  // Highlight all possible destination squares
  for (var i = 0; i < moves.length; i++) {
    highlightSquare(moves[i].to);
  }
}

function onMouseoutSquare (square, piece) {
  removeHighlights();
}

// --- GAMEPLAY LOGIC ---
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
    promotion: 'q' // Default auto-promote to Queen
  });

  // Illegal move
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

// Board Configuration
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
