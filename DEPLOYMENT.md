# 🚀 빙빙 지하철 - Docker 배포 가이드

## 📋 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [배포 준비](#배포-준비)
3. [배포 실행](#배포-실행)
4. [운영 관리](#운영-관리)
5. [트러블슈팅](#트러블슈팅)

---

## 시스템 요구사항

### 최소 사양
- **CPU**: 2 Core
- **RAM**: 2GB
- **디스크**: 10GB (데이터베이스 용량에 따라 증가)
- **OS**: Linux (Ubuntu 20.04 이상 권장)

### 필수 소프트웨어
- Docker: 20.10 이상
- Docker Compose: 2.0 이상

### Docker 설치 (Ubuntu)
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 로그아웃 후 재로그인

# Docker Compose 설치 확인
docker compose version
```

---

## 배포 준비

### 1. 환경변수 설정

프로젝트 루트에서 `.env.production` 파일 생성:

```bash
cp .env.production.example .env.production
nano .env.production
```

**필수 수정 항목:**

```bash
# MySQL 비밀번호 (강력한 비밀번호 사용)
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MYSQL_PASSWORD=your_secure_db_password_here

# JWT Secret (32자 이상 랜덤 문자열)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# 외부 접속 URL (도메인 또는 IP)
FRONTEND_URL=http://your-domain.com
# 또는 IP: http://123.45.67.89

# 포트 (기본: 5080)
# 실제 서버의 Nginx에서 이 포트로 리버스 프록시 설정
FRONTEND_PORT=5080
```

### 2. 데이터베이스 초기화 확인

데이터베이스 스키마와 시드 파일이 준비되어 있는지 확인:

```bash
ls -lh database/
# schema.sql (테이블 구조)
# seeds.sql (799개 역 데이터)
```

### 3. .gitignore 확인

민감한 정보가 Git에 커밋되지 않도록 확인:

```bash
# .gitignore에 포함되어야 할 항목
.env.production
db_data/
```

---

## 배포 실행

### 1. 빌드 및 실행

```bash
# 환경변수 파일 로드 후 빌드 및 실행
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

**실행 과정:**
1. MySQL 컨테이너 시작 → 스키마/시드 자동 적용
2. Backend API 서버 시작
3. Frontend (Nginx) 서버 시작

### 2. 배포 상태 확인

```bash
# 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps

# 로그 확인
docker compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그만 확인
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f mysql
```

### 3. 헬스체크 확인

```bash
# Frontend 접속 확인
curl http://localhost

# Backend API 확인
curl http://localhost/api/stations/lines

# MySQL 연결 확인
docker exec bingbing_mysql mysql -u bingbing_user -p -e "SHOW DATABASES;"
```

### 4. 브라우저 접속

```
http://localhost:5080 (로컬 테스트)
또는
http://your-server-ip:5080 (직접 접속)
```

**실제 서버 Nginx 리버스 프록시 설정 예시:**
```nginx
# /etc/nginx/sites-available/bingbing-subway
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 운영 관리

### 서비스 중지

```bash
# 전체 서비스 중지 (데이터 유지)
docker compose -f docker-compose.prod.yml down

# 전체 서비스 중지 + 볼륨 삭제 (⚠️ 데이터베이스 삭제)
docker compose -f docker-compose.prod.yml down -v
```

### 서비스 재시작

```bash
# 전체 재시작
docker compose -f docker-compose.prod.yml restart

# 특정 서비스만 재시작
docker compose -f docker-compose.prod.yml restart backend
```

### 업데이트 배포

```bash
# 1. 최신 코드 가져오기
git pull origin main

# 2. 재빌드 및 재시작
docker compose -f docker-compose.prod.yml up -d --build

# 3. 사용하지 않는 이미지 정리
docker image prune -a -f
```

### 데이터베이스 백업

```bash
# 백업 생성
docker exec bingbing_mysql mysqldump \
  -u bingbing_user \
  -p${MYSQL_PASSWORD} \
  bingbing_subway > backup_$(date +%Y%m%d_%H%M%S).sql

# 백업 복구
docker exec -i bingbing_mysql mysql \
  -u bingbing_user \
  -p${MYSQL_PASSWORD} \
  bingbing_subway < backup_20250101_120000.sql
```

### 로그 관리

```bash
# 로그 크기 확인
docker compose -f docker-compose.prod.yml logs --tail=100

# 로그 정리 (재시작 필요)
docker compose -f docker-compose.prod.yml down
docker system prune -a --volumes -f
docker compose -f docker-compose.prod.yml up -d
```

### 리소스 모니터링

```bash
# 컨테이너 리소스 사용량 확인
docker stats

# 디스크 사용량 확인
du -sh db_data/
df -h
```

---

## 트러블슈팅

### 1. MySQL 초기화 실패

**증상**: `mysql` 컨테이너가 계속 재시작됨

**해결**:
```bash
# 1. 컨테이너 중지
docker compose -f docker-compose.prod.yml down

# 2. 데이터 디렉토리 삭제
sudo rm -rf db_data/

# 3. 재시작
docker compose -f docker-compose.prod.yml up -d
```

### 2. Backend API 연결 실패 (502 Bad Gateway)

**증상**: Frontend는 접속되지만 API 호출 시 502 에러

**원인**: Backend 컨테이너가 정상 실행되지 않음

**해결**:
```bash
# Backend 로그 확인
docker compose -f docker-compose.prod.yml logs backend

# Backend 재시작
docker compose -f docker-compose.prod.yml restart backend

# 환경변수 확인
docker exec bingbing_backend env | grep DATABASE
```

### 3. 포트 충돌

**증상**: `Error starting userland proxy: listen tcp4 0.0.0.0:80: bind: address already in use`

**해결**:
```bash
# 80번 포트 사용 중인 프로세스 확인
sudo lsof -i :80

# Apache/Nginx가 실행 중이면 중지
sudo systemctl stop apache2
sudo systemctl stop nginx

# 또는 .env.production에서 다른 포트 사용
FRONTEND_PORT=8080
```

### 4. 데이터베이스 연결 실패

**증상**: Backend 로그에 `ER_ACCESS_DENIED_ERROR` 또는 `ECONNREFUSED`

**해결**:
```bash
# 1. MySQL 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps mysql

# 2. MySQL 직접 접속 테스트
docker exec -it bingbing_mysql mysql -u bingbing_user -p

# 3. 환경변수 확인
cat .env.production | grep MYSQL
```

### 5. 빌드 실패

**증상**: `ERROR [internal] load metadata for docker.io/library/node:18-alpine`

**해결**:
```bash
# Docker 데몬 재시작
sudo systemctl restart docker

# 캐시 삭제 후 재빌드
docker compose -f docker-compose.prod.yml build --no-cache
```

### 6. 디스크 용량 부족

**증상**: `no space left on device`

**해결**:
```bash
# 사용하지 않는 Docker 리소스 정리
docker system prune -a --volumes -f

# 디스크 사용량 확인
df -h
du -sh /var/lib/docker
```

---

## HTTPS 설정 (선택사항)

### Certbot + Let's Encrypt 사용

```bash
# 1. Certbot 설치
sudo apt install certbot python3-certbot-nginx

# 2. SSL 인증서 발급 (도메인 필요)
sudo certbot --nginx -d your-domain.com

# 3. .env.production 수정
FRONTEND_PORT=443
FRONTEND_URL=https://your-domain.com

# 4. 재배포
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 보안 권장사항

1. **방화벽 설정**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **비밀번호 강화**
   - MySQL 비밀번호: 16자 이상, 특수문자 포함
   - JWT Secret: 32자 이상 랜덤 문자열

3. **정기 백업**
   - 매일 자동 백업 설정 (cron)
   - 백업 파일 외부 저장

4. **업데이트 유지**
   ```bash
   # Docker 이미지 업데이트
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```

---

## 문의

배포 중 문제가 발생하면 GitHub Issues에 문의하세요:
https://github.com/your-repo/bingbing_subway/issues
