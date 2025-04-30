import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  getDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MemoryGame from "./Games/MemoryGame";
import WordGame from "./Games/WordGame";
import TicTacToe from "./Games/TicTacToe";
import SnakeGame from "./Games/SnakeGame";

const Games = () => {
  const [scores, setScores] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMemoryGame, setShowMemoryGame] = useState(false);
  const [showWordGame, setShowWordGame] = useState(false);
  const [showTicTacToe, setShowTicTacToe] = useState(false);
  const [showSnakeGame, setShowSnakeGame] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) return;

      try {
        // Carregar dados do usuário atual
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: auth.currentUser.uid,
            ...userData,
          });

          // Carregar dados do parceiro se existir
          if (userData.relationship?.partnerId) {
            const partnerDoc = await getDoc(
              doc(db, "users", userData.relationship.partnerId)
            );
            if (partnerDoc.exists()) {
              setPartner({
                id: partnerDoc.id,
                ...partnerDoc.data(),
              });
            }
          }
        }

        // Escutar mudanças nas pontuações
        const scoresQuery = query(collection(db, "game_scores"));
        const unsubscribe = onSnapshot(scoresQuery, (snapshot) => {
          const scoresData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setScores(scoresData);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const saveScore = async (gameId, points) => {
    try {
      await addDoc(collection(db, "game_scores"), {
        userId: auth.currentUser.uid,
        gameId,
        points,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Erro ao salvar pontuação:", error);
    }
  };

  const calculateRanking = () => {
    if (!currentUser || !partner) return [];

    const userTotalPoints = scores
      .filter((score) => score.userId === currentUser.id)
      .reduce((sum, score) => sum + score.points, 0);

    const partnerTotalPoints = scores
      .filter((score) => score.userId === partner.id)
      .reduce((sum, score) => sum + score.points, 0);

    return [
      { user: currentUser, points: userTotalPoints },
      { user: partner, points: partnerTotalPoints },
    ].sort((a, b) => b.points - a.points);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ranking = calculateRanking();

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center">
          <FontAwesomeIcon icon="gamepad" className="mr-4 text-pink-300" />
          <span className="text-pink-300">Jogos do Casal</span>
        </h2>

        {/* Ranking */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">
            <FontAwesomeIcon icon="trophy" className="mr-2 text-yellow-400" />
            Ranking
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {ranking.map((player, index) => (
              <div
                key={player.user.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg mb-2 last:mb-0 border border-gray-100"
              >
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? "bg-yellow-400" : "bg-gray-200"
                    } text-white font-bold mr-3`}
                  >
                    {index + 1}
                  </div>
                  <div
                    className={`w-10 h-10 ${
                      player.user.iconColor || "bg-gray-300"
                    } rounded-full flex items-center justify-center mr-3`}
                  >
                    <FontAwesomeIcon
                      icon={player.user.preferredIcon || "user"}
                      className="text-white"
                    />
                  </div>
                  <span className="font-medium">{player.user.displayName}</span>
                </div>
                <div className="text-lg font-bold text-pink-300">
                  {player.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Jogos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Jogo da Memória */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-32 flex items-center justify-center">
                <FontAwesomeIcon icon="brain" className="text-4xl text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/30 p-2">
                <h4 className="text-white font-medium">Jogo da Memória</h4>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">
                Teste sua memória encontrando os pares de cartas. Diferentes
                níveis disponíveis!
              </p>
              <button
                onClick={() => setShowMemoryGame(true)}
                className="w-full py-2 bg-pink-300 text-white rounded-lg hover:bg-pink-400 transition-colors"
              >
                Jogar
              </button>
            </div>
          </div>

          {/* Jogo da Forca */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 h-32 flex items-center justify-center">
                <FontAwesomeIcon icon="font" className="text-4xl text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/30 p-2">
                <h4 className="text-white font-medium">Jogo da Forca</h4>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">
                Teste seu vocabulário tentando adivinhar palavras românticas.
              </p>
              <button
                onClick={() => setShowWordGame(true)}
                className="w-full py-2 bg-pink-300 text-white rounded-lg hover:bg-pink-400 transition-colors"
              >
                Jogar
              </button>
            </div>
          </div>

          {/* Jogo da Velha */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-32 flex items-center justify-center">
                <FontAwesomeIcon
                  icon="hashtag"
                  className="text-4xl text-white"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/30 p-2">
                <h4 className="text-white font-medium">Jogo da Velha</h4>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">
                Desafie o computador em uma partida do clássico jogo da velha.
              </p>
              <button
                onClick={() => setShowTicTacToe(true)}
                className="w-full py-2 bg-pink-300 text-white rounded-lg hover:bg-pink-400 transition-colors"
              >
                Jogar
              </button>
            </div>
          </div>

          {/* Snake Game */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 h-32 flex items-center justify-center">
                <FontAwesomeIcon
                  icon="dragon"
                  className="text-4xl text-white"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/30 p-2">
                <h4 className="text-white font-medium">Snake Game</h4>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">
                Controle a cobrinha e colete a maior quantidade de comida
                possível.
              </p>
              <button
                onClick={() => setShowSnakeGame(true)}
                className="w-full py-2 bg-pink-300 text-white rounded-lg hover:bg-pink-400 transition-colors"
              >
                Jogar
              </button>
            </div>
          </div>
        </div>

        {/* Modal do Jogo da Memória */}
        {showMemoryGame && (
          <MemoryGame onClose={() => setShowMemoryGame(false)} />
        )}
        {showWordGame && <WordGame onClose={() => setShowWordGame(false)} />}
        {showTicTacToe && (
          <TicTacToe
            onClose={() => setShowTicTacToe(false)}
            partner={partner}
          />
        )}
        {showSnakeGame && <SnakeGame onClose={() => setShowSnakeGame(false)} />}
      </div>
    </div>
  );
};

export default Games;
