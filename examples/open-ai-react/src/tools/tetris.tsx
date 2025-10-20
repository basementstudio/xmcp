import { type ToolMetadata } from "xmcp";
import React, { useState, useEffect, useCallback, useRef } from "react";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 800;

type Tetromino = {
  shape: number[][];
  color: string;
};

const TETROMINOS: Record<string, Tetromino> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00f2fe",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#ffd700",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#b19cd9",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#00ff00",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#ff0000",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#0000ff",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#ff7f00",
  },
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  gameWrapper: {
    display: "flex",
    gap: "30px",
    background: "rgba(0, 0, 0, 0.3)",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
  },
  boardContainer: {
    position: "relative" as const,
  },
  board: {
    background: "rgba(20, 20, 40, 0.95)",
    padding: "15px",
    borderRadius: "10px",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.5)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: `repeat(${BOARD_WIDTH}, 30px)`,
    gridTemplateRows: `repeat(${BOARD_HEIGHT}, 30px)`,
    gap: "1px",
    background: "rgba(255, 255, 255, 0.05)",
    padding: "2px",
  },
  cell: {
    width: "30px",
    height: "30px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    transition: "all 0.1s ease",
  },
  emptyCell: {
    background: "rgba(30, 30, 50, 0.8)",
  },
  sidePanel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
    minWidth: "200px",
  },
  infoBox: {
    background: "rgba(0, 0, 0, 0.4)",
    padding: "20px",
    borderRadius: "15px",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    color: "white",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "15px",
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "2px",
    color: "#fff",
    textShadow: "0 0 10px rgba(255, 255, 255, 0.3)",
  },
  score: {
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center" as const,
    color: "#ffd700",
    textShadow: "0 0 15px rgba(255, 215, 0, 0.5)",
  },
  stat: {
    fontSize: "20px",
    textAlign: "center" as const,
    color: "#fff",
    marginBottom: "10px",
  },
  nextGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 25px)",
    gridTemplateRows: "repeat(4, 25px)",
    gap: "1px",
    margin: "0 auto",
    background: "rgba(20, 20, 40, 0.5)",
    padding: "5px",
    borderRadius: "5px",
  },
  nextCell: {
    width: "25px",
    height: "25px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: "white",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
  },
  startButton: {
    background: "linear-gradient(135deg, #00ff00, #00cc00)",
  },
  pauseButton: {
    background: "linear-gradient(135deg, #ffa500, #ff8c00)",
  },
  resumeButton: {
    background: "linear-gradient(135deg, #00ff00, #00cc00)",
  },
  gameOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "10px",
  },
  gameOverText: {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#ff0000",
    marginBottom: "20px",
    textShadow: "0 0 20px rgba(255, 0, 0, 0.5)",
    animation: "pulse 1s infinite",
  },
  finalScore: {
    fontSize: "24px",
    color: "white",
    marginBottom: "30px",
  },
  controls: {
    fontSize: "14px",
    lineHeight: "1.8",
    color: "rgba(255, 255, 255, 0.9)",
  },
  controlKey: {
    fontWeight: "bold",
    color: "#ffd700",
  },
};

export const metadata: ToolMetadata = {
  name: "tetris",
  description: "Tetris React",
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Hand-tossing a map",
        invoked: "Served a fresh map",
      },
      widgetAccessible: true,
      resultCanProduceWidget: true,
    },
  },
};

/**
 * Tool handler is a React client component (NOT async)
 *
 * How it works:
 * 1. Handler is a React component function
 * 2. Framework detects .tsx file and SSR enabled
 * 3. Framework server-renders the component to HTML
 * 4. HTML is served via auto-generated resource at "ui://widget/get-pizza-map.html"
 *
 * IMPORTANT: React components cannot be async functions!
 * If you need async data, use useEffect or server-side data fetching patterns.
 */
export default function handler() {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 3, y: 0 });
  const [nextPiece, setNextPiece] = useState<Tetromino | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const getRandomTetromino = useCallback(() => {
    const pieces = Object.keys(TETROMINOS);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return TETROMINOS[randomPiece];
  }, []);

  const rotate = useCallback((matrix) => {
    const N = matrix.length;
    const rotated = Array(N)
      .fill(null)
      .map(() => Array(N).fill(0));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        rotated[j][N - 1 - i] = matrix[i][j];
      }
    }
    return rotated;
  }, []);

  const isValidMove = useCallback((piece, position, board) => {
    if (!piece) return false;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;

          if (
            newX < 0 ||
            newX >= BOARD_WIDTH ||
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  const mergePieceToBoard = useCallback((board, piece, position) => {
    const newBoard = board.map((row) => [...row]);

    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value && position.y + y >= 0) {
          newBoard[position.y + y][position.x + x] = piece.color;
        }
      });
    });

    return newBoard;
  }, []);

  const clearLines = useCallback((board) => {
    let linesCleared = 0;
    const newBoard = board.filter((row) => {
      const isComplete = row.every((cell) => cell !== null);
      if (isComplete) linesCleared++;
      return !isComplete;
    });

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }

    return { newBoard, linesCleared };
  }, []);

  const movePiece = useCallback(
    (dx, dy) => {
      if (!currentPiece || isPaused || gameOver) return false;

      const newPosition = {
        x: currentPosition.x + dx,
        y: currentPosition.y + dy,
      };

      if (isValidMove(currentPiece, newPosition, board)) {
        setCurrentPosition(newPosition);
        return true;
      }

      return false;
    },
    [currentPiece, currentPosition, board, isPaused, gameOver, isValidMove]
  );

  const rotatePiece = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;

    const rotatedShape = rotate(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };

    if (isValidMove(rotatedPiece, currentPosition, board)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [
    currentPiece,
    currentPosition,
    board,
    isPaused,
    gameOver,
    rotate,
    isValidMove,
  ]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;

    let dropPosition = { ...currentPosition };
    while (
      isValidMove(
        currentPiece,
        { ...dropPosition, y: dropPosition.y + 1 },
        board
      )
    ) {
      dropPosition.y++;
    }
    setCurrentPosition(dropPosition);
  }, [currentPiece, currentPosition, board, isPaused, gameOver, isValidMove]);

  const dropPiece = useCallback(() => {
    if (!currentPiece) return;

    if (!movePiece(0, 1)) {
      const mergedBoard = mergePieceToBoard(
        board,
        currentPiece,
        currentPosition
      );
      const { newBoard, linesCleared } = clearLines(mergedBoard);

      setBoard(newBoard);

      if (linesCleared > 0) {
        setLines((prev) => prev + linesCleared);
        setScore((prev) => prev + linesCleared * 100 * level);
        setLevel((prev) => Math.floor((prev * 10 + linesCleared) / 10));
      }

      if (currentPosition.y <= 0) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }

      setCurrentPiece(nextPiece);
      setCurrentPosition({ x: 3, y: 0 });
      setNextPiece(getRandomTetromino());
    }
  }, [
    currentPiece,
    currentPosition,
    board,
    level,
    nextPiece,
    movePiece,
    mergePieceToBoard,
    clearLines,
    getRandomTetromino,
  ]);

  const startGame = useCallback(() => {
    setBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null))
    );
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);

    const firstPiece = getRandomTetromino();
    const secondPiece = getRandomTetromino();
    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
    setCurrentPosition({ x: 3, y: 0 });
  }, [getRandomTetromino]);

  const togglePause = useCallback(() => {
    if (!isPlaying || gameOver) return;
    setIsPaused((prev) => !prev);
  }, [isPlaying, gameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          movePiece(1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          movePiece(0, 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          rotatePiece();
          break;
        case " ":
          e.preventDefault();
          hardDrop();
          break;
        case "p":
        case "P":
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [movePiece, rotatePiece, hardDrop, togglePause, isPlaying, gameOver]);

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      const speed = Math.max(100, INITIAL_SPEED - (level - 1) * 50);
      gameLoopRef.current = setInterval(dropPiece, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [dropPiece, isPlaying, isPaused, gameOver, level]);

  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row]);

    if (currentPiece && !gameOver) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const boardY = currentPosition.y + y;
            const boardX = currentPosition.x + x;
            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        });
      });
    }

    return displayBoard;
  };

  const renderNextPiece = () => {
    const grid = Array(4)
      .fill(null)
      .map(() => Array(4).fill(null));

    if (nextPiece) {
      nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            grid[y][x] = nextPiece.color;
          }
        });
      });
    }

    return grid;
  };

  const displayBoard = renderBoard();
  const nextPieceGrid = renderNextPiece();

  return (
    <div style={styles.container}>
      <div style={styles.gameWrapper}>
        <div style={styles.boardContainer}>
          <div style={styles.board}>
            <div style={styles.grid}>
              {displayBoard.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    style={{
                      ...styles.cell,
                      ...(cell
                        ? {
                            background: cell,
                            boxShadow: `0 0 10px ${cell}`,
                            border: `1px solid ${cell}`,
                          }
                        : styles.emptyCell),
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {gameOver && (
            <div style={styles.gameOverlay}>
              <h2 style={styles.gameOverText}>GAME OVER</h2>
              <p style={styles.finalScore}>Final Score: {score}</p>
              <button
                onClick={startGame}
                style={{ ...styles.button, ...styles.startButton }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.transform = "scale(1.05)")}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.transform = "scale(1)")}
              >
                NEW GAME
              </button>
            </div>
          )}
        </div>

        <div style={styles.sidePanel}>
          <div style={styles.infoBox}>
            <h3 style={styles.title}>SCORE</h3>
            <p style={styles.score}>{score}</p>
          </div>

          <div style={styles.infoBox}>
            <h3 style={styles.title}>STATS</h3>
            <p style={styles.stat}>Level: {level}</p>
            <p style={styles.stat}>Lines: {lines}</p>
          </div>

          <div style={styles.infoBox}>
            <h3 style={styles.title}>NEXT</h3>
            <div style={styles.nextGrid}>
              {nextPieceGrid.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`next-${y}-${x}`}
                    style={{
                      ...styles.nextCell,
                      ...(cell
                        ? {
                            background: cell,
                            boxShadow: `0 0 5px ${cell}`,
                          }
                        : { background: "rgba(30, 30, 50, 0.5)" }),
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {!isPlaying ? (
              <button
                onClick={startGame}
                style={{ ...styles.button, ...styles.startButton }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.transform = "scale(1.05)")}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.transform = "scale(1)")}
              >
                START GAME
              </button>
            ) : (
              <button
                onClick={togglePause}
                style={{
                  ...styles.button,
                  ...(isPaused ? styles.resumeButton : styles.pauseButton),
                }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.transform = "scale(1.05)")}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.transform = "scale(1)")}
              >
                {isPaused ? "RESUME" : "PAUSE"}
              </button>
            )}
          </div>

          <div style={styles.infoBox}>
            <h3 style={styles.title}>CONTROLS</h3>
            <div style={styles.controls}>
              <div>
                <span style={styles.controlKey}>←→</span> Move
              </div>
              <div>
                <span style={styles.controlKey}>↓</span> Soft Drop
              </div>
              <div>
                <span style={styles.controlKey}>↑</span> Rotate
              </div>
              <div>
                <span style={styles.controlKey}>Space</span> Hard Drop
              </div>
              <div>
                <span style={styles.controlKey}>P</span> Pause
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
