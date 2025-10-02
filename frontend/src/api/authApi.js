import axios from './axios';

/**
 * 회원가입
 * @param {Object} data - { email, password, username }
 * @returns {Promise} { accessToken, refreshToken, user }
 */
export const register = async (data) => {
  const response = await axios.post('/auth/register', data);
  return response.data;
};

/**
 * 로그인
 * @param {Object} data - { email, password }
 * @returns {Promise} { accessToken, refreshToken, user }
 */
export const login = async (data) => {
  const response = await axios.post('/auth/login', data);
  return response.data;
};

/**
 * 토큰 갱신
 * @param {string} refreshToken
 * @returns {Promise} { accessToken, refreshToken }
 */
export const refreshToken = async (refreshToken) => {
  const response = await axios.post('/auth/refresh', { refreshToken });
  return response.data;
};

/**
 * 로그아웃
 * @param {string} refreshToken
 * @returns {Promise}
 */
export const logout = async (refreshToken) => {
  const response = await axios.post('/auth/logout', { refreshToken });
  return response.data;
};

/**
 * 현재 사용자 정보 조회
 * @returns {Promise} user 객체
 */
export const getCurrentUser = async () => {
  const response = await axios.get('/auth/me');
  return response.data;
};
