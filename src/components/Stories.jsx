import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [newStory, setNewStory] = useState({
    title: "",
    content: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userStories = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (story) =>
            story.authorId === auth.currentUser?.uid ||
            story.partnerId === auth.currentUser?.uid
        );
      setStories(userStories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setNewStory({
      title: "",
      content: "",
    });
    setEditingStory(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newStory.title.trim() || !newStory.content.trim()) {
      alert("Por favor, preencha o título e o conteúdo da história.");
      return;
    }

    setSubmitting(true);
    try {
      const currentUser = auth.currentUser;

      if (isEditing && editingStory) {
        const storyRef = doc(db, "stories", editingStory.id);
        await updateDoc(storyRef, {
          title: newStory.title,
          content: newStory.content,
          updatedAt: new Date(),
        });

        alert("História atualizada com sucesso!");
      } else {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};
        const partnerId = userData.relationship?.partnerId || null;

        await addDoc(collection(db, "stories"), {
          title: newStory.title,
          content: newStory.content,
          authorId: currentUser.uid,
          authorName: currentUser.displayName,
          partnerId: partnerId,
          createdAt: new Date(),
        });
      }

      resetForm();
    } catch (error) {
      console.error("Erro ao salvar história:", error);
      alert("Ocorreu um erro ao salvar a história.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingStory = (story) => {
    setEditingStory(story);
    setNewStory({
      title: story.title,
      content: story.content,
    });
    setIsEditing(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteStory = async (storyId) => {
    if (window.confirm("Tem certeza que deseja excluir esta história?")) {
      try {
        await deleteDoc(doc(db, "stories", storyId));
        if (editingStory && editingStory.id === storyId) {
          resetForm();
        }
      } catch (error) {
        console.error("Erro ao excluir história:", error);
        alert("Ocorreu um erro ao excluir a história.");
      }
    }
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
            <FontAwesomeIcon icon="book" />
          </div>
          <span className="text-primary">Nossas Histórias</span>
        </h2>

        <div className="mb-10 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="font-semibold text-xl mb-4 text-gray-700 flex items-center">
            <div className="bg-primary/10 text-primary p-2 rounded-lg mr-3">
              <FontAwesomeIcon icon={isEditing ? "edit" : "pen"} />
            </div>
            {isEditing ? "Editar História" : "Adicionar Nova História"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                <FontAwesomeIcon icon="heading" className="mr-2" /> Título da
                História
              </label>
              <input
                type="text"
                name="title"
                value={newStory.title}
                onChange={handleInputChange}
                placeholder="Título da sua história..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                <FontAwesomeIcon icon="align-left" className="mr-2" /> Conteúdo
              </label>
              <textarea
                name="content"
                value={newStory.content}
                onChange={handleInputChange}
                placeholder="Escreva sua história aqui..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary h-40"
              />
            </div>

            <div className="flex justify-center gap-4">
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon="times" />
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-3 ${
                  submitting
                    ? "bg-gray-400"
                    : "bg-pink-300 hover:shadow-lg hover:shadow-primary/20 transform hover:scale-[1.02]"
                } text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto`}
              >
                <FontAwesomeIcon
                  icon={
                    submitting ? "spinner" : isEditing ? "save" : "paper-plane"
                  }
                  className={submitting ? "animate-spin" : ""}
                />
                {submitting
                  ? "Salvando..."
                  : isEditing
                  ? "Atualizar História"
                  : "Salvar História"}
              </button>
            </div>
          </form>
        </div>

        {stories.length > 0 ? (
          <div className="space-y-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-semibold text-gray-800">
                    {story.title}
                  </h4>
                  <div className="flex gap-2">
                    {story.authorId === auth.currentUser?.uid && (
                      <>
                        <button
                          onClick={() => startEditingStory(story)}
                          className="text-gray-400 hover:text-blue-500 p-1"
                          title="Editar história"
                        >
                          <FontAwesomeIcon icon="edit" />
                        </button>
                        <button
                          onClick={() => deleteStory(story.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Excluir história"
                        >
                          <FontAwesomeIcon icon="trash" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">
                    {story.content}
                  </p>
                </div>

                <div className="mt-5 flex justify-between text-sm text-gray-500">
                  <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full">
                    <FontAwesomeIcon icon="user" className="mr-2" />
                    {story.authorName || "Anônimo"}
                  </div>
                  <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full">
                    <FontAwesomeIcon icon="calendar" className="mr-2" />
                    {new Date(
                      story.createdAt?.toDate?.() || story.createdAt
                    ).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon
                icon="book-open"
                className="text-4xl text-gray-400"
              />
            </div>
            <p className="text-gray-500 text-lg mb-4">
              Nenhuma história adicionada ainda.
            </p>
            <p className="text-gray-400">
              Compartilhe suas memórias especiais com seu par!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
