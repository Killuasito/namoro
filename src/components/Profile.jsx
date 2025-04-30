import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { db, auth } from "../firebase";
import Layout from "./Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    dateOfBirth: "",
    relationshipStatus: "single",
    partnerId: "",
    anniversary: "",
    preferredIcon: "user",
    iconColor: "bg-blue-500",
  });

  const [passwordChange, setPasswordChange] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const adjustDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!auth.currentUser) return;

      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            displayName: data.displayName || auth.currentUser.displayName || "",
            bio: data.bio || "",
            dateOfBirth: data.dateOfBirth ? adjustDate(data.dateOfBirth) : "",
            relationshipStatus: data.relationship?.status || "single",
            partnerId: data.relationship?.partnerId || "",
            anniversary: data.relationship?.anniversary
              ? adjustDate(data.relationship.anniversary)
              : "",
            preferredIcon: data.preferredIcon || "user",
            iconColor: data.iconColor || "bg-blue-500",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const availableIcons = [
    { icon: "user", label: "Perfil" },
    { icon: "heart", label: "Coração" },
    { icon: "star", label: "Estrela" },
    { icon: "smile", label: "Sorriso" },
    { icon: "music", label: "Música" },
    { icon: "book", label: "Livro" },
    { icon: "coffee", label: "Café" },
    { icon: "camera", label: "Câmera" },
    { icon: "moon", label: "Lua" },
    { icon: "sun", label: "Sol" },
    { icon: "globe", label: "Mundo" },
    { icon: "palette", label: "Arte" },
    { icon: "compass", label: "Bússola" },
    { icon: "gamepad", label: "Games" },
    { icon: "pizza-slice", label: "Comida" },
    { icon: "cat", label: "Gato" },
    { icon: "dog", label: "Cachorro" },
    { icon: "leaf", label: "Natureza" },
    { icon: "fire", label: "Fogo" },
    { icon: "water", label: "Água" },
  ];

  const colorOptions = [
    "bg-pink-300",
    "bg-pink-400",
    "bg-pink-500",
    "bg-red-300",
    "bg-red-400",
    "bg-red-500",
    "bg-orange-300",
    "bg-orange-400",
    "bg-orange-500",
    "bg-amber-300",
    "bg-amber-400",
    "bg-amber-500",
    "bg-green-300",
    "bg-green-400",
    "bg-green-500",
    "bg-emerald-300",
    "bg-emerald-400",
    "bg-emerald-500",
    "bg-blue-300",
    "bg-blue-400",
    "bg-blue-500",
    "bg-sky-300",
    "bg-sky-400",
    "bg-sky-500",
    "bg-purple-300",
    "bg-purple-400",
    "bg-purple-500",
    "bg-violet-300",
    "bg-violet-400",
    "bg-violet-500",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIconSelect = (icon) => {
    setProfileData((prev) => ({
      ...prev,
      preferredIcon: icon,
    }));
  };

  const handleColorSelect = (color) => {
    setProfileData((prev) => ({
      ...prev,
      iconColor: color,
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      setPasswordError("As senhas não conferem");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordChange.currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordChange.newPassword);

      setPasswordSuccess("Senha atualizada com sucesso!");
      setPasswordChange({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError("Erro ao alterar senha. Verifique sua senha atual.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Nenhum usuário logado");

      await updateProfile(user, {
        displayName: profileData.displayName,
      });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        preferredIcon: profileData.preferredIcon,
        iconColor: profileData.iconColor,
        bio: profileData.bio,
        dateOfBirth: profileData.dateOfBirth
          ? adjustDate(profileData.dateOfBirth)
          : null,
        relationship: {
          status: profileData.relationshipStatus,
          partnerId: profileData.partnerId,
          anniversary: profileData.anniversary
            ? adjustDate(profileData.anniversary)
            : null,
        },
        updatedAt: new Date(),
      });

      alert("Perfil atualizado com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Ocorreu um erro ao salvar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const passwordChangeForm = (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mt-6 border border-gray-200">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 text-pink-300 flex items-center">
        <FontAwesomeIcon icon="key" className="mr-2" />
        Alterar Senha
      </h3>
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <FontAwesomeIcon icon="lock" className="mr-2" />
            Senha Atual
          </label>
          <input
            type="password"
            value={passwordChange.currentPassword}
            onChange={(e) =>
              setPasswordChange((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <FontAwesomeIcon icon="key" className="mr-2" />
            Nova Senha
          </label>
          <input
            type="password"
            value={passwordChange.newPassword}
            onChange={(e) =>
              setPasswordChange((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <FontAwesomeIcon icon="lock-open" className="mr-2" />
            Confirmar Nova Senha
          </label>
          <input
            type="password"
            value={passwordChange.confirmPassword}
            onChange={(e) =>
              setPasswordChange((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
        </div>
        {passwordError && (
          <p className="text-red-500 text-sm flex items-center">
            <FontAwesomeIcon icon="exclamation-circle" className="mr-2" />
            {passwordError}
          </p>
        )}
        {passwordSuccess && (
          <p className="text-green-500 text-sm flex items-center">
            <FontAwesomeIcon icon="check-circle" className="mr-2" />
            {passwordSuccess}
          </p>
        )}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-pink-300 text-white rounded-md hover:bg-pink-400 transition-colors flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon="key" />
          Alterar Senha
        </button>
      </form>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-pink-300 flex items-center">
            <FontAwesomeIcon icon="user" className="mr-4 ml-4 text-pink-300" />
            Meu Perfil
          </h2>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-700">
                  <FontAwesomeIcon icon="palette" className="mr-2" />
                  Escolha seu ícone de perfil
                </h3>

                <div className="flex justify-center mb-4">
                  <div
                    className={`w-20 h-20 ${profileData.iconColor} rounded-full flex items-center justify-center shadow-md`}
                  >
                    <FontAwesomeIcon
                      icon={profileData.preferredIcon}
                      className="text-3xl text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-4 mt-3">
                  {availableIcons.map((item) => (
                    <div
                      key={item.icon}
                      onClick={() => handleIconSelect(item.icon)}
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-lg transition-all ${
                        profileData.preferredIcon === item.icon
                          ? "bg-primary/10 border-2 border-primary scale-105"
                          : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1 sm:mb-2 ${
                          profileData.preferredIcon === item.icon
                            ? profileData.iconColor
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={item.icon}
                          className="text-lg sm:text-xl text-white"
                        />
                      </div>
                      <span className="text-xs text-center">{item.label}</span>
                    </div>
                  ))}
                </div>

                <h4 className="text-md font-medium mt-6 mb-2 text-gray-700">
                  <FontAwesomeIcon icon="palette" className="mr-2" />
                  Escolha a cor do seu ícone
                </h4>

                <div className="grid grid-cols-8 gap-1 sm:gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded-full ${color} ${
                        profileData.iconColor === color
                          ? "ring-2 ring-offset-2 ring-gray-700 transform scale-110"
                          : "hover:scale-110 transition-transform"
                      }`}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon="user" className="mr-2" />
                    Nome
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={profileData.displayName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon="birthday-cake" className="mr-2" />
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profileData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon="info-circle" className="mr-2" />
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Fale um pouco sobre você..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon="heart" className="mr-2" />
                    Status de Relacionamento
                  </label>
                  <select
                    name="relationshipStatus"
                    value={profileData.relationshipStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="single">Solteiro(a)</option>
                    <option value="in-relationship">
                      Em um relacionamento
                    </option>
                    <option value="engaged">Noivo(a)</option>
                    <option value="married">Casado(a)</option>
                  </select>
                </div>

                {profileData.relationshipStatus !== "single" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon="calendar-alt" className="mr-2" />
                      Data do Relacionamento
                    </label>
                    <input
                      type="date"
                      name="anniversary"
                      value={profileData.anniversary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                )}

                {profileData.relationshipStatus !== "single" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon="user-friends" className="mr-2" />
                      ID do Parceiro(a)
                    </label>
                    <input
                      type="text"
                      name="partnerId"
                      value={profileData.partnerId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="ID do usuário do seu parceiro(a)"
                    />
                    <p className="text-xs text-gray-500 mt-1 flex items-start">
                      <FontAwesomeIcon
                        icon="info-circle"
                        className="mr-1 mt-0.5 flex-shrink-0"
                      />
                      <span>
                        Para vincular perfis, peça para seu parceiro(a)
                        verificar o ID dele(a) no perfil.
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full sm:w-auto px-6 py-2 rounded-md text-white flex items-center justify-center gap-2 ${
                    saving
                      ? "bg-pink-300 cursor-not-allowed"
                      : "bg-pink-300 hover:from-primary/90 hover:to-secondary/90 transform hover:scale-[1.02] transition-all duration-200"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={saving ? "spinner" : "save"}
                    className={saving ? "animate-spin" : ""}
                  />
                  {saving ? "Salvando..." : "Salvar Perfil"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mt-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <FontAwesomeIcon icon="id-card" className="mr-2 text-primary" />
              Informações da Conta
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700 mb-2 flex flex-wrap items-center">
                <FontAwesomeIcon
                  icon="fingerprint"
                  className="mr-2 text-gray-600"
                />
                <strong className="mr-1">ID do Usuário:</strong>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm break-all">
                  {auth.currentUser?.uid}
                </code>
              </p>
              <p className="text-gray-700 flex flex-wrap items-center">
                <FontAwesomeIcon
                  icon="envelope"
                  className="mr-2 text-gray-600"
                />
                <strong className="mr-1">Email:</strong>
                <span className="break-all">{auth.currentUser?.email}</span>
              </p>
            </div>
          </div>

          {passwordChangeForm}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
