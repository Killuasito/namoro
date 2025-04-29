import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Quiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Estado para novo quiz
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    questions: [],
  });

  // Estado para nova questão
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 10,
  });

  // Novos estados para responder quiz
  const [answeringQuiz, setAnsweringQuiz] = useState(false);
  const [currentQuestionIndexAnswering, setCurrentQuestionIndexAnswering] =
    useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [attempts, setAttempts] = useState([]); // Para armazenar múltiplas tentativas

  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) return;

      try {
        // Carregar usuário atual
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            ...userData,
            uid: auth.currentUser.uid,
          });

          // Verificar se tem parceiro
          const partnerId = userData.relationship?.partnerId;
          if (partnerId) {
            const partnerDocRef = doc(db, "users", partnerId);
            const partnerDoc = await getDoc(partnerDocRef);

            if (partnerDoc.exists()) {
              setPartner({
                ...partnerDoc.data(),
                uid: partnerId,
              });
            }
          }
        }

        // SOLUÇÃO TEMPORÁRIA: Modificando a consulta para evitar o erro de índice
        try {
          // Obter quizzes criados pelo usuário
          const myQuizzesQuery = query(
            collection(db, "quizzes"),
            where("authorId", "==", auth.currentUser.uid)
          );

          // Obter quizzes onde o usuário é o parceiro
          const partnerQuizzesQuery = query(
            collection(db, "quizzes"),
            where("partnerId", "==", auth.currentUser.uid)
          );

          // Executar ambas as consultas
          const [myQuizzesSnapshot, partnerQuizzesSnapshot] = await Promise.all(
            [getDocs(myQuizzesQuery), getDocs(partnerQuizzesQuery)]
          );

          // Combinar os resultados
          const myQuizzes = myQuizzesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isAuthor: true, // Marcar os quizzes que o usuário criou
          }));

          const partnerQuizzes = partnerQuizzesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isAuthor: false, // Marcar os quizzes que o parceiro criou
          }));

          // Juntar ambas as listas e ordenar por data
          const allQuizzes = [...myQuizzes, ...partnerQuizzes].sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA; // Ordem decrescente por data
          });

          setQuizzes(allQuizzes);
          setLoading(false);
        } catch (indexError) {
          console.error("Erro na consulta: ", indexError);

          // Exibir mensagem de erro com instruções para o usuário
          const indexUrl =
            "https://console.firebase.google.com/v1/r/project/namoro-5256c/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9uYW1vcm8tNTI1NmMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3F1aXp6ZXMvaW5kZXhlcy9fEAEaDAoIYXV0aG9ySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC";

          alert(`Para melhorar a performance, esta aplicação requer a criação de um índice. 
          
Por favor, acesse o console do Firebase para criar o índice necessário. Você pode acessar usando o seguinte link:

${indexUrl}

Após criar o índice, recarregue a página.`);

          // Mostra uma lista vazia como fallback
          setQuizzes([]);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateQuiz = async () => {
    if (!newQuiz.title.trim()) {
      alert("Por favor, digite um título para o quiz");
      return;
    }

    if (newQuiz.questions.length === 0) {
      alert("Adicione pelo menos uma pergunta ao quiz");
      return;
    }

    try {
      const quizData = {
        title: newQuiz.title,
        description: newQuiz.description,
        questions: newQuiz.questions,
        authorId: auth.currentUser.uid,
        partnerId: partner?.uid || null,
        createdAt: new Date(),
        completed: false,
        partnerScore: 0,
        partnerAnswers: [],
        attempts: [],
      };

      await addDoc(collection(db, "quizzes"), quizData);

      // Resetar formulário
      setNewQuiz({
        title: "",
        description: "",
        questions: [],
      });
      setCreatingQuiz(false);
    } catch (error) {
      console.error("Erro ao criar quiz:", error);
      alert("Ocorreu um erro ao criar o quiz");
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) {
      alert("Por favor, digite a pergunta");
      return;
    }

    // Verificar se pelo menos duas opções estão preenchidas
    const filledOptions = newQuestion.options.filter(
      (opt) => opt.trim() !== ""
    );
    if (filledOptions.length < 2) {
      alert("Adicione pelo menos duas opções de resposta");
      return;
    }

    const updatedQuestions = [...newQuiz.questions];

    if (editingQuestion) {
      updatedQuestions[currentQuestionIndex] = { ...newQuestion };
    } else {
      updatedQuestions.push({ ...newQuestion });
    }

    setNewQuiz({
      ...newQuiz,
      questions: updatedQuestions,
    });

    // Resetar formulário de pergunta
    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 10,
    });

    setEditingQuestion(false);
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions,
    });
  };

  const editQuestion = (index) => {
    setCurrentQuestionIndex(index);
    setNewQuestion({ ...newQuiz.questions[index] });
    setEditingQuestion(true);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions.splice(index, 1);
    setNewQuiz({
      ...newQuiz,
      questions: updatedQuestions,
    });
  };

  const deleteQuiz = async (quizId) => {
    if (window.confirm("Tem certeza que deseja excluir este quiz?")) {
      try {
        await deleteDoc(doc(db, "quizzes", quizId));
      } catch (error) {
        console.error("Erro ao excluir quiz:", error);
        alert("Ocorreu um erro ao excluir o quiz");
      }
    }
  };

  const viewQuizDetails = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleAnswerQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setAnsweringQuiz(true);
    setCurrentQuestionIndexAnswering(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    setQuizCompleted(false);
    setFinalScore(0);
    setShowCorrectAnswers(false);
  };

  const selectAnswer = (questionIndex, optionIndex) => {
    const updatedAnswers = [...selectedAnswers];
    updatedAnswers[questionIndex] = optionIndex;
    setSelectedAnswers(updatedAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndexAnswering < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndexAnswering(currentQuestionIndexAnswering + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndexAnswering > 0) {
      setCurrentQuestionIndexAnswering(currentQuestionIndexAnswering - 1);
    }
  };

  const finishQuiz = async () => {
    if (selectedAnswers.includes(null)) {
      alert(
        "Por favor, responda todas as perguntas antes de finalizar o quiz."
      );
      return;
    }

    let score = 0;
    const answers = [];

    selectedQuiz.questions.forEach((question, index) => {
      const selectedOption = selectedAnswers[index];
      const isCorrect = selectedOption === question.correctAnswer;

      answers.push({
        questionIndex: index,
        selectedOption,
        isCorrect,
      });

      if (isCorrect) {
        score += question.points;
      }
    });

    const newAttempt = {
      id: Date.now(),
      timestamp: new Date(),
      score,
      answers,
    };

    try {
      const existingAttempts = selectedQuiz.attempts || [];
      const updatedAttempts = [...existingAttempts, newAttempt];
      const bestScore = Math.max(...updatedAttempts.map((a) => a.score));

      const quizRef = doc(db, "quizzes", selectedQuiz.id);
      await updateDoc(quizRef, {
        completed: true,
        partnerScore: bestScore,
        attempts: updatedAttempts,
        partnerAnswers: answers,
        lastCompletedAt: new Date(),
      });

      setFinalScore(score);
      setQuizCompleted(true);
      setAttempts(updatedAttempts);

      setSelectedQuiz({
        ...selectedQuiz,
        completed: true,
        partnerScore: bestScore,
        attempts: updatedAttempts,
        partnerAnswers: answers,
      });

      setQuizzes(
        quizzes.map((q) =>
          q.id === selectedQuiz.id
            ? {
                ...q,
                completed: true,
                partnerScore: bestScore,
                attempts: updatedAttempts,
              }
            : q
        )
      );
    } catch (error) {
      console.error("Erro ao salvar respostas do quiz:", error);
      alert("Ocorreu um erro ao salvar suas respostas. Tente novamente.");
    }
  };

  const retryQuiz = () => {
    setAnsweringQuiz(true);
    setQuizCompleted(false);
    setCurrentQuestionIndexAnswering(0);
    setSelectedAnswers(new Array(selectedQuiz.questions.length).fill(null));
    setShowCorrectAnswers(false);
  };

  const backToList = () => {
    setAnsweringQuiz(false);
    setSelectedQuiz(null);
    setShowCorrectAnswers(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center">
          <div className="bg-primary text-pink-300 p-3 rounded-lg shadow-md mr-4">
            <FontAwesomeIcon icon="question-circle" />
          </div>
          <span className="text-primary">Quizzes para o Casal</span>
        </h2>

        {/* Alerta informativo sobre o índice do Firestore */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-700">
          <FontAwesomeIcon icon="info-circle" className="mr-2" />
          <span>
            Se os quizzes não estiverem sendo exibidos corretamente, pode ser
            necessário criar um índice no Firestore. Entre em contato com o
            administrador do sistema.
          </span>
        </div>

        {!partner && (
          <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-700">
            <FontAwesomeIcon icon="exclamation-triangle" className="mr-2" />
            Você ainda não vinculou um parceiro(a). Vincule um parceiro(a) no
            seu perfil para compartilhar quizzes.
          </div>
        )}

        {selectedQuiz && answeringQuiz ? (
          <div className="mb-8">
            {quizCompleted ? (
              <div className="text-center">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon
                      icon="trophy"
                      className="text-3xl text-green-600"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Quiz Completado!
                  </h3>
                  <p className="text-lg text-gray-600 mb-4">
                    Você marcou{" "}
                    <span className="font-bold text-primary">
                      {finalScore} pontos
                    </span>
                  </p>

                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {selectedQuiz.questions.length}
                      </div>
                      <div className="text-sm text-gray-600">Perguntas</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {
                          selectedAnswers.filter(
                            (ans, idx) =>
                              ans === selectedQuiz.questions[idx].correctAnswer
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-600">Corretas</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={backToList}
                    className="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FontAwesomeIcon icon="arrow-left" />
                    Voltar para lista
                  </button>
                  <button
                    onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
                    className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={showCorrectAnswers ? "eye-slash" : "eye"}
                    />
                    {showCorrectAnswers ? "Ocultar respostas" : "Ver respostas"}
                  </button>
                  <button
                    onClick={retryQuiz}
                    className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FontAwesomeIcon icon="redo" />
                    Tentar Novamente
                  </button>
                </div>

                {selectedQuiz.attempts && selectedQuiz.attempts.length > 1 && (
                  <div className="mt-8 bg-white p-4 rounded-lg shadow border border-gray-200">
                    <h4 className="text-lg font-medium mb-3 text-gray-700">
                      Suas Tentativas
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nº
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pontuação
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acertos
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedQuiz.attempts.map((attempt, index) => {
                            const correctAnswers =
                              attempt.answers?.filter((a) => a.isCorrect)
                                ?.length || 0;
                            const totalQuestions =
                              selectedQuiz.questions.length;

                            return (
                              <tr
                                key={attempt.id || index}
                                className={
                                  attempt.score === finalScore
                                    ? "bg-green-50"
                                    : ""
                                }
                              >
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {index + 1}
                                  {attempt.score === finalScore && (
                                    <span className="ml-1 text-green-500">
                                      <FontAwesomeIcon icon="check" />
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {attempt.timestamp?.toDate
                                    ? attempt.timestamp
                                        .toDate()
                                        .toLocaleDateString()
                                    : new Date(
                                        attempt.timestamp
                                      ).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                  <span
                                    className={`${
                                      attempt.score ===
                                      Math.max(
                                        ...selectedQuiz.attempts.map(
                                          (a) => a.score
                                        )
                                      )
                                        ? "text-green-600"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {attempt.score} pontos
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {correctAnswers} de {totalQuestions}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {showCorrectAnswers && (
                  <div className="mt-8">
                    <h4 className="text-xl font-semibold mb-4 text-gray-700">
                      Respostas Corretas
                    </h4>
                    <div className="space-y-6">
                      {selectedQuiz.questions.map((question, qIndex) => (
                        <div
                          key={qIndex}
                          className={`p-4 rounded-lg border ${
                            selectedAnswers[qIndex] === question.correctAnswer
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-start">
                            <span className="bg-gray-200 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                              {qIndex + 1}
                            </span>
                            <div className="flex-grow">
                              <p className="font-medium text-gray-800 mb-2">
                                {question.question}
                              </p>

                              <div className="space-y-2">
                                {question.options
                                  .filter((opt) => opt.trim() !== "")
                                  .map((option, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`p-2 border rounded-md flex items-center ${
                                        question.correctAnswer === optIndex
                                          ? "bg-green-100 border-green-300"
                                          : selectedAnswers[qIndex] === optIndex
                                          ? "bg-red-100 border-red-300"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-2 bg-gray-200">
                                        {["A", "B", "C", "D"][optIndex]}
                                      </span>
                                      {option}
                                      {question.correctAnswer === optIndex && (
                                        <FontAwesomeIcon
                                          icon="check"
                                          className="ml-auto text-green-500"
                                        />
                                      )}
                                      {question.correctAnswer !== optIndex &&
                                        selectedAnswers[qIndex] ===
                                          optIndex && (
                                          <FontAwesomeIcon
                                            icon="times"
                                            className="ml-auto text-red-500"
                                          />
                                        )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {selectedQuiz.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Respondendo quiz de{" "}
                      {selectedQuiz.authorName || "seu parceiro(a)"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Tem certeza que deseja cancelar? Suas respostas serão perdidas."
                        )
                      ) {
                        setAnsweringQuiz(false);
                        setSelectedQuiz(null);
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center"
                  >
                    <FontAwesomeIcon icon="times" className="mr-2" />
                    Cancelar
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>
                      {currentQuestionIndexAnswering + 1} de{" "}
                      {selectedQuiz.questions.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-pink-300 h-2.5 rounded-full"
                      style={{
                        width: `${
                          ((currentQuestionIndexAnswering + 1) /
                            selectedQuiz.questions.length) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                  <h4 className="text-xl font-medium text-gray-800 mb-4">
                    {
                      selectedQuiz.questions[currentQuestionIndexAnswering]
                        .question
                    }
                  </h4>

                  <div className="space-y-3 mt-4">
                    {selectedQuiz.questions[
                      currentQuestionIndexAnswering
                    ].options
                      .filter((opt) => opt.trim() !== "")
                      .map((option, optIndex) => (
                        <div
                          key={optIndex}
                          onClick={() =>
                            selectAnswer(
                              currentQuestionIndexAnswering,
                              optIndex
                            )
                          }
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedAnswers[currentQuestionIndexAnswering] ===
                            optIndex
                              ? "bg-pink-50 border-pink-300 shadow-sm"
                              : "bg-white hover:bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                                selectedAnswers[
                                  currentQuestionIndexAnswering
                                ] === optIndex
                                  ? "bg-pink-300 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {["A", "B", "C", "D"][optIndex]}
                            </div>
                            <span className="text-gray-700">{option}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndexAnswering === 0}
                    className={`px-5 py-2 rounded-lg flex items-center gap-2 ${
                      currentQuestionIndexAnswering === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    }`}
                  >
                    <FontAwesomeIcon icon="arrow-left" />
                    Anterior
                  </button>

                  {currentQuestionIndexAnswering <
                  selectedQuiz.questions.length - 1 ? (
                    <button
                      onClick={goToNextQuestion}
                      disabled={
                        selectedAnswers[currentQuestionIndexAnswering] === null
                      }
                      className={`px-5 py-2 rounded-lg flex items-center gap-2 ${
                        selectedAnswers[currentQuestionIndexAnswering] === null
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-pink-300 text-white hover:bg-pink-400"
                      }`}
                    >
                      Próxima
                      <FontAwesomeIcon icon="arrow-right" />
                    </button>
                  ) : (
                    <button
                      onClick={finishQuiz}
                      disabled={selectedAnswers.includes(null)}
                      className={`px-5 py-2 rounded-lg flex items-center gap-2 ${
                        selectedAnswers.includes(null)
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      Finalizar Quiz
                      <FontAwesomeIcon icon="check" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : selectedQuiz ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 flex items-center">
                <FontAwesomeIcon
                  icon="clipboard-list"
                  className="mr-3 text-primary"
                />
                {selectedQuiz.title}
              </h3>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="text-gray-500 hover:text-gray-700 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center"
              >
                <FontAwesomeIcon icon="arrow-left" className="mr-2" />
                Voltar
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700">{selectedQuiz.description}</p>
              <div className="mt-3 flex items-center text-sm text-gray-600">
                <FontAwesomeIcon icon="user" className="mr-2" />
                {selectedQuiz.isAuthor
                  ? "Criado por você"
                  : "Criado pelo seu parceiro(a)"}
              </div>
              {selectedQuiz.completed ? (
                <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-200 text-green-700">
                  <FontAwesomeIcon icon="check-circle" className="mr-2" />
                  Quiz respondido! Melhor pontuação: {
                    selectedQuiz.partnerScore
                  }{" "}
                  pontos{" "}
                  {selectedQuiz.attempts &&
                    selectedQuiz.attempts.length > 1 && (
                      <span className="ml-2 text-xs">
                        ({selectedQuiz.attempts.length} tentativas)
                      </span>
                    )}
                </div>
              ) : (
                <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200 text-blue-700">
                  <FontAwesomeIcon icon="info-circle" className="mr-2" />
                  {selectedQuiz.isAuthor
                    ? "Este quiz ainda não foi respondido pelo seu parceiro(a)"
                    : "Você ainda não respondeu este quiz"}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4 bg-gray-50 border-b border-gray-200 font-medium">
                Perguntas do Quiz
              </div>
              {selectedQuiz.questions.map((q, index) => (
                <div
                  key={index}
                  className="p-5 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-start">
                    <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-gray-800 mb-2">
                        {q.question}
                      </p>
                      <div className="space-y-2 ml-2">
                        {q.options
                          .filter((opt) => opt.trim() !== "")
                          .map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-2 border rounded-lg flex items-center 
                            ${
                              q.correctAnswer === optIndex
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200"
                            }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold
                              ${
                                q.correctAnswer === optIndex
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                              >
                                {["A", "B", "C", "D"][optIndex]}
                              </span>
                              {option}
                              {q.correctAnswer === optIndex && (
                                <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                  Resposta correta ({q.points} pts)
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              {selectedQuiz.isAuthor ? (
                <button
                  onClick={() => deleteQuiz(selectedQuiz.id)}
                  className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FontAwesomeIcon icon="trash" />
                  Excluir Quiz
                </button>
              ) : (
                <button
                  onClick={() => handleAnswerQuiz(selectedQuiz)}
                  className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FontAwesomeIcon
                    icon={selectedQuiz.completed ? "redo" : "play"}
                  />
                  {selectedQuiz.completed
                    ? "Responder Novamente"
                    : "Responder Quiz"}
                </button>
              )}
            </div>
          </div>
        ) : creatingQuiz ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Criar Novo Quiz
              </h3>
              <button
                onClick={() => setCreatingQuiz(false)}
                className="text-gray-500 hover:text-gray-700 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Quiz
                </label>
                <input
                  type="text"
                  value={newQuiz.title}
                  onChange={(e) =>
                    setNewQuiz({ ...newQuiz, title: e.target.value })
                  }
                  placeholder="Ex: Quanto você me conhece?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newQuiz.description}
                  onChange={(e) =>
                    setNewQuiz({ ...newQuiz, description: e.target.value })
                  }
                  placeholder="Uma breve descrição do seu quiz..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary h-24"
                />
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Perguntas Adicionadas
                </h4>
                {newQuiz.questions.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                    {newQuiz.questions.map((q, index) => (
                      <div
                        key={index}
                        className="p-3 flex justify-between items-start hover:bg-gray-100"
                      >
                        <div>
                          <p className="font-medium">
                            {index + 1}. {q.question}
                          </p>
                          <p className="text-sm text-gray-500">
                            {q.options.filter((o) => o.trim()).length} opções •{" "}
                            {q.points} pontos
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editQuestion(index)}
                            className="p-1 text-blue-500 hover:text-blue-700"
                            title="Editar pergunta"
                          >
                            <FontAwesomeIcon icon="edit" />
                          </button>
                          <button
                            onClick={() => removeQuestion(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Remover pergunta"
                          >
                            <FontAwesomeIcon icon="trash" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">
                      Nenhuma pergunta adicionada ainda.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
              <h4 className="font-medium text-gray-800 mb-4">
                {editingQuestion ? "Editar Pergunta" : "Adicionar Pergunta"}
              </h4>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pergunta
                </label>
                <input
                  type="text"
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
                  placeholder="Digite sua pergunta aqui..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opções de Resposta
                </label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-l-lg border-l border-y border-gray-300 font-medium text-gray-700">
                      {["A", "B", "C", "D"][index]}
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      placeholder={`Opção ${index + 1}`}
                      className="flex-grow px-3 py-2 border-r border-y border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <div className="ml-3">
                      <input
                        type="radio"
                        id={`option-${index}`}
                        name="correct-answer"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() =>
                          setNewQuestion({
                            ...newQuestion,
                            correctAnswer: index,
                          })
                        }
                        className="w-5 h-5 accent-green-500 cursor-pointer"
                      />
                      <label
                        htmlFor={`option-${index}`}
                        className="ml-1 text-sm text-gray-600 cursor-pointer"
                      >
                        Correta
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pontos
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newQuestion.points}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      points: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <button
                onClick={handleAddQuestion}
                className={`px-5 py-2 bg-pink-300 text-white rounded-lg flex items-center gap-2`}
              >
                <FontAwesomeIcon icon={editingQuestion ? "save" : "plus"} />
                {editingQuestion ? "Salvar Alterações" : "Adicionar Pergunta"}
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleCreateQuiz}
                disabled={newQuiz.questions.length === 0}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                  newQuiz.questions.length === 0
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-pink-300 text-white hover:bg-pink-400"
                }`}
              >
                <FontAwesomeIcon icon="save" />
                Finalizar e Salvar Quiz
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-600 mb-4 sm:mb-0">
                Crie quizzes divertidos para seu parceiro(a) responder!
              </p>
              <button
                onClick={() => setCreatingQuiz(true)}
                className="px-5 py-2 bg-pink-300 text-white rounded-lg flex items-center gap-2 hover:bg-pink-400 transition-colors"
              >
                <FontAwesomeIcon icon="plus" />
                Criar Novo Quiz
              </button>
            </div>

            {quizzes.length > 0 ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">
                    <FontAwesomeIcon
                      icon="clipboard-list"
                      className="mr-2 text-primary"
                    />
                    Todos os Quizzes
                  </h3>

                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <div className="text-sm text-gray-600">
                      <FontAwesomeIcon icon="info-circle" className="mr-2" />
                      <span>
                        Aqui você encontra tanto os quizzes que você criou
                        quanto os quizzes enviados pelo seu parceiro(a).
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                    >
                      <div
                        className={`p-4 ${
                          quiz.completed
                            ? "bg-green-50 border-b border-green-100"
                            : quiz.isAuthor
                            ? "bg-gray-50 border-b border-gray-100"
                            : "bg-blue-50 border-b border-blue-100"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg text-gray-800 truncate">
                            {quiz.title}
                          </h3>
                          {quiz.isAuthor ? (
                            <span className="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full flex items-center">
                              <FontAwesomeIcon icon="edit" className="mr-1" />
                              Seu quiz
                            </span>
                          ) : (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center">
                              <FontAwesomeIcon icon="user" className="mr-1" />
                              Do parceiro
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center mb-3 text-sm text-gray-500">
                          <FontAwesomeIcon
                            icon="question-circle"
                            className="mr-2"
                          />
                          {quiz.questions.length} pergunta
                          {quiz.questions.length !== 1 && "s"}
                          <span className="mx-2">•</span>
                          <FontAwesomeIcon icon="trophy" className="mr-2" />
                          {quiz.questions.reduce(
                            (sum, q) => sum + q.points,
                            0
                          )}{" "}
                          pontos
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {quiz.description || "Sem descrição"}
                        </p>

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            <FontAwesomeIcon icon="calendar" className="mr-1" />
                            {quiz.createdAt.toDate().toLocaleDateString()}
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewQuizDetails(quiz)}
                              className="px-3 py-1 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors text-xs flex items-center gap-1"
                            >
                              <FontAwesomeIcon icon="eye" />
                              Detalhes
                            </button>

                            {quiz.isAuthor && (
                              <button
                                onClick={() => deleteQuiz(quiz.id)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Excluir quiz"
                              >
                                <FontAwesomeIcon icon="trash" />
                              </button>
                            )}

                            {!quiz.isAuthor && (
                              <button
                                onClick={() => handleAnswerQuiz(quiz)}
                                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                title="Responder quiz"
                              >
                                <FontAwesomeIcon icon="play" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FontAwesomeIcon
                    icon="question-circle"
                    className="text-4xl text-gray-400"
                  />
                </div>
                <p className="text-gray-500 text-lg mb-4">
                  Você ainda não criou nenhum quiz.
                </p>
                <p className="text-gray-400 mb-6">
                  Crie quizzes divertidos para seu parceiro(a) responder e
                  descobrir o quanto te conhece!
                </p>
                <button
                  onClick={() => setCreatingQuiz(true)}
                  className="px-5 py-2 bg-pink-300 text-white rounded-lg flex items-center gap-2 mx-auto hover:bg-pink-400 transition-colors"
                >
                  <FontAwesomeIcon icon="plus" />
                  Criar Meu Primeiro Quiz
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Quiz;
