const BASE_URL = `${import.meta.env.VITE_APP_ENDPOINT_API ?? ""}/api`;

export const SYSTEM_APIS = {
  authGoogle: `${BASE_URL}/auth/google`,
};
