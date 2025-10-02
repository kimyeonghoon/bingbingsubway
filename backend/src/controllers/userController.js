const { pool: db } = require('../config/database');
const bcrypt = require('bcryptjs');

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

/**
 * 비밀번호 변경
 * PUT /api/users/:userId/password
 */
async function changePassword(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const requestUserId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 권한 확인
    if (userId !== requestUserId) {
      return res.status(403).json({ error: '다른 사용자의 비밀번호를 변경할 권한이 없습니다' });
    }

    // 입력 검증
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // 새 비밀번호 길이 검증
    if (newPassword.length < 8) {
      return res.status(400).json({ error: '새 비밀번호는 최소 8자 이상이어야 합니다' });
    }

    // 현재 비밀번호 확인
    const [users] = await db.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다' });
    }

    // 새 비밀번호 해싱
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );

    // 보안을 위해 모든 리프레시 토큰 삭제
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

    res.status(200).json({ message: '비밀번호가 변경되었습니다' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 회원탈퇴
 * DELETE /api/users/:userId
 */
async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const requestUserId = req.user.id;
    const { password } = req.body;

    // 권한 확인
    if (userId !== requestUserId) {
      return res.status(403).json({ error: '다른 사용자를 탈퇴시킬 권한이 없습니다' });
    }

    // 입력 검증
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // 비밀번호 확인
    const [users] = await db.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const isPasswordValid = await bcrypt.compare(password, users[0].password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' });
    }

    // 사용자 삭제 (CASCADE로 관련 데이터 자동 삭제)
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.status(200).json({ message: '회원탈퇴가 완료되었습니다' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUser,
};
