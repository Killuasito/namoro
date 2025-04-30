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

  useEffect(() => {
    const setupGame = async () => {
      const q = query(
        collection(db, "tic_tac_toe_games"),
        where("players", "array-contains", auth.currentUser.uid),
        where("status", "==", "active")
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
          const newGame = await addDoc(collection(db, "tic_tac_toe_games"), {
            players: [auth.currentUser.uid, partner.id],
            board: Array(9).fill(null),
            currentPlayer: auth.currentUser.uid,
            status: "active",
            createdAt: new Date(),
          });
          setGameId(newGame.id);
        } else {
          const game = snapshot.docs[0];
          setGameId(game.id);
          setBoard(game.data().board);
          setIsXNext(game.data().currentPlayer === auth.currentUser.uid);
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

    const newBoard = [...board];
    newBoard[i] = auth.currentUser.uid === partner.id ? "O" : "X";

    await updateDoc(doc(db, "tic_tac_toe_games", gameId), {
      board: newBoard,
      currentPlayer: partner.id,
    });
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon="times" />
          </button>
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
                <p className="text-sm text-gray-600">Você (X)</p>
                <p className="text-2xl font-bold text-pink-500">
                  {score.player1}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {partner?.displayName} (O)
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
                <p className="text-lg font-semibold mb-4">
                  {winner === "draw"
                    ? "Empate!"
                    : `Vencedor: ${
                        winner === auth.currentUser.uid
                          ? "Você"
                          : partner.displayName
                      }`}
                </p>
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
