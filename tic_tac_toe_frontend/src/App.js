import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./index.css";

/**
 * Ocean Professional theme tokens
 */
const THEME = {
  primary: "#2563EB",
  secondary: "#F59E0B",
  success: "#F59E0B",
  error: "#EF4444",
  background: "#f9fafb",
  surface: "#ffffff",
  text: "#111827",
};

/**
 * Utility: calculate winner and winning line
 * Returns { winner: 'X' | 'O' | null, line: [a,b,c] | null }
 */
// PUBLIC_INTERFACE
export function calculateWinner(squares) {
  /** Determine if a player has won the game by checking all winning combinations. */
  const lines = [
    [0, 1, 2], // rows
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6], // cols
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8], // diags
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

/**
 * Square component
 */
function Square({ index, value, disabled, onClick, isWinning, onKeyNav }) {
  const ref = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      // Handle arrow keys to move focus, and Enter/Space to activate
      const { key } = e;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        e.preventDefault();
        onKeyNav(index, key);
      } else if (key === "Enter" || key === " ") {
        e.preventDefault();
        if (!disabled) onClick(index);
      }
    },
    [disabled, index, onClick, onKeyNav]
  );

  const ariaLabel = useMemo(() => {
    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;
    const valText = value ? `, ${value}` : ", empty";
    return `Cell ${row},${col}${valText}`;
  }, [index, value]);

  return (
    <button
      ref={ref}
      type="button"
      role="gridcell"
      aria-label={ariaLabel}
      aria-disabled={disabled ? "true" : "false"}
      className={`ttt-square ${isWinning ? "winning" : ""}`}
      onClick={() => onClick(index)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    >
      {value}
    </button>
  );
}

/**
 * Board component
 */
function Board({ squares, onPlay, gameOver, winningLine }) {
  const containerRef = useRef(null);

  const handleClick = (i) => {
    if (squares[i] || gameOver) return;
    onPlay(i);
  };

  const isWinningIndex = (i) =>
    Array.isArray(winningLine) && winningLine.includes(i);

  // Keyboard navigation between cells in a 3x3 grid
  const handleKeyNav = (currentIndex, key) => {
    const row = Math.floor(currentIndex / 3);
    const col = currentIndex % 3;
    let nextRow = row;
    let nextCol = col;

    if (key === "ArrowUp") nextRow = row > 0 ? row - 1 : row;
    if (key === "ArrowDown") nextRow = row < 2 ? row + 1 : row;
    if (key === "ArrowLeft") nextCol = col > 0 ? col - 1 : col;
    if (key === "ArrowRight") nextCol = col < 2 ? col + 1 : col;

    const nextIndex = nextRow * 3 + nextCol;
    const btns = containerRef.current?.querySelectorAll(".ttt-square");
    if (btns && btns[nextIndex]) {
      btns[nextIndex].focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className="board"
      role="grid"
      aria-label="Tic Tac Toe Board"
      aria-readonly={gameOver ? "true" : "false"}
    >
      {squares.map((sq, idx) => (
        <Square
          key={idx}
          index={idx}
          value={sq}
          disabled={Boolean(sq) || gameOver}
          onClick={handleClick}
          isWinning={isWinningIndex(idx)}
          onKeyNav={handleKeyNav}
        />
      ))}
    </div>
  );
}

/**
 * Status bar for current player, game result and announcements
 */
function StatusBar({ currentPlayer, winner, isDraw }) {
  const message = winner
    ? `Winner: ${winner}`
    : isDraw
    ? "It's a draw!"
    : `Current player: ${currentPlayer}`;

  const statusClass = winner
    ? "status-won"
    : isDraw
    ? "status-draw"
    : "status-turn";

  return (
    <div className={`status ${statusClass}`} aria-live="polite" role="status">
      {message}
    </div>
  );
}

/**
 * Controls: Reset / New Game
 */
function Controls({ onReset }) {
  return (
    <div className="controls">
      <button
        type="button"
        className="btn"
        onClick={onReset}
        aria-label="Start a new game"
      >
        New Game
      </button>
    </div>
  );
}

/**
 * Optional Scoreboard with localStorage persistence
 */
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const ls = window.localStorage.getItem(key);
      return ls ? JSON.parse(ls) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors (private mode or quota)
    }
  }, [key, value]);

  return [value, setValue];
}

function Scoreboard({ scores }) {
  return (
    <div className="scoreboard" aria-label="Scoreboard">
      <div className="score">
        <span className="score-label">X Wins</span>
        <span className="score-value">{scores.X}</span>
      </div>
      <div className="score">
        <span className="score-label">O Wins</span>
        <span className="score-value">{scores.O}</span>
      </div>
      <div className="score">
        <span className="score-label">Draws</span>
        <span className="score-value">{scores.draws}</span>
      </div>
    </div>
  );
}

/**
 * Root App: orchestrates the game
 */
// PUBLIC_INTERFACE
function App() {
  /** Main application component rendering the Tic Tac Toe UI with theming and accessibility. */
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useLocalStorage("ttt-scores", {
    X: 0,
    O: 0,
    draws: 0,
  });
  const [theme, setTheme] = useLocalStorage("ttt-theme", "light");

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const { winner, line } = useMemo(
    () => calculateWinner(squares),
    [squares]
  );

  const isDraw = useMemo(
    () => !winner && squares.every((s) => s !== null),
    [winner, squares]
  );

  const currentPlayer = xIsNext ? "X" : "O";
  const gameOver = Boolean(winner) || isDraw;

  const handlePlay = (i) => {
    if (gameOver || squares[i]) return;
    const next = squares.slice();
    next[i] = currentPlayer;
    setSquares(next);
    setXIsNext((prev) => !prev);
  };

  const handleReset = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };

  // Update scoreboard when game concludes
  const firstConclusionLogged = useRef(false);
  useEffect(() => {
    if (!gameOver || firstConclusionLogged.current) return;
    firstConclusionLogged.current = true;
    setScores((prev) => {
      if (winner === "X") return { ...prev, X: prev.X + 1 };
      if (winner === "O") return { ...prev, O: prev.O + 1 };
      if (isDraw) return { ...prev, draws: prev.draws + 1 };
      return prev;
    });
    // reset the flag after a brief delay to allow new games to be counted
    const t = setTimeout(() => {
      firstConclusionLogged.current = false;
    }, 200);
    return () => clearTimeout(t);
  }, [gameOver, winner, isDraw, setScores]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, [setTheme]);

  return (
    <div className="app-root" role="application" aria-label="Tic Tac Toe App" style={{ backgroundColor: THEME.background }}>
      <header className="app-header" role="banner">
        <h1 className="title">Tic Tac Toe</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>

      <main className="container" role="main">
        <section
          className="card"
          aria-label="Game Card"
          style={{ backgroundColor: THEME.surface, color: THEME.text }}
        >
          <StatusBar
            currentPlayer={xIsNext ? "X" : "O"}
            winner={winner}
            isDraw={isDraw}
          />
          <Board
            squares={squares}
            onPlay={handlePlay}
            gameOver={gameOver}
            winningLine={line}
          />
          <Controls onReset={handleReset} />
          <Scoreboard scores={scores} />
        </section>
      </main>

      <footer className="app-footer" role="contentinfo">
        <small className="muted">Ocean Professional theme</small>
      </footer>
    </div>
  );
}

export default App;
