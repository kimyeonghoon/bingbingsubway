# 멀티 스테이지 빌드 - Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# 빌드 시점 환경변수 (ARG로 받음)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# 프로덕션 빌드
RUN npm run build

# 멀티 스테이지 빌드 - Stage 2: Production
FROM nginx:alpine

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 빌드된 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
