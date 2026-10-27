import React, { useState } from 'react';
import { User, Mail, MailCheck, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { SiGithub, SiGoogle } from 'react-icons/si';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const CreateAccountForm: React.FC = () => {
  const navigate = useNavigate();
  const { configured, signInWithProvider, signUpWithEmail } = useAuth();
  const [formData, setFormData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<UserData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (successMessage) {
    return <div className="mx-auto my-16 w-full max-w-md rounded-3xl border border-emerald-400/25 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-xl dark:bg-zinc-950/95"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500"><MailCheck size={32} /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[.2em] text-emerald-600">Inscription reçue</p><h2 className="mt-2 font-serif text-3xl text-zinc-900 dark:text-white">Confirmez votre adresse</h2><p role="status" className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">Nous avons envoyé un lien sécurisé à <strong>{formData.email}</strong>. Ouvrez cet e-mail pour activer votre compte GeneaTreePro.</p><p className="mt-3 text-xs text-zinc-500">Pensez à vérifier le dossier indésirable si nécessaire.</p><button type="button" onClick={() => navigate('/', { replace: true })} className="mt-7 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white">J’ai compris</button></div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is modified
    if (errors[name as keyof UserData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserData> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "Prénom requis";
    if (!formData.lastName.trim()) newErrors.lastName = "Nom requis";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    
    if (!formData.password) {
      newErrors.password = "Mot de passe requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProvider = async (provider: 'google' | 'github') => {
    setSubmitError(null);
    try {
      await signInWithProvider(provider);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Connexion impossible.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      const result = await signUpWithEmail(formData);
      if (result.requiresEmailConfirmation) {
        setSuccessMessage('Compte créé. Consultez votre e-mail pour confirmer votre inscription.');
      } else {
        navigate('/demo', { replace: true });
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Création du compte impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto my-16 w-full max-w-md rounded-2xl border border-white/80 bg-white/95 p-6 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
          Créer votre compte
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
          Commencez à explorer votre histoire familiale
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={!configured || submitting} onClick={() => void handleProvider('google')} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/15 dark:hover:bg-zinc-900"><SiGoogle size={16} /> Google</button>
        <button type="button" disabled={!configured || submitting} onClick={() => void handleProvider('github')} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/15 dark:hover:bg-zinc-900"><SiGithub size={16} /> GitHub</button>
      </div>
      {!configured && <p className="mt-3 text-sm text-amber-600">La connexion est momentanément indisponible. Réessayez dans quelques instants.</p>}
      {submitError && <p role="alert" className="mt-3 text-sm text-red-600">{submitError}</p>}
      {successMessage && <p role="status" className="mt-3 text-sm text-emerald-600">{successMessage}</p>}
      <div className="my-5 flex items-center gap-3 text-xs text-zinc-400"><span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />ou par e-mail<span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" /></div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
              Prénom
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`pl-10 w-full rounded-md border ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-colors duration-300`}
                placeholder="Asaph"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
              Nom
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`pl-10 w-full rounded-md border ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-colors duration-300`}
                placeholder="Kouokam"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
            Adresse e-mail
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`pl-10 w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-colors duration-300`}
              placeholder="email@exemple.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`pl-10 pr-10 w-full rounded-md border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-colors duration-300`}
              placeholder="Minimum 8 caractères"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`pl-10 pr-10 w-full rounded-md border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-colors duration-300`}
              placeholder="Confirmez votre mot de passe"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border ${errors.acceptTerms ? 'border-red-500' : 'border-gray-300'} rounded transition-colors duration-300`}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="acceptTerms" className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
              J'accepte les <a href="#" className="text-primary-600 hover:text-primary-500">conditions d'utilisation</a> et la <a href="#" className="text-primary-600 hover:text-primary-500">politique de confidentialité</a>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
            )}
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={!configured || submitting}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-300"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            {submitting ? 'Création…' : 'Créer mon compte'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
          Vous avez déjà un compte?{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-300">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
};

export default CreateAccountForm;
