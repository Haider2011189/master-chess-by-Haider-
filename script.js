var board = null;
var game = new Chess();
var $status = $('#status');
var $capturedWhite = $('#captured-white .pieces-list');
var $capturedBlack = $('#captured-black .pieces-list');

var pieceSymbols = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

function onDragStart (source, piece, position, orientation) {
  if (game.game_over()) return false;

  // Only pick up pieces for the side whose turn it is
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop (source, target) {
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
        // White captured a black piece
        $capturedWhite.append('<span>' + symbol + '</span>');
      } else {
        // Black captured a white piece
        $capturedBlack.append('<span>' + symbol + '</span>');
      }
    }
  });
}

var config = {
  draggable: true,
  position: 'start',
  // HIGH-RES WORKING PIECE THEME (Lichess Cesta Set):
  pieceTheme: 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cesta/{piece}.svg',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
};

board = Chessboard('myBoard', config);
updateStatus();
