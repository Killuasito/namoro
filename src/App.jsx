import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Componentes
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import Layout from "./components/Layout";
import Stories from "./components/Stories";
import DreamsWishes from "./components/DreamsWishes";
import SpecialNotes from "./components/SpecialNotes";
import CoupleSettings from "./components/CoupleSettings";
import HomePage from "./components/HomePage";
import Quiz from "./components/Quiz"; // Nova importação

// Add Font Awesome with expanded icon set
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faImage,
  faMusic,
  faStar,
  faEnvelope,
  faHeart,
  faUser,
  faUserPlus,
  faUserFriends,
  faSignOutAlt,
  faSignInAlt,
  faBars,
  faTimes,
  faUpload,
  faCheck,
  faRedo,
  faTrash,
  faSave,
  faCalendarAlt,
  faLock,
  faExclamationCircle,
  faInfoCircle,
  faIdCard,
  faFingerprint,
  faCamera,
  faBirthdayCake,
  faPlus,
  faSpinner,
  faQuoteLeft,
  faEye,
  faPalette,
  faMapMarkerAlt,
  faCommentDots,
  faGlobe,
  faMoon,
  faArrowRight,
  faHome,
  faCog,
  faExternalLinkAlt,
  faVolumeUp,
  faList,
  faPlay,
  faPause,
  faStop,
  faBook,
  faBookOpen,
  faPen,
  faPaperPlane,
  faHeading,
  faAlignLeft,
  faCalendar,
  faEdit,
  faSmile,
  faCoffee,
  faSun,
  faBullseye,
  // Novos ícones para Quiz
  faQuestionCircle,
  faClipboardList,
  faTrophy,
  faCheckCircle,
  faExclamationTriangle,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

// Import brand icons separately from the free-brands-svg-icons package
import {
  faSpotify,
  faSoundcloud,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

// Add icons to library
library.add(
  faImage,
  faMusic,
  faStar,
  faEnvelope,
  faHeart,
  faUser,
  faUserPlus,
  faUserFriends,
  faSignOutAlt,
  faSignInAlt,
  faBars,
  faTimes,
  faUpload,
  faCheck,
  faRedo,
  faTrash,
  faSave,
  faCalendarAlt,
  faLock,
  faExclamationCircle,
  faInfoCircle,
  faIdCard,
  faFingerprint,
  faCamera,
  faBirthdayCake,
  faPlus,
  faSpinner,
  faQuoteLeft,
  faEye,
  faPalette,
  faMapMarkerAlt,
  faCommentDots,
  faGlobe,
  faMoon,
  faArrowRight,
  faHome,
  faCog,
  faExternalLinkAlt,
  faVolumeUp,
  faList,
  faPlay,
  faPause,
  faStop,
  faSpotify,
  faSoundcloud,
  faYoutube,
  faBook,
  faBookOpen,
  faPen,
  faPaperPlane,
  faHeading,
  faAlignLeft,
  faCalendar,
  faEdit,
  faSmile,
  faCoffee,
  faSun,
  faBullseye,
  // Novos ícones para Quiz
  faQuestionCircle,
  faClipboardList,
  faTrophy,
  faCheckCircle,
  faExclamationTriangle,
  faArrowLeft
);

// CSS do Tailwind
import "./index.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={
                <Layout>
                  <HomePage />
                </Layout>
              }
            />
            <Route
              path="/stories"
              element={
                <Layout>
                  <Stories />
                </Layout>
              }
            />
            <Route
              path="/dreams"
              element={
                <Layout>
                  <DreamsWishes />
                </Layout>
              }
            />
            <Route
              path="/notes"
              element={
                <Layout>
                  <SpecialNotes />
                </Layout>
              }
            />
            <Route
              path="/quiz"
              element={
                <Layout>
                  <Quiz />
                </Layout>
              }
            />
            <Route
              path="/couple-settings"
              element={
                <Layout>
                  <CoupleSettings />
                </Layout>
              }
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
