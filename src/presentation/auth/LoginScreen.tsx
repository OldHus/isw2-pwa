import { useEffect, useState, type FormEvent } from "react";
import { useAuthViewModel } from "./hooks/useAuthViewModel";
import { useNavigate } from "react-router-dom";
import { Routes as AppRoutePaths } from "../../routes/Routes";
import { UserRole } from "../../store/slices/sessionSlice";
import styles from "./LoginScreen.module.scss";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function LoginScreen() {
  const { uiState, onSignInWithGoogle, onSignInWithEmail } = useAuthViewModel();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const isLoading = uiState.status === "loading";

  useEffect(() => {
    if (uiState.status === "error") {
      setPassword("");
    }
  }, [uiState.status]);

  useEffect(() => {
    if (uiState.status === "existingUserSuccess") {
      navigate(uiState.role === UserRole.TEACHER ? AppRoutePaths.teacherHome : AppRoutePaths.studentHome, {
        replace: true,
      });
    }
  }, [uiState, navigate]);

  useEffect(() => {
    if (uiState.status === "newUserSuccess") {
      navigate(AppRoutePaths.courseCode, { replace: true });
    }
  }, [uiState, navigate]);

  const handleEmailSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSignInWithEmail(email, password);
  };

  return (
    <div className={styles.screen}>
      <img src="/icon_trans.png" alt="" className={styles.logo} />
      <h1 className={styles.title}>Bienvenido de vuelta</h1>

      <form className={styles.form} onSubmit={handleEmailSubmit}>
        <label className={styles.label} htmlFor="email">Correo</label>
        <input
          id="email"
          className={styles.input}
          type="email"
          placeholder="tucorreo@unal.edu.co"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
        />

        <label className={styles.label} htmlFor="password" style={{ marginTop: 12 }}>Contraseña</label>
        <div className={styles.passwordWrapper}>
          <input
            id="password"
            className={styles.input}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isLoading}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <button className={styles.submitButton} type="submit" disabled={isLoading}>
          {isLoading ? "Ingresando..." : "Continuar"}
        </button>
      </form>

      <p className={styles.divider}>o</p>

      <div className={styles.altOptions}>
        <button className={styles.altButton} onClick={onSignInWithGoogle} disabled={isLoading}>
          <GoogleIcon />
          Continuar con Google institucional
        </button>
      </div>

      {uiState.status === "error" && (
        <p className={styles.error} role="alert" aria-live="polite">
          {uiState.message}
        </p>
      )}

      <p className={styles.privacyNotice}>
        Al continuar, aceptas nuestra <a className={styles.privacyLink} href="https://sevargas.com/privacidad" target="_blank" rel="noopener noreferrer">política de privacidad</a>.
      </p>
    </div>
  );
}