# K1 SPORTS 체대입시 분석 시스템

## 프로젝트 개요
- **이름**: K1 SPORTS 체대입시 분석 시스템
- **목표**: 전국 230개+ 대학 체육 관련 학과의 합격·불합격 여부를 즉시 판정하는 웹 애플리케이션
- **대상**: 체대(체육대학) 입시 수험생 및 K1 SPORTS 컨설턴트

## 주요 기능

### 완성된 기능
1. **수능 성적 입력** — 국어, 수학, 영어, 탐구(2과목), 한국사 성적 입력 (등급/표준점수/백분위)
2. **실기 기록 입력** — 21개 실기 종목 슬라이더 + 직접 입력 (제멀리뛰기, 메디신볼, 싯업, 50m달리기, 25m왕복, 지그재그, 높이뛰기, Z런, 배근력, 좌전굴 등)
3. **전체 합불 판정 (249개 대학)** — 4단계 분류: 지원가능(초록) / 소신지원(노랑) / 지원위험(주황) / 지원불가(빨강)
4. **검색 및 필터** — 대학명 검색, 군별(가/나/다) 필터, 지역별 필터, 유형(국립/사립) 필터, 상태별 빠른 필터, 정렬(점수차/경쟁률/이름)
5. **학교 상세 분석** — 수능 반영 구조, 합격선 비교 차트, 영어·한국사 등급 테이블, 실기 시뮬레이터 슬라이더, 역산 결과
6. **관리자 패널** — 로그인(비밀번호: k1sports), 249개 대학 데이터 테이블, 검색 기능
7. **반응형 UI** — PC/태블릿/모바일 대응, 모바일 하단 네비게이션

### 핵심 기술
- 6가지 수능 활용지표 분기 처리 (표준점수, 백분위, 자체표준, 최고점, 200점, 등급)
- 22개 학교별 자체표준점수 변환 테이블 (자체표준.json)
- 수학 가산점 (미적분/기하 선택 시), 영어 등급제 (감점/등급점수), 한국사 감점 적용
- 커트라인이 있는 66개 대학 우선 정렬

## API 명세

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 메인 HTML 페이지 |
| GET | `/api/universities` | 전체 대학 목록 (249개) |
| GET | `/api/universities/:id` | 학교 상세 정보 |
| POST | `/api/calculate/all` | 전체 합불 판정 |
| POST | `/api/calculate/simulate` | 학교별 실기 시뮬레이터 |
| GET | `/api/stats` | 전체 통계 (군별, 지역별, 활용지표별) |

### POST /api/calculate/all — Request Body
```json
{
  "student": {
    "korean": { "subject": "언매", "standard": 131, "percentile": 95, "grade": 2 },
    "math": { "subject": "확통", "standard": 130, "percentile": 93, "grade": 2 },
    "english": { "grade": 3 },
    "inquiry1": { "subject": "생윤", "standard": 65, "percentile": 90, "grade": 2 },
    "inquiry2": { "subject": "윤사", "standard": 63, "percentile": 88, "grade": 2 },
    "hanksa": { "grade": 2 },
    "sports": { "제멀": 230, "메디신볼": 8.0, "싯업": 40 }
  }
}
```

## 데이터 아키텍처
- **데이터 소스**: `2027년_정시프로그램_260126.xlsm` (22.5MB, 264시트)
- **추출 데이터**: `data/universities.json` (407KB, 249개 대학) + `data/custom_standard.json` (90KB, 22개 학교)
- **저장 방식**: 정적 JSON 번들 (Cloudflare Pages 배포 최적화)

## 기술 스택
- **Frontend**: 순수 JavaScript + CSS (CDN 미의존)
- **Backend**: Hono (TypeScript) — Cloudflare Pages/Workers
- **Build**: Vite
- **Deploy**: Cloudflare Pages (Wrangler)
- **Design**: 다크모드 전용, 네이비 배경(#050A14), 사이언 블루 액센트(#00D4FF)

## 프로젝트 구조
```
webapp/
├── src/
│   ├── index.tsx        # Hono 앱 (API 라우트 + HTML 서빙)
│   └── calculator.ts    # 수능 환산 계산 엔진 핵심 로직
├── data/
│   ├── universities.json     # 249개 대학 데이터
│   └── custom_standard.json  # 22개 학교 자체표준점수 변환표
├── public/static/
│   ├── app.js           # 프론트엔드 JavaScript
│   └── styles.css       # CSS 스타일시트
├── ecosystem.config.cjs # PM2 설정
├── vite.config.ts       # Vite 빌드 설정
├── wrangler.jsonc       # Cloudflare 설정
└── package.json
```

## 배포
- **플랫폼**: Cloudflare Pages
- **상태**: 개발 중 (로컬 서버)
- **빌드 번들 크기**: 350KB (_worker.js)

## 면책 문구
본 결과는 참고용이며, 실제 합격 여부와 다를 수 있습니다. 정확한 정보는 각 대학 입학처에 문의하시기 바랍니다.

## 라이선스
(c) 2026 K1 SPORTS 체대입시 컨설팅
