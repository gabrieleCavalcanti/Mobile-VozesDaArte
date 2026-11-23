
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export interface UsuarioAutenticado {
  id_usuario?: number;
  id_autenticacao?: number;
  nome: string;
  username: string;
  email?: string;
  tipo: 'ARTISTA' | 'USUARIO';
}

interface AuthContextData {
  autenticado: boolean;
  setAutenticado: (valor: boolean) => void;
  usuario: UsuarioAutenticado | null;
  setUsuario: (usuario: UsuarioAutenticado | null) => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);

  return (
    <AuthContext.Provider
      value={{
        autenticado,
        setAutenticado,
        usuario,
        setUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
