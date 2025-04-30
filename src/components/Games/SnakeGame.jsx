import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../../firebase";

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 200;

const SnakeGame = ({ onClose }) => {
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([5, 5]);
  const [direction, setDirection] = useState("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const generateFood = useCallback(() => {
    const newFood = [
      Math.floor(Math.random() * GRID_SIZE),
      Math.floor(Math.random() * GRID_SIZE),
    ];
    setFood(newFood);
  }, []);

  const checkCollision = useCallback(
    (head) => {
      // Wall collision
      if (
        head[0] < 0 ||
        head[0] >= GRID_SIZE ||
        head[1] < 0 ||
        head[1] >= GRID_SIZE
      ) {
        return true;
      }

      // Self collision
      for (let i = 1; i < snake.length; i++) {
        if (head[0] === snake[i][0] && head[1] === snake[i][1]) {
          return true;
        }
      }

      return false;
    },
    [snake]
  );

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    const newSnake = [...snake];
    let head = [...newSnake[0]];

    switch (direction) {
      case "UP":
        head[1] -= 1;
        break;
      case "DOWN":
        head[1] += 1;
        break;
      case "LEFT":
        head[0] -= 1;
        break;
      case "RIGHT":
        head[0] += 1;
        break;
      default:
        break;
    }

    if (checkCollision(head)) {
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
        saveScore(score);
      }
      return;
    }

    newSnake.unshift(head);

    if (head[0] === food[0] && head[1] === food[1]) {
      setScore((s) => s + 10);
      generateFood();
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [
    snake,
    direction,
    food,
    gameOver,
    isPaused,
    score,
    highScore,
    checkCollision,
    generateFood,
  ]);

  const saveScore = async (finalScore) => {
    try {
      await addDoc(collection(db, "game_scores"), {
        userId: auth.currentUser.uid,
        gameId: "snake",
        points: finalScore,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Erro ao salvar pontuação:", error);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === " ") {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused) return;

      switch (e.key) {
        case "ArrowUp":
          direction !== "DOWN" && setDirection("UP");
          break;
        case "ArrowDown":
          direction !== "UP" && setDirection("DOWN");
          break;
        case "ArrowLeft":
          direction !== "RIGHT" && setDirection("LEFT");
          break;
        case "ArrowRight":
          direction !== "LEFT" && setDirection("RIGHT");
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    const gameInterval = setInterval(moveSnake, INITIAL_SPEED);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      clearInterval(gameInterval);
    };
  }, [direction, isPaused, moveSnake]);

  const resetGame = () => {
    setSnake([[10, 10]]);
    setDirection("RIGHT");
    setGameOver(false);
    setScore(0);
    generateFood();
    setIsPaused(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Determine swipe direction based on largest delta
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0 && direction !== "LEFT") {
        setDirection("RIGHT");
      } else if (deltaX < 0 && direction !== "RIGHT") {
        setDirection("LEFT");
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && direction !== "UP") {
        setDirection("DOWN");
      } else if (deltaY < 0 && direction !== "DOWN") {
        setDirection("UP");
      }
    }

    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Snake Game</h3>
            <p className="text-sm text-gray-500">
              Pontuação: {score} | Recorde: {highScore}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon="times" />
          </button>
        </div>

        <div
          className="relative touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            backgroundColor: "#f0f0f0",
            backgroundImage: `
              linear-gradient(#ccc 1px, transparent 1px),
              linear-gradient(90deg, #ccc 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        >
          {/* Food */}
          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              left: food[0] * CELL_SIZE + 1, // +1 para centralizar com as linhas
              top: food[1] * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />

          {/* Snake */}
          {snake.map((segment, i) => (
            <div
              key={i}
              className={`absolute rounded ${
                i === 0 ? "bg-emerald-600" : "bg-emerald-500"
              }`}
              style={{
                left: segment[0] * CELL_SIZE + 1, // +1 para centralizar com as linhas
                top: segment[1] * CELL_SIZE + 1,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />
          ))}
        </div>

        {(gameOver || isPaused) && (
          <div className="text-center mt-4">
            {gameOver ? (
              <>
                <p className="text-xl font-bold text-red-500 mb-2">
                  Fim de Jogo!
                </p>
                <p className="text-gray-600">Pontuação final: {score}</p>
              </>
            ) : (
              <p className="text-xl font-bold text-gray-700 mb-2">Pausado</p>
            )}
            <button
              onClick={resetGame}
              className="mt-2 px-6 py-2 bg-pink-300 text-white rounded-lg hover:bg-pink-400"
            >
              {gameOver ? "Jogar Novamente" : "Reiniciar"}
            </button>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500 text-center">
          {window.innerWidth < 768
            ? "Deslize para controlar • Toque para pausar"
            : "Use as setas para mover • Espaço para pausar"}
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
