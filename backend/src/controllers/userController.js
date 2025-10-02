const { pool: db } = require('../config/database');

/**
 * 사용자 프로필 조회
 * GET /api/users/:userId
 */
async function getUserProfile(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const requestUserId = req.user.id; // 인증된 사용자 ID

    // 사용자 조회
    const [users] = await db.query(
      'SELECT id, email, username, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = users[0];

    // 자신의 프로필이 아니면 이메일 제거 (공개 프로필)
    if (userId !== requestUserId) {
      delete user.email;
      delete user.last_login;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 사용자 프로필 수정
 * PUT /api/users/:userId
 */
async function updateUserProfile(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const requestUserId = req.user.id; // 인증된 사용자 ID
    const { username, email } = req.body;

    // 권한 확인 (자신의 프로필만 수정 가능)
    if (userId !== requestUserId) {
      return res.status(403).json({ error: '다른 사용자의 프로필을 수정할 권한이 없습니다' });
    }

    // 업데이트할 필드 수집
    const updates = [];
    const values = [];

    if (username !== undefined) {
      // 사용자명 중복 확인
      const [existingUsers] = await db.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: '사용자명이 이미 사용 중입니다' });
      }

      updates.push('username = ?');
      values.push(username);
    }

    if (email !== undefined) {
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: '유효하지 않은 이메일 형식입니다' });
      }

      // 이메일 중복 확인
      const [existingUsers] = await db.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: '이메일이 이미 사용 중입니다' });
      }

      updates.push('email = ?');
      values.push(email);
    }

    // 업데이트할 필드가 없으면 에러
    if (updates.length === 0) {
      return res.status(400).json({ error: '업데이트할 필드가 없습니다' });
    }

    // 사용자 정보 업데이트
    values.push(userId);
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.status(200).json({ message: '프로필이 업데이트되었습니다' });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
};
