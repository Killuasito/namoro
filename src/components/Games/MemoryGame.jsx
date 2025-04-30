import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../../firebase";

const LEVELS = {
  easy: { pairs: 6, points: 50 },
  medium: { pairs: 8, points: 100 },
  hard: { pairs: 12, points: 200 },
};

const ICONS = [
  "heart",
  "star",
  "moon",
  "sun",
  "coffee",
  "music",
  "book",
  "camera",
  "cat",
  "dog",
  "leaf",
  "fire",
];

const MemoryGame = ({ onClose }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [moves, setMoves] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const initializeGame = (level) => {
    const pairs = LEVELS[level].pairs;
    const selectedIcons = ICONS.slice(0, pairs);
    const gameCards = [...selectedIcons, ...selectedIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(gameCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameStarted(true);
    setSelectedLevel(level);
    setGameFinished(false);
  };

  const handleClick = (id) => {
    if (disabled || flipped.includes(id) || matched.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      setMoves((m) => m + 1);

      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        setMatched([...matched, first, second]);
        setFlipped([]);
        setDisabled(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  const saveScore = async () => {
    try {
      const points = LEVELS[selectedLevel].points;
      await addDoc(collection(db, "game_scores"), {
        userId: auth.currentUser.uid,
        gameId: "memory",
        level: selectedLevel,
        points,
        moves,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Erro ao salvar pontuação:", error);
    }
  };

  useEffect(() => {
    if (gameStarted && matched.length === cards.length) {
      setGameFinished(true);
      saveScore();
    }
  }, [matched, cards.length, gameStarted]);

  if (!gameStarted) {
    return (
      <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon="brain" className="text-pink-500 mr-2" />
            Jogo da Memória
          </h2>

          <div className="space-y-4">
            {Object.entries(LEVELS).map(([level, config]) => (
              <button
                key={level}
                onClick={() => initializeGame(level)}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-pink-300 flex justify-between items-center group transition-all"
              >
                <span className="font-medium capitalize group-hover:text-pink-500">
                  {level}
                </span>
                <span className="text-sm text-gray-500 group-hover:text-pink-400">
                  {config.pairs * 2} cartas • {config.points} pontos
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-4xl w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Jogo da Memória</h3>
            <p className="text-sm text-gray-500">
              Movimentos: {moves} • Nível: {selectedLevel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon="times" />
          </button>
        </div>

        {gameFinished ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4 text-yellow-400">
              <FontAwesomeIcon icon="trophy" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Parabéns!</h3>
            <p className="text-gray-600 mb-6">
              Você completou o nível {selectedLevel} em {moves} movimentos!
            </p>
            <div className="space-x-4">
              <button
                onClick={() => initializeGame(selectedLevel)}
                className="px-6 py-2 bg-pink-300 text-white rounded-lg hover:bg-pink-400"
              >
                Jogar Novamente
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                Sair
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleClick(card.id)}
                className={`aspect-square rounded-lg cursor-pointer transition-all duration-300 transform 
                  ${
                    flipped.includes(card.id) || matched.includes(card.id)
                      ? "rotate-y-180"
                      : ""
                  }`}
              >
                <div className="relative w-full h-full">
                  <div
                    className={`absolute w-full h-full flex items-center justify-center 
                    ${
                      flipped.includes(card.id) || matched.includes(card.id)
                        ? "opacity-100"
                        : "opacity-0"
                    } transition-opacity duration-300`}
                  >
                    <FontAwesomeIcon
                      icon={card.icon}
                      className={`text-3xl ${
                        matched.includes(card.id)
                          ? "text-green-500"
                          : "text-pink-500"
                      }`}
                    />
                  </div>
                  <div
                    className={`absolute w-full h-full bg-gradient-to-br from-pink-300 to-pink-400 rounded-lg
                    ${
                      flipped.includes(card.id) || matched.includes(card.id)
                        ? "opacity-0"
                        : "opacity-100"
                    } transition-opacity duration-300`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <FontAwesomeIcon
                        icon="question-circle"
                        className="text-white text-opacity-50 text-2xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;
