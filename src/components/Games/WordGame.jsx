import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../../firebase";

const LEVELS = {
  easy: { length: 4, points: 60 },
  medium: { length: 6, points: 120 },
  hard: { length: 8, points: 180 },
};

const WORDS = {
  easy: [
    "AMOR",
    "BEIJO",
    "VIDA",
    "CASA",
    "DOCE",
    "FLOR",
    "ANJO",
    "RISO",
    "ARTE",
    "BOLO",
    "BEBE",
    "DOCE",
    "FADA",
    "FIEL",
    "FOTO",
    "LUAR",
    "MAGO",
    "MIMO",
    "NOAR",
    "OURO",
  ],
  medium: [
    "ROMANCE",
    "CARINHO",
    "ALEGRIA",
    "FAMÍLIA",
    "ABRAÇOS",
    "AMIZADE",
    "BONDADE",
    "DESEJO",
    "ESTRELA",
    "FELIZES",
    "NAMORO",
    "PAIXÃO",
    "PARAÍSO",
    "PRESENTE",
    "SORRISO",
    "TERNURA",
    "CARÍCIA",
    "DESTINO",
    "ENCANTO",
    "MOMENTO",
  ],
  hard: [
    "FELICIDADE",
    "CASAMENTO",
    "ETERNIDADE",
    "INFINITO",
    "ADMIRAÇÃO",
    "CONFIANÇA",
    "DEDICAÇÃO",
    "ESPERANÇA",
    "GENTILEZA",
    "HARMONIA",
    "LEALDADE",
    "LIBERDADE",
    "PACIÊNCIA",
    "PROMESSAS",
    "RESPEITO",
    "SAUDADES",
    "SINCEROS",
    "UNIVERSO",
    "VALORIZAR",
    "VERDADES",
  ],
};

const WordGame = ({ onClose }) => {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [word, setWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const maxWrongGuesses = 6;

  const initializeGame = (level) => {
    const words = WORDS[level];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameFinished(false);
    setGameWon(false);
    setSelectedLevel(level);
    setGameStarted(true);
  };

  const handleGuess = (letter) => {
    if (guessedLetters.includes(letter)) return;

    setGuessedLetters([...guessedLetters, letter]);
    if (!word.includes(letter)) {
      setWrongGuesses((prev) => prev + 1);
    }
  };

  const saveScore = async () => {
    if (!gameWon) return;
    try {
      const points =
        LEVELS[selectedLevel].points * (1 - wrongGuesses / maxWrongGuesses);
      await addDoc(collection(db, "game_scores"), {
        userId: auth.currentUser.uid,
        gameId: "word",
        level: selectedLevel,
        points: Math.round(points),
        wrongGuesses,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Erro ao salvar pontuação:", error);
    }
  };

  useEffect(() => {
    if (wrongGuesses >= maxWrongGuesses) {
      setGameFinished(true);
    }

    if (word && guessedLetters.length > 0) {
      const won = [...word].every((letter) => guessedLetters.includes(letter));
      if (won) {
        setGameWon(true);
        setGameFinished(true);
        saveScore();
      }
    }
  }, [word, guessedLetters, wrongGuesses]);

  if (!gameStarted) {
    return (
      <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon="font" className="text-pink-500 mr-2" />
            Jogo da Forca
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
                  {config.length} letras • {config.points} pontos
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

  const renderWord = () => {
    return word.split("").map((letter, i) => (
      <span key={i} className="mx-1 text-3xl">
        {guessedLetters.includes(letter) ? letter : "_"}
      </span>
    ));
  };

  return (
    <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-4xl w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Jogo da Forca</h3>
            <p className="text-sm text-gray-500">
              Erros: {wrongGuesses}/{maxWrongGuesses} • Nível: {selectedLevel}
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
            {gameWon ? (
              <>
                <div className="text-6xl mb-4 text-yellow-400">
                  <FontAwesomeIcon icon="trophy" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Parabéns!
                </h3>
                <p className="text-gray-600 mb-6">
                  Você acertou a palavra: {word}
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4 text-red-400">
                  <FontAwesomeIcon icon="heart-broken" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Fim de Jogo
                </h3>
                <p className="text-gray-600 mb-6">A palavra era: {word}</p>
              </>
            )}
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
          <div className="space-y-8">
            <div className="text-center">{renderWord()}</div>
            <div className="grid grid-cols-7 gap-2">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleGuess(letter)}
                  disabled={guessedLetters.includes(letter)}
                  className={`p-2 rounded-lg font-bold transition-all ${
                    guessedLetters.includes(letter)
                      ? "bg-gray-200 text-gray-400"
                      : "bg-pink-300 text-white hover:bg-pink-400"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordGame;
