
import * as SecureStore from 'expo-secure-store';
import { fetch as expoFetch } from 'expo/fetch';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL não foi configurada no arquivo .env'
  );
}

const BASE_URL = API_URL.replace(/\/+$/, '');

interface ApiError {
  message?: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  message: string;
  accessToken: string;
}

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// ========================================
// SALVAR TOKENS
// ========================================

export async function salvarTokens(tokens: Tokens) {
  await SecureStore.setItemAsync(
    ACCESS_TOKEN_KEY,
    tokens.accessToken
  );

  await SecureStore.setItemAsync(
    REFRESH_TOKEN_KEY,
    tokens.refreshToken
  );
}

// ========================================
// BUSCAR ACCESS TOKEN
// ========================================

export async function obterAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

// ========================================
// BUSCAR REFRESH TOKEN
// ========================================

export async function obterRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

// ========================================
// LIMPAR TOKENS
// ========================================

export async function limparTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// ========================================
// RENOVAR ACCESS TOKEN
// ========================================

async function renovarToken(): Promise<string | null> {
  const refreshToken = await obterRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const resposta = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const resultado = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      await limparTokens();
      return null;
    }

    const dados = resultado as RefreshResponse;

    if (!dados.accessToken) {
      await limparTokens();
      return null;
    }

    await SecureStore.setItemAsync(
      ACCESS_TOKEN_KEY,
      dados.accessToken
    );

    return dados.accessToken;
  } catch {
    return null;
  }
}

// ========================================
// REQUISIÇÃO PRINCIPAL
// ========================================

async function requisicao<T>(
  rota: string,
  metodo: string,
  dados?: unknown,
  tentarRenovar = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const rotaPublica =
    rota === '/auth/login' ||
    rota === '/auth/refresh';

  if (!rotaPublica) {
    const token = await obterAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const resposta = await fetch(`${BASE_URL}${rota}`, {
    method: metodo,
    headers,
    ...(dados !== undefined
      ? { body: JSON.stringify(dados) }
      : {}),
  });

  const resultado = await resposta.json().catch(() => ({}));

  // TENTAR RENOVAR TOKEN EXPIRADO
  if (
    resposta.status === 401 &&
    tentarRenovar &&
    !rotaPublica
  ) {
    const novoToken = await renovarToken();

    if (novoToken) {
      return requisicao<T>(
        rota,
        metodo,
        dados,
        false
      );
    }
  }

  if (!resposta.ok) {
    const erro = resultado as ApiError;

    throw new Error(
      erro.message || `Erro na requisição: ${resposta.status}`
    );
  }

  // SALVAR TOKENS DEPOIS DO LOGIN
  if (rota === '/auth/login') {
    const login = resultado as Partial<Tokens>;

    if (login.accessToken && login.refreshToken) {
      await salvarTokens({
        accessToken: login.accessToken,
        refreshToken: login.refreshToken,
      });
    }
  }

  return resultado as T;
}

// ========================================
// POST
// ========================================

export async function apiPost<T>(
  rota: string,
  dados: unknown
): Promise<T> {
  return requisicao<T>(rota, 'POST', dados);
}

// ========================================
// GET
// ========================================

export async function apiGet<T>(
  rota: string
): Promise<T> {
  return requisicao<T>(rota, 'GET');
}

// ========================================
// PUT
// ========================================

export async function apiPut<T>(
  rota: string,
  dados: unknown
): Promise<T> {
  return requisicao<T>(rota, 'PUT', dados);
}

// ========================================
// DELETE
// ========================================

export async function apiDelete<T>(
  rota: string
): Promise<T> {
  return requisicao<T>(rota, 'DELETE');
}

// ========================================
// POST PARA ENVIO DE ARQUIVOS
// FORM DATA
// ========================================

<<<<<<< Updated upstream
  // PATCH
export async function apiPatch<T>(
  rota: string,
  dados?: unknown
): Promise<T> {
  return requisicao<T>(rota, 'PATCH', dados);
}

  // POST PARA ENVIO DE ARQUIVOS (FORM DATA)
=======
>>>>>>> Stashed changes
export async function apiPostFormData<T>(
  rota: string,
  dados: FormData,
  tentarRenovar = true
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const token = await obterAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resposta = await expoFetch(`${BASE_URL}${rota}`, {
    method: 'POST',
    headers,
    body: dados,
  });

  const resultado = await resposta.json().catch(() => ({}));

  if (resposta.status === 401 && tentarRenovar) {
    const novoToken = await renovarToken();

    if (novoToken) {
      return apiPostFormData<T>(rota, dados, false);
    }
  }

  if (!resposta.ok) {
    const erro = resultado as ApiError;

    throw new Error(
      erro.message || `Erro na requisição: ${resposta.status}`
    );
  }

  return resultado as T;
}

// ========================================
// PUT PARA ENVIO DE ARQUIVOS
// FORM DATA
// ========================================

export async function apiPutFormData<T>(
  rota: string,
  dados: FormData,
  tentarRenovar = true
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const token = await obterAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resposta = await expoFetch(`${BASE_URL}${rota}`, {
    method: 'PUT',
    headers,
    body: dados,
  });

  const resultado = await resposta.json().catch(() => ({}));

  if (resposta.status === 401 && tentarRenovar) {
    const novoToken = await renovarToken();

    if (novoToken) {
      return apiPutFormData<T>(rota, dados, false);
    }
  }

  if (!resposta.ok) {
    const erro = resultado as ApiError;

    throw new Error(
      erro.message || `Erro na requisição: ${resposta.status}`
    );
  }

  return resultado as T;
}

// ========================================
// LOGOUT
// ========================================

export async function apiLogout(): Promise<void> {
  try {
    await apiPost('/auth/logout', {});
  } finally {
    await limparTokens();
  }
}

// ========================================
// URL BASE
// ========================================

export default BASE_URL;
