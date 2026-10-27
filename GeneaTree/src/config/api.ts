const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBase = import.meta.env.PROD
  ? 'https://geneathree.onrender.com/api'
  : 'http://localhost:8086/api';

export const API_BASE_URL = (configuredApiBase || defaultApiBase).replace(/\/$/, '');
