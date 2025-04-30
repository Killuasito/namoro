import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
];

const TicTacToe = ({ onClose, partner }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState(null); // Add gameData state

  const resetGame = async () => {
    if (!gameId) return;

    try {
      const newGameData = {
        players: [auth.currentUser.uid, partner.id],
        board: Array(9).fill(null),
        currentPlayer: auth.currentUser.uid,
        playerX:
          gameData.playerX === auth.currentUser.uid
            ? partner.id
            : auth.currentUser.uid, // Alterna quem é X
        status: "active",
        createdAt: new Date(),
      };

      await updateDoc(doc(db, "tic_tac_toe_games", gameId), newGameData);
      setBoard(Array(9).fill(null));
      setIsXNext(true);
      setWinner(null);
      setGameData(newGameData); // Atualiza o gameData local também
    } catch (error) {
      console.error("Erro ao reiniciar o jogo:", error);
    }
  };

  useEffect(() => {
    const setupGame = async () => {
      const q = query(
        collection(db, "tic_tac_toe_games"),
        where("players", "array-contains", auth.currentUser.uid),
        where("status", "==", "active")
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
          const newGameData = {
            players: [auth.currentUser.uid, partner.id],
            board: Array(9).fill(null),
            currentPlayer: auth.currentUser.uid,
            playerX: auth.currentUser.uid,
            status: "active",
            createdAt: new Date(),
          };

          const newGame = await addDoc(
            collection(db, "tic_tac_toe_games"),
            newGameData
          );
          setGameId(newGame.id);
          setGameData(newGameData); // Set initial game data
        } else {
          const game = snapshot.docs[0];
          const currentGameData = game.data();
          setGameId(game.id);
          setGameData(currentGameData);
          setBoard(currentGameData.board);
          setIsXNext(currentGameData.currentPlayer === auth.currentUser.uid);

          // Atualizar vencedor e placar
          if (currentGameData.winner) {
            setWinner(currentGameData.winner);
            if (currentGameData.winner !== "draw") {
              setScore((prev) => ({
                player1:
                  currentGameData.winner === auth.currentUser.uid
                    ? prev.player1 + 1
                    : prev.player1,
                player2:
                  currentGameData.winner === partner.id
                    ? prev.player2 + 1
                    : prev.player2,
              }));
            }
          } else if (!currentGameData.board.includes(null)) {
            setWinner("draw");
          }
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    if (partner) {
      setupGame();
    }
  }, [partner]);

  const calculateWinner = (squares) => {
    for (let combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = async (i) => {
    if (!gameId || board[i] || winner || !isXNext) return;

    const gameRef = doc(db, "tic_tac_toe_games", gameId);
    const gameDoc = await getDoc(gameRef);
    const gameData = gameDoc.data();

    const newBoard = [...board];
    const symbol = auth.currentUser.uid === gameData.playerX ? "X" : "O";
    newBoard[i] = symbol;

    // Verificar vencedor antes de atualizar
    const winningSymbol = calculateWinner(newBoard);
    const isDraw = !newBoard.includes(null);

    // Determinar o vencedor baseado no símbolo
    const winnerId =
      winningSymbol === "X"
        ? gameData.playerX
        : winningSymbol === "O"
        ? gameData.playerX === auth.currentUser.uid
          ? partner.id
          : auth.currentUser.uid
        : null;

    await updateDoc(gameRef, {
      board: newBoard,
      currentPlayer: partner.id,
      winner: winnerId || (isDraw ? "draw" : null),
      status: winnerId || isDraw ? "finished" : "active",
    });

    if (winnerId) {
      setWinner(winnerId);
      saveScore(winnerId);
    } else if (isDraw) {
      setWinner("draw");
    }
  };

  const saveScore = async (winner) => {
    try {
      await addDoc(collection(db, "game_scores"), {
        userId: auth.currentUser.uid,
        gameId: "tictactoe",
        points: winner === auth.currentUser.uid ? 50 : 0,
        opponent: partner.id,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Erro ao salvar pontuação:", error);
    }
  };

  const renderSquare = (i) => (
    <button
      key={i}
      onClick={() => handleClick(i)}
      className={`w-20 h-20 bg-white border border-gray-200 text-3xl font-bold flex items-center justify-center
        ${!board[i] && !winner && isXNext ? "hover:bg-pink-50" : ""}`}
    >
      {board[i] === "X" && (
        <FontAwesomeIcon icon="times" className="text-pink-500" />
      )}
      {board[i] === "O" && (
        <FontAwesomeIcon icon="circle" className="text-blue-500" />
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Jogo da Velha</h3>
          <div className="flex gap-2">
            <button
              onClick={resetGame}
              className="text-gray-400 hover:text-gray-600"
              title="Reiniciar jogo"
            >
              <FontAwesomeIcon icon="redo" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon="times" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin h-8 w-8 border-4 border-pink-300 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Conectando com o parceiro...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4 gap-8">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {auth.currentUser.uid === gameData?.playerX
                    ? "Você (X)"
                    : "Você (O)"}
                </p>
                <p className="text-2xl font-bold text-pink-500">
                  {score.player1}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {partner?.displayName} (
                  {auth.currentUser.uid === gameData?.playerX ? "O" : "X"})
                </p>
                <p className="text-2xl font-bold text-blue-500">
                  {score.player2}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mx-auto w-fit mb-6">
              {board.map((_, i) => renderSquare(i))}
            </div>

            <div className="text-center">
              {winner ? (
                <div>
                  <p className="text-lg font-semibold mb-4">
                    {winner === "draw"
                      ? "Empate!"
                      : `Vencedor: ${
                          winner === auth.currentUser.uid
                            ? "Você"
                            : partner.displayName
                        }`}
                  </p>
                  <button
                    onClick={resetGame}
                    className="mt-2 px-6 py-2 bg-pink-300 text-white rounded-lg hover:bg-pink-400"
                  >
                    Jogar Novamente
                  </button>
                </div>
              ) : (
                <p className="text-lg text-gray-600">
                  {isXNext ? "Sua vez" : `Vez de ${partner?.displayName}`}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicTacToe;
