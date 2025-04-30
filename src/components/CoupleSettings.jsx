import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createPartnerNotification } from "../utils/notifications";

const CoupleSettings = () => {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [coupleData, setCoupleData] = useState({
    anniversary: "",
    nickname: "",
    partnerNickname: "",
  });
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);

  useEffect(() => {
    const loadCoupleData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        setCurrentUser({
          ...userData,
          uid: auth.currentUser.uid,
          preferredIcon: userData.preferredIcon || "user",
          iconColor: userData.iconColor || "bg-blue-500",
        });

        const partnerId = userData.relationship?.partnerId;

        if (!partnerId) {
          setLoading(false);
          return;
        }

        const partnerDocRef = doc(db, "users", partnerId);
        const partnerDoc = await getDoc(partnerDocRef);

        if (partnerDoc.exists()) {
          const partnerData = partnerDoc.data();
          setPartner({
            ...partnerData,
            uid: partnerId,
            preferredIcon: partnerData.preferredIcon || "user",
            iconColor: partnerData.iconColor || "bg-blue-500",
          });

          const coupleDocRef = doc(
            db,
            "couples",
            `${auth.currentUser.uid}_${partnerId}`
          );
          const altCoupleDocRef = doc(
            db,
            "couples",
            `${partnerId}_${auth.currentUser.uid}`
          );

          let coupleDoc = await getDoc(coupleDocRef);

          if (!coupleDoc.exists()) {
            coupleDoc = await getDoc(altCoupleDocRef);
          }

          if (coupleDoc.exists()) {
            const data = coupleDoc.data();
            setCoupleData({
              anniversary:
                data.anniversary || userData.relationship?.anniversary || "",
              nickname: data.nicknames?.[auth.currentUser.uid] || "",
              partnerNickname: data.nicknames?.[partnerId] || "",
            });
          } else {
            setCoupleData({
              anniversary: userData.relationship?.anniversary || "",
              nickname: "",
              partnerNickname: "",
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do casal:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCoupleData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCoupleData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!partner) return;

    try {
      const userId = auth.currentUser.uid;
      const partnerId = partner.uid;

      // Verificar se o documento do casal existe
      const coupleDocRef = doc(db, "couples", `${userId}_${partnerId}`);
      const altCoupleDocRef = doc(db, "couples", `${partnerId}_${userId}`);

      // Verificar se algum dos documentos possíveis existe
      const coupleDoc = await getDoc(coupleDocRef);
      const altCoupleDoc = await getDoc(altCoupleDocRef);

      // Selecionar o documento que existe ou criar um novo
      let finalCoupleDocRef;

      if (coupleDoc.exists()) {
        finalCoupleDocRef = coupleDocRef;
      } else if (altCoupleDoc.exists()) {
        finalCoupleDocRef = altCoupleDocRef;
      } else {
        // Criar um novo documento se nenhum existir
        finalCoupleDocRef = coupleDocRef;
        await setDoc(finalCoupleDocRef, {
          userIds: [userId, partnerId],
          createdAt: new Date(),
          nicknames: {},
        });
      }

      // Atualizar o documento
      await updateDoc(finalCoupleDocRef, {
        anniversary: coupleData.anniversary,
        nicknames: {
          [userId]: coupleData.nickname,
          [partnerId]: coupleData.partnerNickname,
        },
        updatedAt: new Date(),
      });

      // Atualizar os documentos de usuário
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        "relationship.anniversary": coupleData.anniversary,
      });

      const partnerRef = doc(db, "users", partnerId);
      await updateDoc(partnerRef, {
        "relationship.anniversary": coupleData.anniversary,
      });

      // Notificar o parceiro sobre as alterações nas configurações do casal
      await createPartnerNotification(
        partnerId,
        userId,
        currentUser?.displayName ||
          auth.currentUser.displayName ||
          "Seu parceiro(a)",
        "settings",
        "atualizou as configurações do casal",
        null
      );

      alert("Configurações do casal atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Ocorreu um erro ao salvar as configurações: " + error.message);
    }
  };

  const PartnerProfileModal = ({ partner, onClose }) => (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-gray-100 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              Perfil do Parceiro
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon="times" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div
              className={`w-16 h-16 ${
                partner.iconColor || "bg-blue-500"
              } rounded-full flex items-center justify-center`}
            >
              <FontAwesomeIcon
                icon={partner.preferredIcon || "user"}
                className="text-2xl text-white"
              />
            </div>
            <div>
              <h4 className="text-lg font-semibold">{partner.displayName}</h4>
              <p className="text-sm text-gray-500">{partner.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Bio</label>
              <p className="mt-1 text-gray-600">
                {partner.bio || "Sem biografia"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Data de Nascimento
              </label>
              <p className="mt-1 text-gray-600">
                {partner.dateOfBirth
                  ? new Date(partner.dateOfBirth).toLocaleDateString()
                  : "Não informado"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                ID do Usuário
              </label>
              <p className="mt-1 text-gray-600 break-all bg-gray-100 p-2 rounded">
                {partner.uid}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="container mx-auto">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-pink-300 flex items-center">
            <FontAwesomeIcon icon="heart" className="mr-4 ml-4 text-pink-300" />
            Configurações do Casal
          </h2>
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <FontAwesomeIcon
              icon="user-friends"
              className="text-5xl text-gray-300 mb-4"
            />
            <p className="text-gray-700 mb-4">
              Você ainda não possui um parceiro(a) vinculado(a).
            </p>
            <a
              href="/profile"
              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-gray-600 rounded-md inline-flex items-center gap-2 hover:from-primary/90 hover:to-secondary/90"
            >
              <FontAwesomeIcon icon="user-plus" />
              Vincular parceiro(a) no perfil
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center">
          <FontAwesomeIcon icon="heart" className="mr-2 sm:mr-3 text-primary" />
          Configurações do Casal
        </h2>

        {/* Card do Parceiro */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-pink-50 rounded-lg">
          <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0">
            <div
              onClick={() => setShowPartnerProfile(true)}
              className={`w-16 h-16 ${
                partner?.iconColor || "bg-blue-500"
              } rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-md cursor-pointer hover:opacity-90 transition-opacity`}
            >
              <FontAwesomeIcon
                icon={partner?.preferredIcon || "user"}
                className="text-2xl"
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-medium text-gray-700">Parceiro(a):</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {partner?.displayName}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                {partner?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Ícones Personalizados */}
        <div className="mb-4 sm:mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-medium mb-3 text-gray-700 text-center">
            Seus Ícones Personalizados
          </h3>
          <div className="flex justify-center items-center space-x-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 ${
                  currentUser?.iconColor || "bg-blue-500"
                } rounded-full flex items-center justify-center shadow-md mb-2`}
              >
                <FontAwesomeIcon
                  icon={currentUser?.preferredIcon || "user"}
                  className="text-lg sm:text-2xl text-white"
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Seu ícone</p>
            </div>
            <FontAwesomeIcon
              icon="heart"
              className="text-pink-300 text-xl sm:text-2xl mx-2 sm:mx-4"
            />
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 ${
                  partner?.iconColor || "bg-blue-500"
                } rounded-full flex items-center justify-center shadow-md mb-2`}
              >
                <FontAwesomeIcon
                  icon={partner?.preferredIcon || "user"}
                  className="text-lg sm:text-2xl text-white"
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Ícone do parceiro
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon="calendar-alt" className="mr-2" />
                Data do Aniversário
              </label>
              <input
                type="date"
                name="anniversary"
                value={coupleData.anniversary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon="id-card" className="mr-2" />
                Seu apelido
              </label>
              <input
                type="text"
                name="nickname"
                value={coupleData.nickname}
                onChange={handleInputChange}
                placeholder="Como seu parceiro(a) te chama..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon="id-card" className="mr-2" />
                Apelido do parceiro(a)
              </label>
              <input
                type="text"
                name="partnerNickname"
                value={coupleData.partnerNickname}
                onChange={handleInputChange}
                placeholder="Como você chama seu parceiro(a)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 rounded-md text-white bg-pink-300 hover:bg-pink-400 transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FontAwesomeIcon icon="save" />
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
      {showPartnerProfile && (
        <PartnerProfileModal
          partner={partner}
          onClose={() => setShowPartnerProfile(false)}
        />
      )}
    </div>
  );
};

export default CoupleSettings;
