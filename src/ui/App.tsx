import { HashRouter, NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppStateProvider } from "./state/AppStateContext";
import { Home } from "./screens/Home";
import { Progress } from "./screens/Progress";
import { Relecture } from "./screens/Relecture";
import { Review } from "./screens/Review";
import { Settings } from "./screens/Settings";
import styles from "./App.module.css";

const NAV = [
  { to: "/", label: "Accueil", icon: "🏠" },
  { to: "/progression", label: "Progression", icon: "📈" },
  { to: "/reglages", label: "Réglages", icon: "⚙️" },
];

function Layout({ withNav }: { withNav: boolean }) {
  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        <Outlet />
      </div>
      {withNav && (
        <nav className={styles.nav} aria-label="Navigation principale">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}>
              <span aria-hidden="true">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

/** Une route par écran. V2 : /quiz, /scenarios, /cartes-perso, /badges. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout withNav />}>
        <Route path="/" element={<Home />} />
        <Route path="/progression" element={<Progress />} />
        <Route path="/reglages" element={<Settings />} />
        <Route path="/relecture" element={<Relecture />} />
      </Route>
      <Route element={<Layout withNav={false} />}>
        <Route path="/revision" element={<Review />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppStateProvider>
  );
}
