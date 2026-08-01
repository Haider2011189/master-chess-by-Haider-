var board = null;
var game = new Chess();
var $status = $('#status');
var $capturedWhite = $('#captured-white .pieces-list');
var $capturedBlack = $('#captured-black .pieces-list');

// Game mode state: 'bot' or 'friend'
var gameMode = 'bot';

// Tracks the square clicked by the user for click-to-move
var selectedSquare = null;

var pieceSymbols = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

function customPieceTheme (piece) {
  return 'https://chessboardjs.com/img/chesspieces/wikipedia/' + piece + '.png';
}

// HIGHLIGHTING LOGIC
function removeHighlights () {
  $('#myBoard .square-55d63').removeClass('highlight-square selected-square');
}

function highlightSquare (square) {
  var $square = $('#myBoard .square-' + square);
  $square.addClass('highlight-square');
}

function highlightSelectedSquare (square) {
  var $square = $('#myBoard .square-' + square);
  $square.addClass('selected-square');
}

function showLegalMoves (square) {
  removeHighlights();

  var moves = game.moves({
    square: square,
    verbose: true
  });

  if (moves.length === 0) return;

  // Highlight selected origin piece
  highlightSelectedSquare(square);

  // Highlight all legal destination squares
  for (var i = 0; i < moves.length; i++) {
    highlightSquare(moves[i].to);
  }
}

// BOT (AI) LOGIC
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

// CLICK-TO-MOVE LOGIC
function onSquareClick (square, piece) {
  // Prevent moving during bot turn
  if (gameMode === 'bot' && game.turn() === 'b') return;

  // 1. If no piece is selected yet
  if (selectedSquare === null) {
    if (!piece) return; // Clicked on empty square

    // Only allow selecting pieces for current turn
    if ((game.turn() === 'w' && piece.search(/^w/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^b/) !== -1)) {
      selectedSquare = square;
      showLegalMoves(square);
    }
    return;
  }

  // 2. If clicking on the same selected square, unselect it
  if (selectedSquare === square) {
    selectedSquare = null;
    removeHighlights();
    return;
  }

  // 3. Try to execute the move from selectedSquare -> square clicked
  var move = game.move({
    from: selectedSquare,
    to: square,
    promotion: 'q'
  });

  // If illegal move, check if player clicked another piece of their own to switch selection
  if (move === null) {
    if (piece && ((game.turn() === 'w' && piece.search(/^w/) !== -1) ||
                  (game.turn() === 'b' && piece.search(/^b/) !== -1))) {
      selectedSquare = square;
      showLegalMoves(square);
    } else {
      selectedSquare = null;
      removeHighlights();
    }
    return;
  }

  // Move succeeded! Update board & reset selection state
  board.position(game.fen());
  selectedSquare = null;
  removeHighlights();

  updateStatus();
  updateCaptured();

  // Trigger bot turn if active
  if (gameMode === 'bot' && !game.game_over()) {
    window.setTimeout(makeBotMove, 250);
  }
}

// DRAG AND DROP BACKUP
function onDragStart (source, piece, position, orientation) {
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

  var move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  if (move === null) return 'snapback';

  updateStatus();
  updateCaptured();

  if (gameMode === 'bot' && !game.game_over()) {
    window.setTimeout(makeBotMove, 250);
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
    status = (gameMode === 'bot' && game.turn() === 'b') ? "Bot is thinking..." : moveColor + "'s Turn";
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

// CONFIGURATION
var config = {
  draggable: true,
  position: 'start',
  pieceTheme: customPieceTheme,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSquareClick: onSquareClick,
  onSnapEnd: onSnapEnd
};

board = Chessboard('myBoard', config);
updateStatus();
