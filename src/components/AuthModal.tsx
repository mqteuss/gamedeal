import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Loader2, ArrowRight, Github, UserPlus, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) => {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetState = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
    setSuccessMsg(null);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    resetState();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB.');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      console.error('Avatar upload failed:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        // Validação customizada de senha
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
          setError('A senha deve ter pelo mínimo 6 caracteres, contendo letras e números.');
          setIsLoading(false);
          return;
        }

        if (!username.trim()) {
          setError('Por favor, insira um nome de usuário.');
          setIsLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        // Se o registro foi bem-sucedido e temos um usuário, atualizar o perfil
        if (signUpData.user) {
          let avatarUrl: string | null = null;

          // Upload do avatar se selecionado
          if (avatarFile) {
            avatarUrl = await uploadAvatar(signUpData.user.id);
          }

          // Atualizar perfil com username e avatar
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              username: username.trim(),
              avatar_url: avatarUrl,
            })
            .eq('id', signUpData.user.id);

          if (profileError) {
            console.error('Failed to update profile:', profileError);
          }
        }

        setSuccessMsg('Cadastro realizado com sucesso! Por favor, verifique sua caixa de entrada para confirmar o email antes de entrar.');
        setMode('login');
        setPassword('');
        setUsername('');
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        await refreshProfile();
        handleClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message.includes('Invalid login credentials')) {
        setError('Email ou senha inválidos.');
      } else if (err.message.includes('User already registered')) {
        setError('Este email já está cadastrado.');
      } else if (err.message.includes('Password should be at least')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
         setError(err.message || 'Ocorreu um erro durante a autenticação.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com GitHub.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={handleClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Criar Conta'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Error & Success Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-start"
                >
                  <span className="flex-1">{error}</span>
                </motion.div>
              )}
              {successMsg && mode === 'login' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-start"
                >
                  <span className="flex-1">{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload - só no Cadastro */}
              {mode === 'register' && (
                <div className="flex flex-col items-center mb-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-full border-2 border-dashed border-white/20 hover:border-emerald-500/50 cursor-pointer overflow-hidden flex items-center justify-center bg-zinc-800 transition-colors group"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={28} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-xs text-zinc-500 mt-2">Clique para adicionar foto</p>
                </div>
              )}

              {/* Username - só no Cadastro */}
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-400 px-1">Nome de Usuário</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserPlus className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Seu nome de exibição"
                      autoComplete="username"
                      className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-zinc-950/50 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 px-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-zinc-950/50 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 px-1">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={mode === 'register' ? 'Mínimo 6 chars (letras e números)' : '••••••••'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={mode === 'register' ? 6 : undefined}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-zinc-950/50 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-black bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Entrar' : 'Criar Conta'}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 flex items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-500 text-sm">ou continuar com</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGithubLogin}
                className="w-full flex justify-center py-3 px-4 border border-white/10 rounded-xl shadow-sm bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
              >
                <span className="sr-only">Sign in with GitHub</span>
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </button>
            </div>

          </div>

          {/* Footer toggle */}
          <div className="px-6 py-4 bg-zinc-950/50 border-t border-white/5 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {mode === 'login' ? (
                <>Não tem uma conta? <span className="text-emerald-500 font-medium">Cadastre-se</span></>
              ) : (
                <>Já tem uma conta? <span className="text-emerald-500 font-medium">Entrar</span></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
