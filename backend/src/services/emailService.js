const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  // 이메일 서비스 초기화
  initialize() {
    if (this.initialized) return;

    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // TLS 인증서 미사용
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // 자체 서명 인증서 허용
      }
    };

    this.transporter = nodemailer.createTransport(config);
    this.initialized = true;

    // 연결 테스트
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP 연결 실패:', error);
      } else {
        console.log('✅ SMTP 서버 연결 성공');
      }
    });
  }

  // 이메일 발송 (범용)
  async sendEmail({ to, subject, html, text }) {
    if (!this.initialized) {
      this.initialize();
    }

    const mailOptions = {
      from: `"빙빙 지하철" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // HTML에서 태그 제거
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('이메일 발송 성공:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      throw error;
    }
  }

  // 회원가입 환영 이메일
  async sendWelcomeEmail(to, username) {
    const subject = '🎡 빙빙 지하철에 오신 것을 환영합니다!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚇 빙빙 지하철</h1>
          </div>
          <div class="content">
            <h2>환영합니다, ${username}님! 🎉</h2>
            <p>빙빙 지하철에 가입해주셔서 감사합니다.</p>
            <p>이제 수도권 지하철역을 룰렛으로 선택하여 방문하는 재미있는 여정을 시작하실 수 있습니다!</p>

            <h3>🎯 게임 방법</h3>
            <ol>
              <li>랜덤으로 노선 선택</li>
              <li>룰렛을 돌려 역 선택</li>
              <li>선택된 역에 방문하여 GPS 인증</li>
              <li>업적을 달성하고 랭킹에 도전하세요!</li>
            </ol>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">지금 시작하기</a>
            </div>
          </div>
          <div class="footer">
            <p>빙빙 지하철 팀 드림</p>
            <p>이 메일은 발신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  // 비밀번호 재설정 이메일
  async sendPasswordResetEmail(to, username, resetUrl) {
    const subject = '🔐 빙빙 지하철 비밀번호 재설정';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #EF4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 비밀번호 재설정</h1>
          </div>
          <div class="content">
            <h2>안녕하세요, ${username}님</h2>
            <p>비밀번호 재설정 요청을 받았습니다.</p>
            <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요:</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
            </div>

            <div class="warning">
              <strong>⚠️ 주의사항</strong>
              <ul>
                <li>이 링크는 <strong>1시간 동안만</strong> 유효합니다.</li>
                <li>본인이 요청하지 않았다면 이 이메일을 무시하세요.</li>
                <li>링크를 클릭할 수 없다면 다음 주소를 복사하여 브라우저에 붙여넣으세요:</li>
              </ul>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
            </div>
          </div>
          <div class="footer">
            <p>빙빙 지하철 팀 드림</p>
            <p>이 메일은 발신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  // 이메일 인증 이메일
  async sendEmailVerification(to, username, verificationToken) {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const subject = '✅ 빙빙 지하철 이메일 인증';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ 이메일 인증</h1>
          </div>
          <div class="content">
            <h2>안녕하세요, ${username}님!</h2>
            <p>빙빙 지하철 가입을 완료하려면 이메일 인증이 필요합니다.</p>
            <p>아래 버튼을 클릭하여 이메일을 인증해주세요:</p>

            <div style="text-align: center;">
              <a href="${verifyUrl}" class="button">이메일 인증하기</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              링크를 클릭할 수 없다면 다음 주소를 복사하여 브라우저에 붙여넣으세요:<br>
              <span style="word-break: break-all; font-size: 12px;">${verifyUrl}</span>
            </p>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              이 링크는 24시간 동안 유효합니다.
            </p>
          </div>
          <div class="footer">
            <p>빙빙 지하철 팀 드림</p>
            <p>이 메일은 발신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }
}

// 싱글톤 인스턴스
const emailService = new EmailService();

module.exports = emailService;
