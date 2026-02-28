// K1 SPORTS 체대입시 분석 시스템 — 프론트엔드 v5
// Premium UI: 다크/라이트 모드 + 스크롤 리빌 + 스켈레톤 로딩

const API = '';

// ═══ 테마 관리 (다크/라이트 모드) ═══
function getTheme() {
  return localStorage.getItem('k1-theme') || 'dark';
}
function setTheme(theme) {
  localStorage.setItem('k1-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}
function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  render();
}

// ═══ 스크롤 리빌 (IntersectionObserver) ═══
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// 디바운스 유틸리티
function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ═══ 원점수 → 표준점수 변환 테이블 (2026학년도 수능 확정) ═══
// 국어/수학: "언수외(수능)" 시트 기반, 탐구: "표준(점수)" 시트 기반
// 형식: { 원점수: 표준점수 } — 등급컷 포인트 기반, 중간값은 선형 보간
const SCORE_TABLES = {
  // ── 국어 (언어와매체) ── 전체 원점수→표준점수 매핑
  '국어_언매': {
    100:147, 98:145, 97:144, 96:143, 95:142, 94:141, 93:140, 92:139,
    91:138, 90:137, 89:136, 88:135, 87:134, 86:133, 85:132, 84:131,
    83:130, 82:129, 81:128, 80:127, 79:126, 78:125, 77:124, 76:123,
    75:122, 74:121, 73:120, 72:119, 71:118, 70:117, 69:116, 68:115,
    67:114, 66:113, 65:112, 64:111, 63:110, 62:109, 61:108, 60:107,
    59:106, 58:105, 57:104, 56:103, 55:102, 54:101, 53:100, 52:99,
    51:98, 50:97, 49:96, 48:95, 47:94, 46:93, 45:92, 44:91,
    43:90, 42:89, 41:88, 40:87, 39:86, 38:85, 37:84, 36:83,
    35:82, 34:81, 33:80, 32:79, 31:78, 30:77, 29:76, 28:75,
    27:74, 26:73, 25:72, 24:71, 23:70, 22:69, 21:68, 20:67,
    19:66, 18:65, 17:64, 16:63, 15:62, 14:61, 13:60, 12:59,
    11:58, 10:57, 9:56, 8:55, 7:54, 6:53, 5:52, 4:51, 3:50, 2:49, 0:47
  },
  // ── 국어 (화법과작문) ── 등급컷 기반 + 보간
  '국어_화작': {
    100:146, 88:134, 81:126, 72:117, 62:106, 52:95, 42:84, 32:73, 22:63, 0:47
  },
  // ── 수학 (확률과통계) ──
  '수학_확통': {
    100:137, 94:133, 84:126, 74:118, 59:107, 42:94, 23:80, 15:74, 10:70, 0:60
  },
  // ── 수학 (미적분) ──
  '수학_미적': {
    100:148, 84:133, 74:126, 65:118, 51:107, 36:94, 20:80, 12:74, 8:71, 0:58
  },
  // ── 수학 (기하) ──
  '수학_기하': {
    100:142, 88:133, 79:126, 69:118, 55:107, 38:94, 21:80, 13:74, 8:70, 0:58
  },
  // ── 탐구 과목 (50점 만점) ── "표준(점수)" 시트 기반
  '생윤': { 50:65, 47:63, 43:59, 37:54, 29:48, 22:42, 15:36, 10:32, 0:20 },
  '윤사': { 50:63, 45:60, 38:55, 25:46, 18:41, 12:37, 7:33, 0:20 },
  '한지': { 50:65, 46:63, 43:61, 33:54, 20:45, 13:40, 10:38, 7:36, 0:20 },
  '세지': { 50:67, 48:66, 45:63, 41:60, 33:54, 23:46, 15:40, 11:37, 8:34, 0:20 },
  '동사': { 50:66, 47:64, 45:63, 42:60, 35:55, 22:46, 14:40, 9:37, 7:35, 0:20 },
  '세사': { 50:63, 48:62, 44:60, 38:56, 21:45, 13:40, 9:37, 6:35, 0:20 },
  '경제': { 50:73, 44:68, 39:63, 34:59, 26:52, 20:46, 14:41, 10:37, 8:36, 0:20 },
  '정법': { 50:73, 43:67, 40:64, 34:59, 27:53, 19:46, 13:41, 10:38, 7:35, 0:20 },
  '사문': { 50:70, 45:66, 41:63, 36:59, 30:54, 22:47, 15:41, 10:37, 6:33, 0:20 },
  '물1': { 50:69, 47:67, 42:63, 38:60, 29:53, 20:46, 12:40, 10:38, 6:35, 0:20 },
  '화1': { 50:69, 47:67, 41:62, 37:58, 32:54, 23:47, 15:40, 11:37, 6:33, 0:20 },
  '생1': { 50:69, 47:66, 42:62, 39:59, 32:53, 27:48, 20:42, 14:36, 9:32, 0:20 },
  '지1': { 50:66, 47:64, 45:63, 42:60, 35:55, 22:46, 14:40, 9:37, 7:35, 0:20 },
  '물2': { 50:63, 48:62, 44:60, 38:56, 21:45, 13:40, 9:37, 6:35, 0:20 },
  '화2': { 50:63, 48:62, 44:60, 38:56, 21:45, 13:40, 9:37, 6:35, 0:20 },
  '생2': { 50:63, 48:62, 44:60, 38:56, 21:45, 13:40, 9:37, 6:35, 0:20 },
  '지2': { 50:63, 48:62, 44:60, 38:56, 21:45, 13:40, 9:37, 6:35, 0:20 }
};

// 선택과목 → 변환 테이블 키 매핑
const SUBJECT_TABLE_MAP = {
  // 국어
  '언매': '국어_언매', '화작': '국어_화작',
  // 수학
  '확통': '수학_확통', '미적분': '수학_미적', '기하': '수학_기하',
  // 탐구 (사탐)
  '생윤': '생윤', '윤사': '윤사', '한지': '한지', '세지': '세지',
  '동사': '동사', '세사': '세사', '경제': '경제', '정법': '정법', '사문': '사문',
  '생활과윤리': '생윤', '윤리와사상': '윤사', '한국지리': '한지', '세계지리': '세지',
  '동아시아사': '동사', '세계사': '세사', '정치와법': '정법', '사회·문화': '사문',
  // 탐구 (과탐)
  '물1': '물1', '화1': '화1', '생1': '생1', '지1': '지1',
  '물2': '물2', '화2': '화2', '생2': '생2', '지2': '지2',
  '물리학Ⅰ': '물1', '화학Ⅰ': '화1', '생명과학Ⅰ': '생1', '지구과학Ⅰ': '지1',
  '물리학Ⅱ': '물2', '화학Ⅱ': '화2', '생명과학Ⅱ': '생2', '지구과학Ⅱ': '지2'
};

// 원점수 → 표준점수 변환 (선형 보간)
function rawToStandard(subject, rawScore) {
  const tableKey = SUBJECT_TABLE_MAP[subject];
  if (!tableKey) return null;
  const table = SCORE_TABLES[tableKey];
  if (!table) return null;

  rawScore = Math.round(rawScore);
  // 테이블에 정확히 있으면 바로 반환
  if (table[rawScore] !== undefined) return table[rawScore];

  // 등급컷 포인트들을 정렬 (내림차순)
  const points = Object.keys(table).map(Number).sort((a, b) => b - a);

  // 범위 밖
  if (rawScore >= points[0]) return table[points[0]];
  if (rawScore <= points[points.length - 1]) return table[points[points.length - 1]];

  // 선형 보간
  for (let i = 0; i < points.length - 1; i++) {
    const upper = points[i];
    const lower = points[i + 1];
    if (rawScore <= upper && rawScore >= lower) {
      const ratio = (rawScore - lower) / (upper - lower);
      const stdUpper = table[upper];
      const stdLower = table[lower];
      return Math.round(stdLower + ratio * (stdUpper - stdLower));
    }
  }
  return null;
}

// 과목별 원점수 만점
function getMaxRaw(area, subject) {
  if (area === 'korean' || area === 'math') return 100;
  return 50; // 탐구
}

// ── 상태 관리 ──
const state = {
  tab: 'input', // input, result, detail, admin
  student: {
    korean: { subject: '언매', raw: 89, standard: 136, percentile: 97, grade: 2, stdLinked: true },
    math: { subject: '확통', raw: 84, standard: 126, percentile: 89, grade: 2, stdLinked: true },
    english: { grade: 3 },
    inquiry1: { subject: '생윤', raw: 47, standard: 63, percentile: 91, grade: 2, stdLinked: true },
    inquiry2: { subject: '윤사', raw: 45, standard: 60, percentile: 75, grade: 3, stdLinked: true },
    hanksa: { grade: 2 },
    sports: {
      '제멀': 230, '메디신볼': 8.0, '싯업': 40, '50m달리기': 7.8,
      '25m왕복': 15.0, '지그재그': 13.0, '높이뛰기': 135,
      'Z런': 13.0, '배근력': 95, '좌전굴': 18
    }
  },
  results: null,
  selectedUniv: null,
  filters: { group: '전체', location: '전체', type: '전체', sort: 'diff', status: '전체', search: '' },
  loading: false,
  admin: { loggedIn: false, password: '', universities: null },
  toast: null,
  // 실기 시뮬레이터 오버라이드
  simSports: {},
  // 수능 시뮬레이터 오버라이드 (상세 화면에서 사용)
  simSuneung: null,       // null이면 시뮬레이션 비활성, 객체면 활성
  simBaseScore: null,     // 시뮬레이션 시작 시점의 기준 수능 환산점수
  simOriginalStudent: null // 시뮬레이션 시작 시점의 원본 학생 데이터
};

// ── 실기 종목 정의 (메인 입력 화면에서 사용하는 기준 정의) ──
// ★ 이 단위가 절대 기준입니다. 시뮬레이터에서도 반드시 이 단위를 사용합니다.
const SPORTS_FIELDS = [
  { key: '제멀', label: '제멀리뛰기', unit: 'cm', min: 100, max: 320, step: 1, direction: 'higher' },
  { key: '메디신볼', label: '메디신볼', unit: 'm', min: 3, max: 15, step: 0.1, direction: 'higher' },
  { key: '싯업', label: '싯업(30초)', unit: '개', min: 0, max: 70, step: 1, direction: 'higher' },
  { key: '50m달리기', label: '50m 달리기', unit: '초', min: 5.5, max: 12, step: 0.1, direction: 'lower' },
  { key: '25m왕복', label: '25m 왕복달리기', unit: '초', min: 10, max: 25, step: 0.1, direction: 'lower' },
  { key: '지그재그', label: '지그재그', unit: '초', min: 8, max: 20, step: 0.1, direction: 'lower' },
  { key: '높이뛰기', label: '높이뛰기', unit: 'cm', min: 90, max: 200, step: 1, direction: 'higher' },
  { key: 'Z런', label: 'Z런', unit: '초', min: 8, max: 20, step: 0.1, direction: 'lower' },
  { key: '배근력', label: '배근력', unit: 'kg', min: 30, max: 200, step: 1, direction: 'higher' },
  { key: '좌전굴', label: '좌전굴', unit: 'cm', min: -10, max: 40, step: 0.5, direction: 'higher' },
  { key: '농구(레이업슛)', label: '농구(레이업슛)', unit: '개', min: 0, max: 30, step: 1, direction: 'higher' },
  { key: '농구(레이업1분)', label: '농구(레이업1분)', unit: '개', min: 0, max: 30, step: 1, direction: 'higher' },
  { key: '중량달리기', label: '중량달리기', unit: '초', min: 5, max: 20, step: 0.1, direction: 'lower' },
  { key: '메디신볼(택3)', label: '메디신볼(택3)', unit: 'm', min: 3, max: 15, step: 0.1, direction: 'higher' },
  { key: '제멀(택3)', label: '제멀(택3)', unit: 'cm', min: 100, max: 320, step: 1, direction: 'higher' },
  { key: '배구(브라디)', label: '배구(브라디)', unit: '개', min: 0, max: 40, step: 1, direction: 'higher' },
  { key: '체조', label: '체조', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  { key: '20m왕복', label: '20m 왕복달리기', unit: '초', min: 10, max: 25, step: 0.1, direction: 'lower' },
  { key: '20M', label: '20M 달리기', unit: '초', min: 2, max: 8, step: 0.1, direction: 'lower' },
  { key: '턱/매', label: '턱걸이/매달리기', unit: '개/초', min: 0, max: 60, step: 1, direction: 'higher' },
  { key: '던지기', label: '공던지기', unit: 'm', min: 10, max: 80, step: 0.5, direction: 'higher' },
  { key: '10m 왕복(택3)', label: '10m왕복(택3)', unit: '초', min: 5, max: 20, step: 0.1, direction: 'lower' },
  { key: '좌전굴(택3)', label: '좌전굴(택3)', unit: 'cm', min: -10, max: 40, step: 0.5, direction: 'higher' },
  { key: '20m왕복(택3)', label: '20m왕복(택3)', unit: '초', min: 10, max: 25, step: 0.1, direction: 'lower' },
];

// ── 대학 데이터 종목명 → SPORTS_FIELDS 매칭을 위한 별칭 맵 ──
// 대학 데이터에서 사용하는 종목명(key)을 SPORTS_FIELDS의 key로 연결
const SPORTS_ALIAS = {
  // 달리기/왕복 계열 (초 단위)
  '10m 왕복': { label: '10m 왕복달리기', unit: '초', min: 5, max: 20, step: 0.1, direction: 'lower' },
  '10m왕복': { label: '10m 왕복달리기', unit: '초', min: 5, max: 20, step: 0.1, direction: 'lower' },
  '10m왕복(콘)': { label: '10m왕복(콘)', unit: '초', min: 5, max: 20, step: 0.1, direction: 'lower' },
  '10m왕복(버튼)': { label: '10m왕복(버튼)', unit: '초', min: 5, max: 20, step: 0.1, direction: 'lower' },
  '10m왕복(우천시)': { label: '10m왕복(우천시)', unit: '초', min: 5, max: 20, step: 0.1, direction: 'lower' },
  '10M': { label: '10M 달리기', unit: '초', min: 2, max: 8, step: 0.1, direction: 'lower' },
  '10M왕복': { label: '10M왕복달리기', unit: '초', min: 5, max: 20, step: 0.1, direction: 'lower' },
  '10m': { label: '10m 달리기', unit: '초', min: 2, max: 8, step: 0.1, direction: 'lower' },
  '10m(우천시)': { label: '10m(우천시)', unit: '초', min: 2, max: 8, step: 0.1, direction: 'lower' },
  '20m 왕복': { label: '20m 왕복달리기', unit: '초', min: 10, max: 25, step: 0.1, direction: 'lower' },
  '20m왕복\n오래달리기': { label: '20m왕복 오래달리기', unit: '회', min: 0, max: 120, step: 1, direction: 'higher' },
  '20m (부저)': { label: '20m 왕복달리기(부저)', unit: '초', min: 10, max: 25, step: 0.1, direction: 'lower' },
  '25m': { label: '25m 왕복달리기', unit: '초', min: 10, max: 25, step: 0.1, direction: 'lower' },
  '50m': { label: '50m 달리기', unit: '초', min: 5.5, max: 12, step: 0.1, direction: 'lower' },
  '60m': { label: '60m 달리기', unit: '초', min: 6, max: 14, step: 0.1, direction: 'lower' },
  '100m': { label: '100m 달리기', unit: '초', min: 10, max: 20, step: 0.1, direction: 'lower' },
  'Z달리기': { label: 'Z달리기', unit: '초', min: 8, max: 20, step: 0.1, direction: 'lower' },
  '지그재그런': { label: '지그재그런', unit: '초', min: 8, max: 20, step: 0.1, direction: 'lower' },
  '십자런': { label: '십자런', unit: '초', min: 8, max: 20, step: 0.1, direction: 'lower' },
  '25m(축구드리블)': { label: '25m 축구드리블', unit: '초', min: 10, max: 25, step: 0.1, direction: 'lower' },
  // 뛰기 계열 (cm)
  '제자리멀리뛰기': { label: '제자리멀리뛰기', unit: 'cm', min: 100, max: 320, step: 1, direction: 'higher' },
  '제멀(우천시)': { label: '제멀(우천시)', unit: 'cm', min: 100, max: 320, step: 1, direction: 'higher' },
  '제멀(택)': { label: '제멀(택)', unit: 'cm', min: 100, max: 320, step: 1, direction: 'higher' },
  '제멀폐지': { label: '제멀(폐지)', unit: 'cm', min: 100, max: 320, step: 1, direction: 'higher' },
  '높이뛰기기': { label: '높이뛰기', unit: 'cm', min: 90, max: 200, step: 1, direction: 'higher' },
  '서전트': { label: '서전트점프', unit: 'cm', min: 20, max: 80, step: 1, direction: 'higher' },
  '서전트(체공)': { label: '서전트(체공)', unit: '초', min: 0.2, max: 1.0, step: 0.01, direction: 'higher' },
  '체공': { label: '체공(서전트)', unit: '초', min: 0.2, max: 1.0, step: 0.01, direction: 'higher' },
  '사이드': { label: '사이드스텝', unit: '회', min: 0, max: 60, step: 1, direction: 'higher' },
  '사이드스텝': { label: '사이드스텝', unit: '회', min: 0, max: 60, step: 1, direction: 'higher' },
  '사이드(1.2m)': { label: '사이드(1.2m)', unit: '회', min: 0, max: 60, step: 1, direction: 'higher' },
  // 농구 계열 (개)
  '농구': { label: '농구(레이업)', unit: '개', min: 0, max: 30, step: 1, direction: 'higher' },
  '농구(레이업)': { label: '농구(레이업)', unit: '개', min: 0, max: 30, step: 1, direction: 'higher' },
  '농구골밑슛': { label: '농구골밑슛', unit: '개', min: 0, max: 30, step: 1, direction: 'higher' },
  '농구공(던지기)': { label: '농구공 던지기', unit: 'm', min: 5, max: 30, step: 0.5, direction: 'higher' },
  '농구1분\n(드리블후 레이업,골밑)': { label: '농구(드리블후 레이업)', unit: '개', min: 0, max: 30, step: 1, direction: 'higher' },
  // 배구 계열 (개)
  '배구': { label: '배구(패스)', unit: '개', min: 0, max: 40, step: 1, direction: 'higher' },
  '배구(30초)': { label: '배구(30초)', unit: '개', min: 0, max: 40, step: 1, direction: 'higher' },
  '배구(60초)': { label: '배구(60초)', unit: '개', min: 0, max: 60, step: 1, direction: 'higher' },
  // 던지기 계열 (m)
  '핸드볼공던지기': { label: '핸드볼공 던지기', unit: 'm', min: 10, max: 80, step: 0.5, direction: 'higher' },
  '앉아메디신볼': { label: '앉아 메디신볼', unit: 'm', min: 3, max: 15, step: 0.1, direction: 'higher' },
  '메디신볼(우천시)': { label: '메디신볼(우천시)', unit: 'm', min: 3, max: 15, step: 0.1, direction: 'higher' },
  '메디신볼폐지': { label: '메디신볼(폐지)', unit: 'm', min: 3, max: 15, step: 0.1, direction: 'higher' },
  '던지기/싯업': { label: '던지기/싯업(택1)', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  // 근력/유연 계열
  '매달리기': { label: '매달리기', unit: '초', min: 0, max: 120, step: 1, direction: 'higher' },
  '배근력(필수)': { label: '배근력', unit: 'kg', min: 30, max: 200, step: 1, direction: 'higher' },
  '좌전굴(필수)': { label: '좌전굴', unit: 'cm', min: -10, max: 40, step: 0.5, direction: 'higher' },
  '체전굴': { label: '체전굴(유연성)', unit: 'cm', min: -10, max: 40, step: 0.5, direction: 'higher' },
  '월패스': { label: '월패스(체스트패스)', unit: '개', min: 0, max: 50, step: 1, direction: 'higher' },
  // 싯업 변형
  '싯업(30초)': { label: '싯업(30초)', unit: '개', min: 0, max: 70, step: 1, direction: 'higher' },
  '싯업(폐지)': { label: '싯업(폐지)', unit: '개', min: 0, max: 70, step: 1, direction: 'higher' },
  '싯업(택)': { label: '싯업(택)', unit: '개', min: 0, max: 70, step: 1, direction: 'higher' },
  // 체조/무용 계열 (점)
  '물구나무앞구르기': { label: '물구나무앞구르기', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '물구나무서서(2초)\n앞구르기': { label: '물구나무서서→앞구르기', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '물구나무서서(2초)\n앞구르기/핸스(남)/여(옆돌기)': { label: '물구나무→핸드/옆돌기', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '핸드스프링': { label: '핸드스프링', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '허들(2대)': { label: '허들(2대)', unit: '초', min: 5, max: 15, step: 0.1, direction: 'lower' },
  // 전공/택1 계열 (점)
  '전공(택1)': { label: '전공실기(택1)', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '전공(배드민턴,체조,축구,농구,배구,육상)': { label: '전공실기(택1)', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '무예(택1)': { label: '무예(택1)', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  // 종합/특수
  '순환식계측': { label: '순환식계측(종합)', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '무실기': { label: '무실기', unit: '-', min: 0, max: 0, step: 1, direction: 'higher' },
  '실기폐지': { label: '실기폐지', unit: '-', min: 0, max: 0, step: 1, direction: 'higher' },
  // 구기 종목 (점)
  '축구': { label: '축구(실기)', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '축구(드리블)': { label: '축구(드리블)', unit: '초', min: 8, max: 30, step: 0.1, direction: 'lower' },
  '축구경기': { label: '축구경기', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '축구/무용': { label: '축구/무용(택1)', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '추구/배구': { label: '축구/배구(택1)', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '검도': { label: '검도', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '골프': { label: '골프', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '배드민턴': { label: '배드민턴', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '수영': { label: '수영', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '유도': { label: '유도', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
  '태권도': { label: '태권도', unit: '점', min: 0, max: 100, step: 1, direction: 'higher' },
};

// 대학 데이터의 종목명으로부터 올바른 종목 정의를 찾는 함수
function findSportsField(eventName) {
  // 1) SPORTS_FIELDS에서 key 또는 label로 정확 매칭
  const exact = SPORTS_FIELDS.find(f => f.key === eventName || f.label === eventName);
  if (exact) return { ...exact };

  // 2) 별칭 맵에서 찾기
  if (SPORTS_ALIAS[eventName]) {
    return { key: eventName, ...SPORTS_ALIAS[eventName] };
  }

  // 3) 종목명 패턴 분석으로 fallback 추론
  const name = eventName;

  // 달리기/왕복/런 계열 → 초 단위
  if (/달리기|왕복|런$|m$/i.test(name)) {
    // 오래달리기(비프테스트)만 회 단위
    if (/오래달리기/i.test(name)) {
      return { key: eventName, label: eventName, unit: '회', min: 0, max: 120, step: 1, direction: 'higher' };
    }
    return { key: eventName, label: eventName, unit: '초', min: 5, max: 25, step: 0.1, direction: 'lower' };
  }

  // 뛰기 계열 → cm
  if (/뛰기|점프/i.test(name)) {
    return { key: eventName, label: eventName, unit: 'cm', min: 20, max: 300, step: 1, direction: 'higher' };
  }

  // 던지기/메디신볼 계열 → m
  if (/던지기|메디신|볼/i.test(name)) {
    return { key: eventName, label: eventName, unit: 'm', min: 3, max: 80, step: 0.5, direction: 'higher' };
  }

  // 싯업/근력 계열 → 개
  if (/싯업|윗몸/i.test(name)) {
    return { key: eventName, label: eventName, unit: '개', min: 0, max: 70, step: 1, direction: 'higher' };
  }

  // 배근력 계열 → kg
  if (/배근력/i.test(name)) {
    return { key: eventName, label: eventName, unit: 'kg', min: 30, max: 200, step: 1, direction: 'higher' };
  }

  // 좌전굴/체전굴 → cm
  if (/전굴|유연/i.test(name)) {
    return { key: eventName, label: eventName, unit: 'cm', min: -10, max: 40, step: 0.5, direction: 'higher' };
  }

  // 농구 계열 → 개
  if (/농구/i.test(name)) {
    return { key: eventName, label: eventName, unit: '개', min: 0, max: 30, step: 1, direction: 'higher' };
  }

  // 배구 계열 → 개
  if (/배구/i.test(name)) {
    return { key: eventName, label: eventName, unit: '개', min: 0, max: 40, step: 1, direction: 'higher' };
  }

  // 매달리기/턱걸이 → 초
  if (/매달리기|턱걸이/i.test(name)) {
    return { key: eventName, label: eventName, unit: '초', min: 0, max: 120, step: 1, direction: 'higher' };
  }

  // 사이드/스텝 → 회
  if (/사이드|스텝/i.test(name)) {
    return { key: eventName, label: eventName, unit: '회', min: 0, max: 60, step: 1, direction: 'higher' };
  }

  // 체조/물구나무/핸드/전공 → 점
  if (/체조|물구나무|핸드|전공|택1|무실기|실기폐지|무예|검도|골프|축구|수영|유도|태권|배드민턴/i.test(name)) {
    return { key: eventName, label: eventName, unit: '점', min: 0, max: 100, step: 1, direction: 'higher' };
  }

  // 최종 fallback — '점' 단위로 설정 (단위 없는 것보다 나음)
  return { key: eventName, label: eventName, unit: '점', min: 0, max: 100, step: 1, direction: 'higher' };
}

const SUBJECTS_INQUIRY = [
  '생윤', '윤사', '한지', '세지', '동사', '세사', '사문', '정법', '경제',
  '물1', '화1', '생1', '지1', '물2', '화2', '생2', '지2',
  '직업탐구'
];

// ═══════════════════════════════════════════
// ═══ 프론트엔드 수능 환산 계산 엔진 (로컬) ═══
// ═══════════════════════════════════════════
// 서버 API 호출 없이 상세 화면에서 실시간으로 수능 환산점수를 재계산

function calcSuneungLocal(student, univ) {
  let score = 0;
  const method = univ.score_method || '';

  // 국어
  if (univ.korean_yn && univ.korean_points > 0) {
    let raw = student.korean.standard;
    if (method.includes('백분위')) {
      raw = student.korean.percentile;
      score += (raw / 100) * univ.korean_points;
    } else {
      const maxStd = 150;
      score += (raw / maxStd) * univ.korean_points;
    }
    if (univ.korean_bonus > 0) score += univ.korean_bonus;
  }

  // 수학
  if (univ.math_yn && univ.math_points > 0) {
    let raw = student.math.standard;
    if (method.includes('백분위')) {
      raw = student.math.percentile;
    }
    let bonus = 0;
    if (univ.math_bonus > 0 && (student.math.subject === '미적분' || student.math.subject === '기하')) {
      bonus = univ.math_bonus;
    }
    if (method.includes('백분위')) {
      score += ((raw * (1 + bonus)) / 100) * univ.math_points;
    } else {
      const maxStd = 150;
      score += ((raw * (1 + bonus)) / maxStd) * univ.math_points;
    }
  }

  // 영어
  if (univ.english_yn) {
    const engGrade = Math.min(Math.max(student.english.grade, 1), 9);
    if (univ.english_grade_scores && univ.english_grade_scores.length >= 9) {
      score += univ.english_grade_scores[engGrade - 1] || 0;
    }
  }

  // 탐구
  if (univ.inquiry_yn && univ.inquiry_points > 0) {
    let inq1 = student.inquiry1.standard;
    let inq2 = student.inquiry2.standard;
    if (method.includes('백분위')) {
      inq1 = student.inquiry1.percentile;
      inq2 = student.inquiry2.percentile;
    }
    const inqSum = inq1 + inq2;
    if (method.includes('백분위')) {
      score += (inqSum / 200) * univ.inquiry_points;
    } else {
      const maxInq = 140;
      score += (inqSum / maxInq) * univ.inquiry_points;
    }
    if (univ.inquiry_bonus > 0) score += univ.inquiry_bonus;
  }

  // 한국사
  if (univ.hanksa_deductions && univ.hanksa_deductions.length >= 9) {
    const hGrade = Math.min(Math.max(student.hanksa.grade, 1), 9);
    score += univ.hanksa_deductions[hGrade - 1] || 0;
  }

  return Math.round(score * 100) / 100;
}

function getStatusLocal(myScore, cutline) {
  if (cutline <= 0) return '소신지원';
  const diff = myScore - cutline;
  if (diff >= 5) return '지원가능';
  if (diff >= -5) return '소신지원';
  if (diff >= -15) return '지원위험';
  return '지원불가';
}

// 현재 시뮬레이션 학생 데이터를 반환
function getSimStudent() {
  if (!state.simSuneung) return state.student;
  return {
    ...state.student,
    korean: { ...state.student.korean, standard: state.simSuneung.koreanStd },
    math: { ...state.student.math, standard: state.simSuneung.mathStd },
    english: { grade: state.simSuneung.engGrade },
    inquiry1: { ...state.student.inquiry1, standard: state.simSuneung.inq1Std },
    inquiry2: { ...state.student.inquiry2, standard: state.simSuneung.inq2Std },
    hanksa: { grade: state.simSuneung.hanksaGrade }
  };
}

// 시뮬레이션 수능 점수 계산
function calcSimScore() {
  const u = state.selectedUniv;
  if (!u) return { score: 0, diff: 0, status: '소신지원' };
  const student = getSimStudent();
  const score = calcSuneungLocal(student, u);
  const cutline = u.cutline_suneung || 0;
  const diff = Math.round((score - cutline) * 100) / 100;
  const status = getStatusLocal(score, cutline);
  return { score, diff, status };
}

// ═══════════════════════════════════════════
// ═══ 실기 추정 환산 + 전체 총점 추정 엔진 ═══
// ═══════════════════════════════════════════

// 실기 종목별 기록을 min-max 범위 기반으로 비율 추정 (0~1)
function calcSportsEstimate(univ) {
  if (!univ.sports_events || univ.sports_events.length === 0) return { ratio: 0, score: 0, perEvent: [] };
  const sportsTotal = univ.sports_total || 0;
  if (sportsTotal <= 0) return { ratio: 0, score: 0, perEvent: [] };

  const perEvent = [];
  let totalRatio = 0;
  let validCount = 0;

  for (const eventName of univ.sports_events) {
    const field = findSportsField(eventName);
    const currentVal = state.simSports[eventName] !== undefined 
      ? state.simSports[eventName] 
      : (state.student.sports[eventName] || state.student.sports[field.key] || 0);
    
    if (currentVal <= 0 || field.unit === '-' || field.unit === '점') {
      // 점수형 종목(체조 등)은 직접 비율로
      if (field.unit === '점' && currentVal > 0 && field.max > 0) {
        const r = Math.min(currentVal / field.max, 1);
        perEvent.push({ event: eventName, val: currentVal, ratio: r, field });
        totalRatio += r;
        validCount++;
      } else {
        perEvent.push({ event: eventName, val: currentVal, ratio: 0, field });
      }
      continue;
    }

    const range = field.max - field.min;
    if (range <= 0) { perEvent.push({ event: eventName, val: currentVal, ratio: 0, field }); continue; }

    let ratio;
    if (field.direction === 'lower') {
      // 낮을수록 좋음 (달리기 등): min이 만점, max가 최저
      ratio = Math.max(0, Math.min(1, (field.max - currentVal) / range));
    } else {
      // 높을수록 좋음: max가 만점
      ratio = Math.max(0, Math.min(1, (currentVal - field.min) / range));
    }
    perEvent.push({ event: eventName, val: currentVal, ratio, field });
    totalRatio += ratio;
    validCount++;
  }

  const avgRatio = validCount > 0 ? totalRatio / validCount : 0;
  const estimatedScore = avgRatio * sportsTotal;

  return { ratio: avgRatio, score: Math.round(estimatedScore * 10) / 10, perEvent };
}

// 전체 추정 총점 계산 (수능 환산 + 실기 추정)
function calcTotalEstimate(univ) {
  const student = getSimStudent();
  const suneungScore = calcSuneungLocal(student, univ);
  const sportsEst = calcSportsEstimate(univ);
  const totalScore = suneungScore + sportsEst.score;
  const cutlineTotal = univ.cutline_total || 0;
  const diff = cutlineTotal > 0 ? Math.round((totalScore - cutlineTotal) * 10) / 10 : 0;
  const status = cutlineTotal > 0 ? getStatusLocal(totalScore, cutlineTotal) : '소신지원';

  return {
    suneungScore,
    sportsScore: sportsEst.score,
    sportsRatio: sportsEst.ratio,
    totalScore,
    cutlineTotal,
    diff,
    status,
    perEvent: sportsEst.perEvent
  };
}

// ═══════════════════════════════════════════
// ═══ 합격선 갭 분석 + 자동 추천 엔진 ═══
// ═══════════════════════════════════════════
function generateCutlineAdvice(univ) {
  const student = getSimStudent();
  const myScore = calcSuneungLocal(student, univ);
  const cutline = univ.cutline_suneung || 0;
  const diff = myScore - cutline;

  if (cutline <= 0) return null;

  const advice = { diff, myScore, cutline, isAbove: diff >= 0, suggestions: [] };

  if (diff >= 0) {
    // 커트라인 이상
    advice.message = `수능 환산점수가 커트라인보다 <strong>${diff.toFixed(1)}점</strong> 높습니다. 실기 점수도 확인하세요.`;
    advice.type = 'above';
  } else {
    // 커트라인 미만 — 효율적인 올리기 조합 추천
    const needed = Math.abs(diff);
    advice.message = `수능 환산점수가 커트라인보다 <strong>${needed.toFixed(1)}점</strong> 부족합니다. 아래 조합을 검토하세요.`;
    advice.type = 'below';

    // 각 영역별 1점(원점수) 올렸을 때 환산 점수 증가량 계산
    const impacts = [];

    // 국어
    if (univ.korean_yn && univ.korean_points > 0) {
      const method = univ.score_method || '';
      let delta;
      if (method.includes('백분위')) {
        delta = (1 / 100) * univ.korean_points;
      } else {
        delta = (1 / 150) * univ.korean_points;
      }
      const curVal = student.korean.standard;
      const maxVal = 150;
      const headroom = maxVal - curVal;
      if (headroom > 0 && delta > 0) {
        const stepsNeeded = Math.min(Math.ceil(needed / delta), headroom);
        impacts.push({
          area: '국어 표준점수',
          delta,
          stepsNeeded,
          gainPerStep: delta,
          totalGain: stepsNeeded * delta,
          action: `국어 표준점수 +${stepsNeeded} (${curVal} → ${curVal + stepsNeeded})`,
          icon: 'fa-book',
          color: 'var(--accent)'
        });
      }
    }

    // 수학
    if (univ.math_yn && univ.math_points > 0) {
      const method = univ.score_method || '';
      let delta;
      if (method.includes('백분위')) {
        delta = (1 / 100) * univ.math_points;
      } else {
        delta = (1 / 150) * univ.math_points;
      }
      const curVal = student.math.standard;
      const maxVal = 150;
      const headroom = maxVal - curVal;
      if (headroom > 0 && delta > 0) {
        const stepsNeeded = Math.min(Math.ceil(needed / delta), headroom);
        impacts.push({
          area: '수학 표준점수',
          delta,
          stepsNeeded,
          gainPerStep: delta,
          totalGain: stepsNeeded * delta,
          action: `수학 표준점수 +${stepsNeeded} (${curVal} → ${curVal + stepsNeeded})`,
          icon: 'fa-calculator',
          color: 'var(--purple)'
        });
      }
    }

    // 영어 (등급 개선)
    if (univ.english_yn && univ.english_grade_scores && univ.english_grade_scores.length >= 9) {
      const curGrade = student.english.grade;
      if (curGrade > 1) {
        const curScore = univ.english_grade_scores[curGrade - 1] || 0;
        const nextScore = univ.english_grade_scores[curGrade - 2] || 0;
        const delta = nextScore - curScore;
        if (delta > 0) {
          impacts.push({
            area: '영어 등급',
            delta,
            stepsNeeded: 1,
            gainPerStep: delta,
            totalGain: delta,
            action: `영어 등급 1단계 개선 (${curGrade}등급 → ${curGrade - 1}등급)`,
            icon: 'fa-globe',
            color: 'var(--yellow)'
          });
        }
      }
    }

    // 탐구1
    if (univ.inquiry_yn && univ.inquiry_points > 0) {
      const method = univ.score_method || '';
      let delta;
      if (method.includes('백분위')) {
        delta = (1 / 200) * univ.inquiry_points;
      } else {
        delta = (1 / 140) * univ.inquiry_points;
      }
      const curVal = student.inquiry1.standard;
      const maxVal = method.includes('백분위') ? 100 : 150;
      const headroom = maxVal - curVal;
      if (headroom > 0 && delta > 0) {
        const stepsNeeded = Math.min(Math.ceil(needed / delta), headroom);
        impacts.push({
          area: '탐구1 표준점수',
          delta,
          stepsNeeded,
          gainPerStep: delta,
          totalGain: stepsNeeded * delta,
          action: `탐구1 표준점수 +${stepsNeeded} (${curVal} → ${curVal + stepsNeeded})`,
          icon: 'fa-flask',
          color: 'var(--green)'
        });
      }
    }

    // 한국사 (감점 줄이기)
    if (univ.hanksa_deductions && univ.hanksa_deductions.length >= 9) {
      const curGrade = student.hanksa.grade;
      if (curGrade > 1) {
        const curDeduct = univ.hanksa_deductions[curGrade - 1] || 0;
        const nextDeduct = univ.hanksa_deductions[curGrade - 2] || 0;
        const delta = nextDeduct - curDeduct; // 감점이 줄어들면 양수
        if (delta > 0) {
          impacts.push({
            area: '한국사 등급',
            delta,
            stepsNeeded: 1,
            gainPerStep: delta,
            totalGain: delta,
            action: `한국사 등급 1단계 개선 (${curGrade}등급 → ${curGrade - 1}등급)`,
            icon: 'fa-flag',
            color: 'var(--orange)'
          });
        }
      }
    }

    // 효율 순서로 정렬 (1단위당 환산점수 증가가 큰 순서)
    impacts.sort((a, b) => b.gainPerStep - a.gainPerStep);

    // 상위 3개 추천
    advice.suggestions = impacts.slice(0, 3);
  }

  return advice;
}


// ── 유틸 ──
function gradeOptions(selected) {
  return [1,2,3,4,5,6,7,8,9].map(g => `<option value="${g}" ${g == selected ? 'selected' : ''}>${g}등급</option>`).join('');
}
function subjectOptions(list, selected) {
  return list.map(s => `<option ${s === selected ? 'selected' : ''}>${s}</option>`).join('');
}
function showToast(msg) {
  state.toast = msg;
  renderToast();
  setTimeout(() => {
    const t = document.getElementById('toast');
    if (t) {
      t.classList.add('toast-exit');
      setTimeout(() => { state.toast = null; t.remove(); }, 300);
    } else {
      state.toast = null;
    }
  }, 2700);
}
function renderToast() {
  let t = document.getElementById('toast');
  if (t) t.remove();
  if (!state.toast) return;
  const d = document.createElement('div');
  d.id = 'toast'; d.className = 'toast';
  d.innerHTML = `<i class="fas fa-check-circle"></i> ${state.toast}`;
  document.body.appendChild(d);
}

// ── 메인 렌더링 ──
function render() {
  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + '<main class="main">' + renderContent() + renderDisclaimer() + '</main>' + renderMobileNav();
  bindEvents();
  // 스크롤 리빌 초기화 (약간의 지연으로 DOM 렌더링 보장)
  requestAnimationFrame(() => initScrollReveal());
}

function renderHeader() {
  return `
  <header class="header">
    <div class="header-inner">
      <div class="logo">
        <div class="logo-icon">K1</div>
        <div class="logo-text">
          <div class="logo-title">체대입시 분석 시스템</div>
          <div class="logo-sub">K1 SPORTS &middot; 2027학년도 정시</div>
        </div>
      </div>
      <nav class="nav">
        <button class="nav-btn ${state.tab === 'input' ? 'active' : ''}" data-tab="input">
          <i class="fas fa-edit"></i> 성적 입력
        </button>
        <button class="nav-btn ${state.tab === 'result' ? 'active' : ''}" data-tab="result" ${!state.results ? 'disabled style="opacity:0.4"' : ''}>
          <i class="fas fa-chart-bar"></i> 전체 결과
        </button>
        <button class="nav-btn ${state.tab === 'detail' ? 'active' : ''}" data-tab="detail" ${!state.selectedUniv ? 'disabled style="opacity:0.4"' : ''}>
          <i class="fas fa-school"></i> 학교 상세
        </button>
        <button class="nav-btn ${state.tab === 'admin' ? 'active' : ''}" data-tab="admin">
          <i class="fas fa-cog"></i> 관리자
        </button>
      </nav>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="status-dot"><span>실시간 계산</span></div>
        <button class="theme-toggle" id="btn-theme" title="테마 변경">
          <i class="fas fa-${getTheme() === 'dark' ? 'sun' : 'moon'}"></i>
        </button>
      </div>
    </div>
  </header>`;
}

function renderMobileNav() {
  return `
  <div class="mobile-nav">
    <button class="mobile-nav-btn ${state.tab === 'input' ? 'active' : ''}" data-tab="input">
      <i class="fas fa-edit"></i><span>성적입력</span>
    </button>
    <button class="mobile-nav-btn ${state.tab === 'result' ? 'active' : ''}" data-tab="result">
      <i class="fas fa-chart-bar"></i><span>전체결과</span>
    </button>
    <button class="mobile-nav-btn ${state.tab === 'detail' ? 'active' : ''}" data-tab="detail">
      <i class="fas fa-school"></i><span>학교상세</span>
    </button>
    <button class="mobile-nav-btn ${state.tab === 'admin' ? 'active' : ''}" data-tab="admin">
      <i class="fas fa-cog"></i><span>관리자</span>
    </button>
  </div>`;
}

function renderContent() {
  if (state.loading) return `
    <div class="loading" style="padding:40px 0">
      <div class="loading-spinner"></div>
      <div style="color:var(--muted);font-size:14px;font-weight:600;margin-bottom:32px">230개+ 대학 분석 중...</div>
      <div class="loading-skeleton">
        <div class="skeleton skeleton-row" style="height:48px;width:60%;margin:0 auto"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;max-width:600px;margin:0 auto">
          <div class="skeleton skeleton-card" style="min-height:80px"></div>
          <div class="skeleton skeleton-card" style="min-height:80px;animation-delay:0.1s"></div>
          <div class="skeleton skeleton-card" style="min-height:80px;animation-delay:0.2s"></div>
          <div class="skeleton skeleton-card" style="min-height:80px;animation-delay:0.3s"></div>
        </div>
        <div class="skeleton skeleton-row" style="animation-delay:0.1s"></div>
        <div class="skeleton skeleton-row" style="animation-delay:0.2s"></div>
        <div class="skeleton skeleton-row" style="animation-delay:0.3s"></div>
        <div class="skeleton skeleton-row" style="animation-delay:0.4s"></div>
      </div>
    </div>`;
  switch (state.tab) {
    case 'input': return renderInput();
    case 'result': return renderResult();
    case 'detail': return renderDetail();
    case 'admin': return renderAdmin();
    default: return renderInput();
  }
}

// ════════════════════════════════════════════
// ═══ 화면 1: 성적 입력 ═══
// ════════════════════════════════════════════
function renderInput() {
  const s = state.student;
  const mainSports = SPORTS_FIELDS.slice(0, 10);
  const extraSports = SPORTS_FIELDS.slice(10);

  return `
  <div class="section-title reveal"><span>수능 성적 입력</span></div>
  <div class="score-grid">
    <!-- 국어 -->
    <div class="score-card" style="border:1px solid rgba(0,212,255,0.25)">
      <div class="score-card-title" style="color:var(--accent)"><i class="fas fa-book" style="margin-right:6px"></i>국어</div>
      <div class="form-row">
        <span class="form-label">선택과목</span>
        <select data-field="korean.subject">
          <option ${s.korean.subject === '언매' ? 'selected' : ''}>언매</option>
          <option ${s.korean.subject === '화작' ? 'selected' : ''}>화작</option>
        </select>
      </div>
      <div class="form-row">
        <span class="form-label">등급</span>
        <select data-field="korean.grade">${gradeOptions(s.korean.grade)}</select>
      </div>
      <div class="form-row">
        <span class="form-label">원점수</span>
        <input type="number" data-raw="korean" value="${s.korean.raw || ''}" min="0" max="100" placeholder="0~100">
      </div>
      <div class="form-row">
        <span class="form-label">표준점수 <span class="std-link-icon" data-link-icon="korean">${s.korean.stdLinked ? '\u{1F517}' : '\u270F\uFE0F'}</span></span>
        <input type="number" data-field="korean.standard" value="${s.korean.standard}" min="50" max="200">
      </div>
      <div class="form-row">
        <span class="form-label">백분위</span>
        <input type="number" data-field="korean.percentile" value="${s.korean.percentile}" min="0" max="100">
      </div>
    </div>

    <!-- 수학 -->
    <div class="score-card" style="border:1px solid rgba(167,139,250,0.25)">
      <div class="score-card-title" style="color:var(--purple)"><i class="fas fa-calculator" style="margin-right:6px"></i>수학</div>
      <div class="form-row">
        <span class="form-label">선택과목</span>
        <select data-field="math.subject">
          <option ${s.math.subject === '확통' ? 'selected' : ''}>확통</option>
          <option ${s.math.subject === '미적분' ? 'selected' : ''}>미적분</option>
          <option ${s.math.subject === '기하' ? 'selected' : ''}>기하</option>
        </select>
      </div>
      <div class="form-row">
        <span class="form-label">등급</span>
        <select data-field="math.grade">${gradeOptions(s.math.grade)}</select>
      </div>
      <div class="form-row">
        <span class="form-label">원점수</span>
        <input type="number" data-raw="math" value="${s.math.raw || ''}" min="0" max="100" placeholder="0~100">
      </div>
      <div class="form-row">
        <span class="form-label">표준점수 <span class="std-link-icon" data-link-icon="math">${s.math.stdLinked ? '\u{1F517}' : '\u270F\uFE0F'}</span></span>
        <input type="number" data-field="math.standard" value="${s.math.standard}" min="50" max="200">
      </div>
      <div class="form-row">
        <span class="form-label">백분위</span>
        <input type="number" data-field="math.percentile" value="${s.math.percentile}" min="0" max="100">
      </div>
    </div>

    <!-- 탐구 -->
    <div class="score-card" style="border:1px solid rgba(0,230,118,0.25)">
      <div class="score-card-title" style="color:var(--green)"><i class="fas fa-flask" style="margin-right:6px"></i>탐구</div>
      <div style="margin-bottom:14px">
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px;font-weight:600">탐구 1</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <select data-field="inquiry1.subject" style="flex:1;min-width:80px">${subjectOptions(SUBJECTS_INQUIRY, s.inquiry1.subject)}</select>
          <input type="number" data-raw="inquiry1" value="${s.inquiry1.raw || ''}" placeholder="원점수" style="width:55px" min="0" max="50">
          <input type="number" data-field="inquiry1.standard" value="${s.inquiry1.standard}" placeholder="표점" style="width:55px">
          <span class="std-link-icon" data-link-icon="inquiry1" style="font-size:13px">${s.inquiry1.stdLinked ? '\u{1F517}' : '\u270F\uFE0F'}</span>
          <input type="number" data-field="inquiry1.percentile" value="${s.inquiry1.percentile}" placeholder="백분위" style="width:55px">
        </div>
      </div>
      <div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px;font-weight:600">탐구 2</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <select data-field="inquiry2.subject" style="flex:1;min-width:80px">${subjectOptions(SUBJECTS_INQUIRY, s.inquiry2.subject)}</select>
          <input type="number" data-raw="inquiry2" value="${s.inquiry2.raw || ''}" placeholder="원점수" style="width:55px" min="0" max="50">
          <input type="number" data-field="inquiry2.standard" value="${s.inquiry2.standard}" placeholder="표점" style="width:55px">
          <span class="std-link-icon" data-link-icon="inquiry2" style="font-size:13px">${s.inquiry2.stdLinked ? '\u{1F517}' : '\u270F\uFE0F'}</span>
          <input type="number" data-field="inquiry2.percentile" value="${s.inquiry2.percentile}" placeholder="백분위" style="width:55px">
        </div>
      </div>
    </div>

    <!-- 영어·한국사 -->
    <div class="score-card" style="border:1px solid rgba(255,214,0,0.25)">
      <div class="score-card-title" style="color:var(--yellow)"><i class="fas fa-globe" style="margin-right:6px"></i>영어 · 한국사</div>
      <div class="form-row">
        <span class="form-label">영어 등급</span>
        <select data-field="english.grade">${gradeOptions(s.english.grade)}</select>
      </div>
      <div class="form-row">
        <span class="form-label">한국사 등급</span>
        <select data-field="hanksa.grade">${gradeOptions(s.hanksa.grade)}</select>
      </div>
      <div style="margin-top:16px;padding:12px;background:var(--surface);border-radius:8px">
        <div style="font-size:11px;color:var(--muted);line-height:1.6">
          <i class="fas fa-info-circle" style="color:var(--accent);margin-right:4px"></i>
          영어·한국사는 <strong style="color:var(--yellow)">등급만</strong> 입력하세요.<br>
          대학별로 감점 또는 등급별 점수가 자동 적용됩니다.
        </div>
      </div>
    </div>
  </div>

  <div class="section-title reveal"><span>실기 기록 입력</span></div>
  <div class="card" style="margin-bottom:32px">
    <div style="font-size:12px;color:var(--muted);margin-bottom:20px;padding:10px 14px;background:var(--surface);border-radius:8px;line-height:1.6">
      <i class="fas fa-info-circle" style="color:var(--accent);margin-right:4px"></i>
      해당 종목만 입력하세요. 미입력 종목(0)은 해당 종목을 요구하지 않는 학교에서만 정상 계산됩니다.
    </div>
    <div class="slider-group">
      ${mainSports.map(f => renderSlider(f, s.sports[f.key] || 0)).join('')}
    </div>
    <details style="margin-top:20px">
      <summary style="cursor:pointer;color:var(--accent);font-size:12px;font-weight:700;padding:8px 0">
        <i class="fas fa-plus-circle" style="margin-right:4px"></i> 추가 종목 입력 (${extraSports.length}개)
      </summary>
      <div class="slider-group" style="margin-top:16px">
        ${extraSports.map(f => renderSlider(f, s.sports[f.key] || 0)).join('')}
      </div>
    </details>
  </div>

  <div style="text-align:center">
    <button class="cta-btn" id="btn-analyze">
      <i class="fas fa-search"></i> 합격 가능 대학 분석하기
    </button>
  </div>`;
}

function renderSlider(f, value) {
  const decimals = f.step < 1 ? 1 : 0;
  return `
  <div class="slider-item">
    <div class="slider-header">
      <div class="slider-label">${f.label}</div>
      <div><span class="slider-value" id="sv-${f.key}">${Number(value).toFixed(decimals)}</span><span class="slider-unit">${f.unit}</span></div>
    </div>
    <input type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${value}" data-sport="${f.key}">
    <div class="slider-range"><span>${f.min}${f.unit}</span><span>${f.max}${f.unit}</span></div>
  </div>`;
}

// ════════════════════════════════════════════
// ═══ 화면 2: 전체 결과 ═══
// ════════════════════════════════════════════
function renderResult() {
  if (!state.results) return `
    <div class="empty-state">
      <div class="empty-state-icon"><i class="fas fa-chart-bar"></i></div>
      <div class="empty-state-title">아직 분석 결과가 없어요</div>
      <div class="empty-state-desc">성적을 입력하고 분석하기를 클릭하면<br>전국 230개+ 대학의 합격 가능성을 즉시 확인할 수 있어요</div>
      <button class="empty-state-cta" data-tab="input"><i class="fas fa-edit"></i> 성적 입력하러 가기</button>
    </div>`;
  
  const { summary, results } = state.results;
  const f = state.filters;
  
  let filtered = results;
  if (f.group !== '전체') filtered = filtered.filter(r => r.group === f.group);
  if (f.location !== '전체') filtered = filtered.filter(r => r.location === f.location);
  if (f.type !== '전체') filtered = filtered.filter(r => r.univ_type === f.type);
  if (f.status !== '전체') {
    const statusMap = { '가능': '지원가능', '소신': '소신지원', '위험': '지원위험', '불가': '지원불가' };
    filtered = filtered.filter(r => r.status === (statusMap[f.status] || f.status));
  }
  if (f.search) {
    const q = f.search.toLowerCase();
    filtered = filtered.filter(r => r.university.toLowerCase().includes(q) || r.department.toLowerCase().includes(q));
  }
  
  if (f.sort === 'diff') filtered.sort((a, b) => b.diff - a.diff);
  else if (f.sort === 'rate') filtered.sort((a, b) => (a.competition_rate || 99) - (b.competition_rate || 99));
  else if (f.sort === 'name') filtered.sort((a, b) => a.university.localeCompare(b.university));
  
  const locations = [...new Set(results.map(r => r.location).filter(Boolean))].sort();
  
  return `
  <div class="summary-grid">
    ${renderSummaryCard('지원가능', summary['지원가능'] || 0, 'green', f.status === '가능')}
    ${renderSummaryCard('소신지원', summary['소신지원'] || 0, 'yellow', f.status === '소신')}
    ${renderSummaryCard('지원위험', summary['지원위험'] || 0, 'orange', f.status === '위험')}
    ${renderSummaryCard('지원불가', summary['지원불가'] || 0, 'red', f.status === '불가')}
  </div>

  <div class="filter-bar">
    <div class="search-wrap">
      <i class="fas fa-search"></i>
      <input type="text" class="search-input" placeholder="대학·학과 검색..." value="${f.search}" data-filter="search">
    </div>
    <div style="width:1px;height:20px;background:var(--border);margin:0 4px"></div>
    <span class="filter-label">군</span>
    <select class="filter-select" data-filter="group">
      <option ${f.group === '전체' ? 'selected' : ''}>전체</option>
      <option ${f.group === '가군' ? 'selected' : ''}>가군</option>
      <option ${f.group === '나군' ? 'selected' : ''}>나군</option>
      <option ${f.group === '다군' ? 'selected' : ''}>다군</option>
    </select>
    <span class="filter-label">지역</span>
    <select class="filter-select" data-filter="location">
      <option>전체</option>
      ${locations.map(l => `<option ${f.location === l ? 'selected' : ''}>${l}</option>`).join('')}
    </select>
    <span class="filter-label">유형</span>
    <select class="filter-select" data-filter="type">
      <option>전체</option>
      <option ${f.type === '국립' ? 'selected' : ''}>국립</option>
      <option ${f.type === '사립' ? 'selected' : ''}>사립</option>
    </select>
    <span class="filter-label">정렬</span>
    <select class="filter-select" data-filter="sort">
      <option value="diff" ${f.sort === 'diff' ? 'selected' : ''}>점수차순</option>
      <option value="rate" ${f.sort === 'rate' ? 'selected' : ''}>경쟁률순</option>
      <option value="name" ${f.sort === 'name' ? 'selected' : ''}>이름순</option>
    </select>
    <span style="font-size:11px;color:var(--muted);margin-left:auto;font-weight:600">${filtered.length}개 대학</span>
  </div>

  <div style="display:flex;gap:6px;margin-bottom:16px">
    <button class="status-filter-btn ${f.status === '전체' ? 'active-all' : ''}" data-status-filter="전체">전체</button>
    <button class="status-filter-btn ${f.status === '가능' ? 'active-green' : ''}" data-status-filter="가능">지원가능 (${summary['지원가능'] || 0})</button>
    <button class="status-filter-btn ${f.status === '소신' ? 'active-yellow' : ''}" data-status-filter="소신">소신지원 (${summary['소신지원'] || 0})</button>
    <button class="status-filter-btn ${f.status === '위험' ? 'active-orange' : ''}" data-status-filter="위험">지원위험 (${summary['지원위험'] || 0})</button>
    <button class="status-filter-btn ${f.status === '불가' ? 'active-red' : ''}" data-status-filter="불가">지원불가 (${summary['지원불가'] || 0})</button>
  </div>

  <div class="result-header">
    <div class="result-header-item">대학 / 학과</div>
    <div class="result-header-item">실기 종목</div>
    <div class="result-header-item">수능 환산</div>
    <div class="result-header-item">커트라인</div>
    <div class="result-header-item">점수차</div>
    <div class="result-header-item">판정</div>
  </div>

  <div class="result-list">
    ${filtered.length > 0 ? filtered.map(r => renderResultRow(r)).join('') : `
      <div class="empty-state" style="padding:40px 20px">
        <div class="empty-state-icon" style="width:64px;height:64px;font-size:24px"><i class="fas fa-search"></i></div>
        <div class="empty-state-title">조건에 맞는 대학이 없어요</div>
        <div class="empty-state-desc">필터 조건을 변경하거나 검색어를 수정해보세요</div>
      </div>`}
  </div>`;
}

function renderSummaryCard(label, count, color, isActive) {
  const colors = {
    green: { c: 'var(--green)', bg: 'rgba(0,230,118,0.08)', b: 'rgba(0,230,118,0.3)' },
    yellow: { c: 'var(--yellow)', bg: 'rgba(255,214,0,0.08)', b: 'rgba(255,214,0,0.3)' },
    orange: { c: 'var(--orange)', bg: 'rgba(255,109,0,0.08)', b: 'rgba(255,109,0,0.3)' },
    red: { c: 'var(--red)', bg: 'rgba(255,23,68,0.08)', b: 'rgba(255,23,68,0.3)' },
  }[color];
  const activeStyle = isActive ? `box-shadow:0 0 20px ${colors.b};transform:translateY(-2px);` : '';
  const shortLabel = { '지원가능': '가능', '소신지원': '소신', '지원위험': '위험', '지원불가': '불가' }[label];
  return `
  <div class="summary-card" style="background:${colors.bg};border:1px solid ${colors.b};${activeStyle};cursor:pointer" data-summary-status="${shortLabel}">
    <div class="summary-count" style="color:${colors.c}">${count}</div>
    <div class="summary-label" style="color:${colors.c}">${label}</div>
  </div>`;
}

function renderResultRow(r) {
  const statusMap = { '지원가능': '가능', '소신지원': '소신', '지원위험': '위험', '지원불가': '불가' };
  const s = statusMap[r.status];
  const groupColor = r.group === '가군' ? 'var(--accent)' : r.group === '나군' ? 'var(--purple)' : 'var(--green)';
  return `
  <div class="result-row" data-uid="${r.university_id}">
    <div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${groupColor}22;color:${groupColor};font-weight:700;border:1px solid ${groupColor}44">${r.group}</span>
        <span class="result-univ-name">${r.university}</span>
      </div>
      <div class="result-univ-sub">${r.department} · ${r.location || ''} · ${r.univ_type || ''} ${r.capacity ? '· ' + r.capacity + '명' : ''} ${r.competition_rate > 0 ? '· ' + r.competition_rate + ':1' : ''}</div>
    </div>
    <div class="result-events">
      ${r.sports_events.slice(0, 3).map(e => `<span class="event-tag">${e}</span>`).join('')}
      ${r.sports_events.length > 3 ? `<span class="event-tag" style="color:var(--accent)">+${r.sports_events.length - 3}</span>` : ''}
    </div>
    <div class="result-score">${r.my_suneung_score.toFixed(1)}</div>
    <div class="result-cutline">${r.cutline_suneung > 0 ? r.cutline_suneung.toFixed(1) : '<span style="font-size:12px;color:var(--muted)">미공개</span>'}</div>
    <div class="result-diff ${r.diff >= 0 ? 'positive' : 'negative'}">${r.diff >= 0 ? '+' : ''}${r.diff.toFixed(1)}</div>
    <span class="badge badge-${s}">${r.status}</span>
  </div>`;
}

// ════════════════════════════════════════════
// ═══ 화면 3: 학교 상세 + 수능/실기 시뮬레이터 ═══
// ════════════════════════════════════════════
function renderDetail() {
  const u = state.selectedUniv;
  if (!u) return `
    <div class="empty-state">
      <div class="empty-state-icon"><i class="fas fa-school"></i></div>
      <div class="empty-state-title">학교를 선택해주세요</div>
      <div class="empty-state-desc">전체 결과에서 관심있는 대학을 클릭하면<br>상세 분석과 시뮬레이션을 확인할 수 있어요</div>
      ${state.results ? '<button class="empty-state-cta" data-tab="result"><i class="fas fa-list"></i> 결과 목록 보기</button>' : '<button class="empty-state-cta" data-tab="input"><i class="fas fa-edit"></i> 성적 입력하러 가기</button>'}
    </div>`;
  
  const statusMap = { '지원가능': '가능', '소신지원': '소신', '지원위험': '위험', '지원불가': '불가' };

  // 시뮬레이션 활성 여부에 따라 점수 결정
  const sim = state.simSuneung;
  const simResult = sim ? calcSimScore() : null;
  const currentScore = sim ? simResult.score : u.my_suneung_score;
  const currentDiff = sim ? simResult.diff : u.diff;
  let currentStatus = sim ? simResult.status : u.status;
  
  // 수능 커트라인이 없고 총점 커트라인만 있는 경우, 총점 기준 판정 사용
  const initialTotalEst = calcTotalEstimate(u);
  if (u.cutline_total > 0 && (u.cutline_suneung <= 0)) {
    currentStatus = initialTotalEst.status;
  }
  const s = statusMap[currentStatus];

  // 수능 반영 구조
  const weights = [];
  if (u.korean_yn) weights.push({ name: '국어', ratio: u.korean_ratio, points: u.korean_points, color: 'var(--accent)' });
  if (u.math_yn) weights.push({ name: '수학', ratio: u.math_ratio, points: u.math_points, color: 'var(--purple)' });
  if (u.english_yn) weights.push({ name: '영어', ratio: u.english_ratio || 0, points: u.english_points, color: 'var(--yellow)', isDeduction: u.english_method === '감점' });
  if (u.inquiry_yn) weights.push({ name: '탐구', ratio: u.inquiry_ratio, points: u.inquiry_points, color: 'var(--green)' });
  
  const maxRef = Math.max(u.suneung_total, u.cutline_suneung || 0, currentScore || 0) * 1.1;
  const myPct = Math.min((currentScore / maxRef) * 100, 100);
  const cutPct = u.cutline_suneung > 0 ? Math.min((u.cutline_suneung / maxRef) * 100, 100) : 0;
  
  const engTable = u.english_grade_scores || [];
  const hksTable = u.hanksa_deductions || [];
  const engGrade = sim ? sim.engGrade : state.student.english.grade;
  const hksGrade = sim ? sim.hanksaGrade : state.student.hanksa.grade;
  
  // 실기 시뮬레이터 데이터
  const simEvents = u.sports_events.map(eventName => {
    const field = findSportsField(eventName);
    const baseVal = state.student.sports[eventName] || state.student.sports[field.key] || 0;
    const currentVal = state.simSports[eventName] !== undefined ? state.simSports[eventName] : baseVal;
    return { ...field, key: eventName, currentVal, baseVal };
  });

  // 시뮬레이션 수능 값 (현재)
  const simKor = sim ? sim.koreanStd : state.student.korean.standard;
  const simMath = sim ? sim.mathStd : state.student.math.standard;
  const simEng = sim ? sim.engGrade : state.student.english.grade;
  const simInq1 = sim ? sim.inq1Std : state.student.inquiry1.standard;
  const simInq2 = sim ? sim.inq2Std : state.student.inquiry2.standard;
  const simHks = sim ? sim.hanksaGrade : state.student.hanksa.grade;

  // 시뮬레이션 원점수 값
  const simKorRaw = sim ? (sim.koreanRaw !== undefined ? sim.koreanRaw : state.student.korean.raw) : state.student.korean.raw;
  const simMathRaw = sim ? (sim.mathRaw !== undefined ? sim.mathRaw : state.student.math.raw) : state.student.math.raw;
  const simInq1Raw = sim ? (sim.inq1Raw !== undefined ? sim.inq1Raw : state.student.inquiry1.raw) : state.student.inquiry1.raw;
  const simInq2Raw = sim ? (sim.inq2Raw !== undefined ? sim.inq2Raw : state.student.inquiry2.raw) : state.student.inquiry2.raw;

  // 기준 점수 (원본)
  const baseKor = state.student.korean.standard;
  const baseMath = state.student.math.standard;
  const baseEng = state.student.english.grade;
  const baseInq1 = state.student.inquiry1.standard;
  const baseInq2 = state.student.inquiry2.standard;
  const baseHks = state.student.hanksa.grade;

  // 합격선 분석
  // 합격선 분석 (renderLiveAdvice에서 실시간 처리)

  // 전체 총점 추정 (수능 + 실기)
  const totalEst = calcTotalEstimate(u);
  const hasCutlineTotal = u.cutline_total > 0;
  const totalMax = u.suneung_total + u.sports_total;
  const totalMyPct = totalMax > 0 ? Math.min((totalEst.totalScore / totalMax) * 100, 100) : 0;
  const totalCutPct = hasCutlineTotal ? Math.min((u.cutline_total / totalMax) * 100, 100) : 0;

  return `
  <!-- 시뮬레이션 모드 요약 바 -->
  ${sim ? renderSimBar(u) : ''}

  <!-- 헤더 -->
  <div class="detail-header">
    <div>
      <div class="detail-name">${u.university}</div>
      <div class="detail-sub">
        ${u.department} · ${u.group} · ${u.location || ''} · ${u.univ_type || ''} 
        ${u.capacity ? '· 모집 ' + u.capacity + '명' : ''} 
        ${u.competition_rate > 0 ? '· 경쟁률 ' + u.competition_rate + ':1' : ''}
        ${u.step1 ? '· ' + u.step1 : ''}
      </div>
    </div>
    <span class="badge badge-${s} badge-lg" id="detail-badge">${currentStatus}</span>
  </div>
  
  <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap">
    <button class="group-tab" id="btn-back-result" style="font-size:12px;padding:6px 16px">
      <i class="fas fa-arrow-left"></i> 목록으로
    </button>
    ${!sim ? `<button class="group-tab" id="btn-start-sim" style="font-size:12px;padding:6px 16px;background:rgba(0,212,255,0.12);border-color:rgba(0,212,255,0.4);color:var(--accent)">
      <i class="fas fa-sliders-h"></i> 시뮬레이션 모드 시작
    </button>` : `<button class="group-tab" id="btn-sim-reset-inline" style="font-size:12px;padding:6px 16px;background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.15);color:var(--muted)">
      <i class="fas fa-undo"></i> 초기화
    </button>`}
    <div style="flex:1"></div>
    <div style="font-size:11px;color:var(--muted);align-self:center;text-align:right;line-height:1.5">
      활용지표: <strong style="color:var(--accent)">${u.score_method || '-'}</strong> · 
      반영과목: <strong style="color:var(--text)">${u.reflect_subjects || '-'}</strong>
    </div>
  </div>

  <!-- 수능 반영 구조 + 합격선 비교 -->
  <div class="detail-grid">
    <div class="card">
      <div style="font-size:12px;font-weight:800;color:var(--accent);letter-spacing:1px;margin-bottom:18px">
        <i class="fas fa-chart-pie" style="margin-right:6px"></i>수능 반영 구조
      </div>
      ${weights.map(w => `
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:12px;color:var(--text);font-weight:600">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${w.color};margin-right:6px"></span>
              ${w.name} ${w.isDeduction ? '<span style="font-size:10px;color:var(--orange)">(감점)</span>' : `(${(w.ratio * 100).toFixed(1)}%)`}
            </span>
            <span style="font-size:12px;color:${w.color};font-weight:800">${w.points.toFixed(1)}점</span>
          </div>
          <div class="progress-bg"><div class="progress-bar" style="width:${w.isDeduction ? 8 : Math.min(w.ratio * 100 * 2, 100)}%;background:linear-gradient(90deg,${w.color},${w.color}88)"></div></div>
        </div>
      `).join('')}
      <div style="margin-top:18px;padding:12px 14px;background:var(--surface);border-radius:8px;display:flex;justify-content:space-between">
        <span style="font-size:11px;color:var(--muted)">수능 총점 <strong style="color:var(--accent)">${u.suneung_total}</strong></span>
        <span style="font-size:11px;color:var(--muted)">실기 총점 <strong style="color:var(--purple)">${u.sports_total}</strong></span>
        <span style="font-size:11px;color:var(--muted)">전체 <strong style="color:var(--text)">${u.suneung_total + u.sports_total}</strong></span>
      </div>
    </div>

    <div class="card">
      <div style="font-size:12px;font-weight:800;color:var(--accent);letter-spacing:1px;margin-bottom:22px">
        <i class="fas fa-balance-scale" style="margin-right:6px"></i>수능 환산점수 vs 커트라인
      </div>
      <div class="compare-bar">
        <div class="compare-bar-bg"></div>
        ${cutPct > 0 ? `<div class="compare-cutline" style="left:${cutPct}%">
          <div class="compare-cutline-label">커트라인</div>
          <div class="compare-cutline-line"></div>
        </div>` : ''}
        <div class="compare-bar-fill" style="width:${myPct}%"></div>
      </div>
      <div class="compare-stats" id="detail-compare-stats">
        <div>
          <div class="compare-num" style="color:var(--accent)" id="detail-my-score">${currentScore.toFixed(1)}</div>
          <div class="compare-label">내 수능 환산</div>
        </div>
        <div>
          <div class="compare-num" style="color:${currentDiff >= 0 ? 'var(--green)' : 'var(--red)'}" id="detail-diff">${currentDiff >= 0 ? '+' : ''}${currentDiff.toFixed(1)}</div>
          <div class="compare-label">차이</div>
        </div>
        <div>
          <div class="compare-num" style="color:var(--orange)">${u.cutline_suneung > 0 ? u.cutline_suneung.toFixed(1) : '-'}</div>
          <div class="compare-label">커트라인</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 전체 총점 추정 (수능+실기) -->
  <div class="card" style="margin-top:4px">
    <div style="font-size:12px;font-weight:800;color:var(--purple);letter-spacing:1px;margin-bottom:18px">
      <i class="fas fa-calculator" style="margin-right:6px"></i>전체 총점 추정 (수능 + 실기)
      <span style="font-size:10px;color:var(--muted);font-weight:400;margin-left:8px">실기 기록 기반 추정치</span>
    </div>
    <div class="compare-bar">
      <div class="compare-bar-bg"></div>
      ${totalCutPct > 0 ? `<div class="compare-cutline" style="left:${totalCutPct}%">
        <div class="compare-cutline-label">합격선</div>
        <div class="compare-cutline-line"></div>
      </div>` : ''}
      <div class="compare-bar-fill" style="width:${totalMyPct}%;background:linear-gradient(90deg,var(--purple),var(--accent))"></div>
    </div>
    <div class="compare-stats" id="detail-total-stats">
      <div>
        <div class="compare-num" style="color:var(--accent)" id="detail-total-suneung">${totalEst.suneungScore.toFixed(1)}</div>
        <div class="compare-label">수능 환산</div>
      </div>
      <div>
        <div class="compare-num" style="color:var(--purple)" id="detail-total-sports">${totalEst.sportsScore.toFixed(1)}</div>
        <div class="compare-label">실기 추정 <span style="font-size:9px">(${Math.round(totalEst.sportsRatio * 100)}%)</span></div>
      </div>
      <div>
        <div class="compare-num" style="color:var(--text);font-size:22px" id="detail-total-score">${totalEst.totalScore.toFixed(1)}</div>
        <div class="compare-label">추정 총점</div>
      </div>
      <div>
        <div class="compare-num" style="color:${totalEst.diff >= 0 ? 'var(--green)' : 'var(--red)'}" id="detail-total-diff">${hasCutlineTotal ? (totalEst.diff >= 0 ? '+' : '') + totalEst.diff.toFixed(1) : '-'}</div>
        <div class="compare-label">합격선 차이</div>
      </div>
      <div>
        <div class="compare-num" style="color:var(--orange)">${hasCutlineTotal ? u.cutline_total.toFixed(1) : '-'}</div>
        <div class="compare-label">합격선(총점)</div>
      </div>
    </div>
    <div style="margin-top:12px;padding:8px 12px;background:var(--surface);border-radius:6px;font-size:10px;color:var(--muted);line-height:1.6">
      <i class="fas fa-info-circle" style="margin-right:4px;color:var(--accent)"></i>
      실기 점수는 종목별 기록의 범위 비율로 추정한 <strong>참고값</strong>입니다. 실제 대학별 배점표와 다를 수 있습니다.
      실기 슬라이더를 조정하면 추정 총점이 실시간으로 변합니다.
    </div>
  </div>

  <!-- 영어·한국사 등급 테이블 -->
  <div class="detail-grid">
    <div class="card">
      <div style="font-size:12px;font-weight:800;color:var(--yellow);letter-spacing:1px;margin-bottom:14px">
        <i class="fas fa-globe" style="margin-right:6px"></i>
        영어 등급별 ${u.english_method === '감점' ? '감점' : '점수'} 
        <span style="font-size:10px;color:var(--muted);font-weight:500">(내 등급: <span id="detail-eng-grade">${engGrade}</span>등급)</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px;text-align:center">
        ${engTable.map((v, i) => `
          <div style="padding:8px 2px;border-radius:8px;font-size:11px;background:${i === engGrade - 1 ? 'rgba(255,214,0,0.15)' : 'var(--surface)'};border:1px solid ${i === engGrade - 1 ? 'rgba(255,214,0,0.4)' : 'var(--border)'};transition:all 0.2s" class="eng-grade-cell" data-grade="${i + 1}">
            <div style="font-size:9px;color:var(--muted);margin-bottom:4px">${i + 1}등급</div>
            <div style="font-weight:800;font-size:12px;color:${i === engGrade - 1 ? 'var(--yellow)' : 'var(--text)'}">${v}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card">
      <div style="font-size:12px;font-weight:800;color:var(--orange);letter-spacing:1px;margin-bottom:14px">
        <i class="fas fa-flag" style="margin-right:6px"></i>
        한국사 등급별 감점
        <span style="font-size:10px;color:var(--muted);font-weight:500">(내 등급: <span id="detail-hks-grade">${hksGrade}</span>등급)</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px;text-align:center">
        ${hksTable.map((v, i) => `
          <div style="padding:8px 2px;border-radius:8px;font-size:11px;background:${i === hksGrade - 1 ? 'rgba(255,109,0,0.15)' : 'var(--surface)'};border:1px solid ${i === hksGrade - 1 ? 'rgba(255,109,0,0.4)' : 'var(--border)'}" class="hks-grade-cell" data-grade="${i + 1}">
            <div style="font-size:9px;color:var(--muted);margin-bottom:4px">${i + 1}등급</div>
            <div style="font-weight:800;color:${i === hksGrade - 1 ? 'var(--orange)' : 'var(--text)'}">${v}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- ═══ 수능 + 실기 시뮬레이터 (좌우 배치) ═══ -->
  ${sim ? renderDualSimPanel(u, simEvents, simKor, simMath, simEng, simInq1, simInq2, simHks, baseKor, baseMath, baseEng, baseInq1, baseInq2, baseHks, simKorRaw, simMathRaw, simInq1Raw, simInq2Raw) : renderSportsOnlyPanel(u, simEvents)}

  <!-- 역산 결과 + 합격선 갭 분석 -->
  <div class="reversal-box">
    <div style="font-size:12px;font-weight:800;color:var(--purple);letter-spacing:1px;margin-bottom:16px">
      <i class="fas fa-bolt" style="margin-right:6px"></i> 역산 결과 — 합격하려면?
    </div>
    <div id="reversal-advice-content">
      ${renderLiveAdvice(u)}
    </div>
    <div class="reversal-grid" id="reversal-sports-grid">
      ${simEvents.map(e => {
        const isPass = e.currentVal > 0;
        return `
        <div class="reversal-item ${isPass ? 'pass' : 'need'}">
          <div style="font-size:11px;color:var(--muted);margin-bottom:6px">${e.label || e.key}</div>
          <div style="font-size:11px;font-weight:500;color:var(--muted);margin-bottom:4px">현재: ${e.currentVal}${e.unit}</div>
          ${isPass
            ? `<div style="font-size:13px;font-weight:700;color:var(--green)"><i class="fas fa-check"></i> 기록 입력됨</div>`
            : `<div style="font-size:13px;font-weight:700;color:var(--orange)"><i class="fas fa-exclamation-triangle"></i> 미입력</div>`
          }
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- 전화번호 -->
  ${u.phone ? `
  <div style="margin-top:20px;text-align:center">
    <a href="tel:${u.phone.replace(/[^0-9-]/g, '')}" style="font-size:12px;color:var(--muted);text-decoration:none">
      <i class="fas fa-phone" style="margin-right:4px;color:var(--accent)"></i> 입학처: ${u.phone}
    </a>
  </div>` : ''}`;
}

// ── 시뮬레이션 모드 상단 고정 바 ──
function renderSimBar(u) {
  const sim = state.simSuneung;
  const baseScore = state.simBaseScore || u.my_suneung_score;
  const simResult = calcSimScore();
  const suneungDelta = simResult.score - baseScore;
  const statusMap = { '지원가능': '가능', '소신지원': '소신', '지원위험': '위험', '지원불가': '불가' };

  // 전체 총점 추정
  const totalEst = calcTotalEstimate(u);
  const hasCutlineTotal = u.cutline_total > 0;
  const displayStatus = (hasCutlineTotal && u.cutline_suneung <= 0) ? totalEst.status : simResult.status;
  const s = statusMap[displayStatus];

  // 실기 변경 종목 수 카운트
  const sportsChanged = Object.keys(state.simSports).filter(k => {
    const base = state.student.sports[k] || 0;
    return Math.abs(state.simSports[k] - base) > 0.01;
  }).length;

  return `
  <div class="sim-mode-bar">
    <div class="sim-mode-inner">
      <div class="sim-mode-label">
        <i class="fas fa-sliders-h"></i> 시뮬레이션
      </div>
      <div class="sim-mode-scores">
        <div class="sim-mode-item">
          <span class="sim-mode-item-label">수능</span>
          <span class="sim-mode-item-value" style="font-size:13px">${simResult.score.toFixed(1)}</span>
          ${Math.abs(suneungDelta) > 0.05 ? `<span style="font-size:10px;color:${suneungDelta >= 0 ? 'var(--green)' : 'var(--red)'}">${suneungDelta >= 0 ? '+' : ''}${suneungDelta.toFixed(1)}</span>` : ''}
        </div>
        ${sportsChanged > 0 ? `
        <div style="font-size:10px;color:var(--muted)">+</div>
        <div class="sim-mode-item">
          <span class="sim-mode-item-label">실기추정</span>
          <span class="sim-mode-item-value" style="font-size:13px;color:var(--purple)">${totalEst.sportsScore.toFixed(1)}</span>
        </div>
        ` : `
        <div style="font-size:10px;color:var(--muted)">+</div>
        <div class="sim-mode-item">
          <span class="sim-mode-item-label">실기추정</span>
          <span class="sim-mode-item-value" style="font-size:13px;color:var(--purple)">${totalEst.sportsScore.toFixed(1)}</span>
        </div>
        `}
        <div style="font-size:10px;color:var(--muted)">=</div>
        <div class="sim-mode-item">
          <span class="sim-mode-item-label">추정총점</span>
          <span class="sim-mode-item-value" style="font-size:15px;color:var(--text)">${totalEst.totalScore.toFixed(1)}</span>
        </div>
        ${hasCutlineTotal ? `<div class="sim-mode-delta ${totalEst.diff >= 0 ? 'positive' : 'negative'}">
          합격선대비 ${totalEst.diff >= 0 ? '+' : ''}${totalEst.diff.toFixed(1)}
        </div>` : ''}
        ${sportsChanged > 0 ? `<div style="padding:3px 8px;background:rgba(187,134,252,0.12);border-radius:6px;font-size:10px;color:var(--purple);font-weight:700;white-space:nowrap">
          <i class="fas fa-running" style="margin-right:3px"></i>${sportsChanged}개 조정
        </div>` : ''}
        <span class="badge badge-${s}" style="margin-left:4px">${displayStatus}</span>
      </div>
      <div class="sim-mode-actions">
        <button class="sim-mode-btn reset" id="btn-sim-reset" title="원래 점수로 되돌리기">
          <i class="fas fa-undo"></i> 초기화
        </button>
        <button class="sim-mode-btn save" id="btn-sim-save" title="조정 점수를 새 기준으로 저장">
          <i class="fas fa-save"></i> 저장
        </button>
        <button class="sim-mode-btn exit" id="btn-sim-exit" title="시뮬레이션 종료">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>`;
}

// ── 수능 + 실기 좌우 듀얼 패널 (시뮬레이션 모드) ──
function renderDualSimPanel(u, simEvents, simKor, simMath, simEng, simInq1, simInq2, simHks, baseKor, baseMath, baseEng, baseInq1, baseInq2, baseHks, simKorRaw, simMathRaw, simInq1Raw, simInq2Raw) {
  // 기준 원점수 (원본 입력값)
  const baseKorRaw = state.student.korean.raw || 0;
  const baseMathRaw = state.student.math.raw || 0;
  const baseInq1Raw = state.student.inquiry1.raw || 0;
  const baseInq2Raw = state.student.inquiry2.raw || 0;

  return `
  <div class="dual-sim-panel">
    <!-- 좌측: 수능 점수 조정 패널 -->
    <div class="sim-suneung-card">
      <div style="font-size:13px;font-weight:800;color:#00D4FF;letter-spacing:1px;margin-bottom:20px">
        <i class="fas fa-graduation-cap" style="margin-right:6px"></i> 수능 점수 조정
        <span style="font-size:10px;color:var(--muted);font-weight:400;margin-left:8px">원점수 슬라이더로 조정하세요</span>
      </div>
      
      <!-- 국어 원점수 -->
      ${renderSimRawSlider('korean', '국어', state.student.korean.subject, simKorRaw, baseKorRaw, simKor, baseKor, 0, 100, 1, 'fa-book', '#00D4FF')}
      
      <!-- 수학 원점수 -->
      ${renderSimRawSlider('math', '수학', state.student.math.subject, simMathRaw, baseMathRaw, simMath, baseMath, 0, 100, 1, 'fa-calculator', 'var(--purple)')}
      
      <!-- 영어 등급 -->
      <div class="sim-suneung-item">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px">
            <i class="fas fa-globe" style="color:var(--yellow);font-size:11px"></i>
            <span style="font-size:12px;font-weight:700;color:var(--text)">영어 등급</span>
          </div>
          ${simEng !== baseEng ? `<span style="font-size:11px;font-weight:700;color:${simEng < baseEng ? '#00E676' : '#FF1744'}">${baseEng}등급 → ${simEng}등급 (${simEng < baseEng ? '' : '+'}${simEng - baseEng})</span>` : `<span style="font-size:11px;color:var(--muted)">${simEng}등급</span>`}
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          ${[1,2,3,4,5,6,7,8,9].map(g => `
            <button class="sim-grade-btn ${g === simEng ? 'active' : ''} ${g === simEng && g !== baseEng ? (g < baseEng ? 'better' : 'worse') : ''}"
              data-sim-eng-grade="${g}"
              style="flex:1;min-width:28px;padding:6px 0;border-radius:6px;border:1px solid ${g === simEng ? '#00D4FF' : 'var(--border)'};background:${g === simEng ? 'rgba(0,212,255,0.15)' : 'var(--surface)'};color:${g === simEng ? '#00D4FF' : 'var(--muted)'};font-size:12px;font-weight:${g === simEng ? '800' : '500'};cursor:pointer;transition:all 0.2s;text-align:center">
              ${g}
            </button>
          `).join('')}
        </div>
      </div>
      
      <!-- 탐구1 원점수 -->
      ${renderSimRawSlider('inquiry1', '탐구1', state.student.inquiry1.subject, simInq1Raw, baseInq1Raw, simInq1, baseInq1, 0, 50, 1, 'fa-flask', 'var(--green)')}
      
      <!-- 탐구2 원점수 -->
      ${renderSimRawSlider('inquiry2', '탐구2', state.student.inquiry2.subject, simInq2Raw, baseInq2Raw, simInq2, baseInq2, 0, 50, 1, 'fa-flask', 'var(--green)')}
      
      <!-- 한국사 등급 -->
      <div class="sim-suneung-item">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px">
            <i class="fas fa-flag" style="color:var(--orange);font-size:11px"></i>
            <span style="font-size:12px;font-weight:700;color:var(--text)">한국사 등급</span>
          </div>
          ${simHks !== baseHks ? `<span style="font-size:11px;font-weight:700;color:${simHks < baseHks ? '#00E676' : '#FF1744'}">${baseHks}등급 → ${simHks}등급 (${simHks < baseHks ? '' : '+'}${simHks - baseHks})</span>` : `<span style="font-size:11px;color:var(--muted)">${simHks}등급</span>`}
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          ${[1,2,3,4,5,6,7,8,9].map(g => `
            <button class="sim-grade-btn ${g === simHks ? 'active' : ''}"
              data-sim-hks-grade="${g}"
              style="flex:1;min-width:28px;padding:6px 0;border-radius:6px;border:1px solid ${g === simHks ? 'var(--orange)' : 'var(--border)'};background:${g === simHks ? 'rgba(255,109,0,0.15)' : 'var(--surface)'};color:${g === simHks ? 'var(--orange)' : 'var(--muted)'};font-size:12px;font-weight:${g === simHks ? '800' : '500'};cursor:pointer;transition:all 0.2s;text-align:center">
              ${g}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
    
    <!-- 우측: 실기 시뮬레이터 -->
    <div class="card sim-panel-right">
      <div style="font-size:12px;font-weight:800;color:var(--purple);letter-spacing:1px;margin-bottom:20px">
        <i class="fas fa-gamepad" style="margin-right:6px"></i> 실기 시뮬레이터 (${simEvents.length}개 종목)
        <span style="font-size:10px;color:var(--muted);font-weight:400;margin-left:8px">슬라이더로 기록을 조정하세요</span>
        <span id="sports-change-summary" style="display:none;font-size:10px;font-weight:700;color:var(--purple);margin-left:8px;padding:2px 8px;background:rgba(187,134,252,0.1);border-radius:4px"></span>
      </div>
      <div class="sim-grid-compact">
        ${simEvents.map(e => renderSimSlider(e)).join('')}
      </div>
      ${u.sports_max > 0 ? `<div style="margin-top:16px;padding:10px 14px;background:var(--surface);border-radius:8px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;color:var(--muted)">실기 만점: <strong style="color:var(--purple)">${u.sports_max.toFixed(1)}점</strong></span>
        <span style="font-size:11px;color:var(--muted)">수능비율: ${(u.suneung_ratio * 100).toFixed(0)}% · 실기비율: ${(u.sports_ratio * 100).toFixed(0)}%</span>
      </div>` : ''}
    </div>
  </div>`;
}

// ── 시뮬레이션 원점수 슬라이더 렌더 ──
function renderSimRawSlider(area, label, subject, rawValue, baseRaw, stdValue, baseStd, min, max, step, icon, color) {
  const stdDiff = stdValue - baseStd;
  const rawPct = ((rawValue - min) / (max - min)) * 100;
  const baseRawPct = ((baseRaw - min) / (max - min)) * 100;
  const isAbove = stdValue > baseStd;
  const isBelow = stdValue < baseStd;

  let sliderAccent = '#555';
  if (isAbove) sliderAccent = '#00E676';
  if (isBelow) sliderAccent = '#FF1744';

  const deltaHtml = stdDiff !== 0 
    ? `<span style="font-size:12px;font-weight:800;color:${stdDiff > 0 ? '#00E676' : '#FF1744'}">${baseStd} → ${stdValue} (${stdDiff > 0 ? '+' : ''}${stdDiff})</span>`
    : `<span style="font-size:12px;color:var(--muted)">표준 ${stdValue}</span>`;

  return `
  <div class="sim-suneung-item">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
      <div style="display:flex;align-items:center;gap:6px">
        <i class="fas ${icon}" style="color:${color};font-size:11px"></i>
        <span style="font-size:12px;font-weight:700;color:var(--text)">${label}</span>
        <span style="font-size:10px;color:var(--muted);font-weight:400">(${subject})</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:18px;font-weight:900;color:${isAbove ? '#00E676' : isBelow ? '#FF1744' : 'var(--text)'}" id="sim-raw-${area}">${rawValue}</span>
        <span style="font-size:10px;color:var(--muted)">점</span>
      </div>
    </div>
    <div style="margin-bottom:4px">
      ${deltaHtml}
    </div>
    <div style="position:relative;margin:6px 0">
      ${baseRaw > min && baseRaw < max ? `<div style="position:absolute;left:${baseRawPct}%;top:0;bottom:0;width:2px;background:rgba(255,255,255,0.2);transform:translateX(-1px);z-index:1;border-radius:1px" title="기준: ${baseRaw}"></div>` : ''}
      <input type="range" min="${min}" max="${max}" step="${step}" value="${rawValue}" 
        data-sim-raw="${area}"
        class="suneung-range ${isAbove ? 'range-above' : ''} ${isBelow ? 'range-below' : ''}"
        style="width:100%;--slider-accent:${sliderAccent}"
      >
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:1px">
      <span>${min}</span>
      <span>${max}</span>
    </div>
  </div>`;
}

// ── 실기만 단독 패널 (비시뮬레이션 모드) ──
function renderSportsOnlyPanel(u, simEvents) {
  if (simEvents.length === 0) return '';
  return `
  <div class="card" style="margin-top:4px">
    <div style="font-size:12px;font-weight:800;color:var(--purple);letter-spacing:1px;margin-bottom:20px">
      <i class="fas fa-gamepad" style="margin-right:6px"></i> 실기 시뮬레이터 (${simEvents.length}개 종목)
      <span style="font-size:10px;color:var(--muted);font-weight:400;margin-left:8px">슬라이더로 기록을 조정하세요</span>
      <span id="sports-change-summary" style="display:none;font-size:10px;font-weight:700;color:var(--purple);margin-left:8px;padding:2px 8px;background:rgba(187,134,252,0.1);border-radius:4px"></span>
    </div>
    <div class="sim-grid">
      ${simEvents.map(e => renderSimSlider(e)).join('')}
    </div>
    ${u.sports_max > 0 ? `<div style="margin-top:16px;padding:10px 14px;background:var(--surface);border-radius:8px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:11px;color:var(--muted)">실기 만점: <strong style="color:var(--purple)">${u.sports_max.toFixed(1)}점</strong></span>
      <span style="font-size:11px;color:var(--muted)">수능비율: ${(u.suneung_ratio * 100).toFixed(0)}% · 실기비율: ${(u.sports_ratio * 100).toFixed(0)}%</span>
    </div>` : ''}
  </div>`;
}

// ── 수능 슬라이더 렌더 ──
function renderSuneungSlider(key, label, value, baseValue, min, max, step, icon, color) {
  const diff = value - baseValue;
  const pct = ((value - min) / (max - min)) * 100;
  const basePct = ((baseValue - min) / (max - min)) * 100;
  const isAbove = value > baseValue;
  const isBelow = value < baseValue;

  let trackColor = 'var(--surface)';
  let thumbColor = 'rgba(200,210,220,0.7)';
  if (isAbove) { trackColor = 'rgba(0,230,118,0.2)'; thumbColor = 'var(--green)'; }
  if (isBelow) { trackColor = 'rgba(255,23,68,0.2)'; thumbColor = 'var(--red)'; }

  return `
  <div class="suneung-slider-item">
    <div class="suneung-slider-header">
      <div style="display:flex;align-items:center;gap:6px">
        <i class="fas ${icon}" style="color:${color};font-size:11px"></i>
        <span style="font-size:12px;font-weight:700;color:var(--text)">${label}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="suneung-value ${isAbove ? 'above' : ''} ${isBelow ? 'below' : ''}" id="sim-${key}">${value}</span>
        ${diff !== 0 ? `<span class="sim-delta ${diff > 0 ? 'positive' : 'negative'}">${diff > 0 ? '+' : ''}${diff}</span>` : ''}
      </div>
    </div>
    <div class="suneung-slider-track">
      ${baseValue > min && baseValue < max ? `<div class="suneung-slider-base" style="left:${basePct}%" title="기준: ${baseValue}"></div>` : ''}
      <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" 
        data-suneung="${key}"
        class="suneung-range ${isAbove ? 'range-above' : ''} ${isBelow ? 'range-below' : ''}"
      >
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px">
      <span>${min}</span>
      <span>${max}</span>
    </div>
  </div>`;
}

function renderSimSlider(e) {
  const decimals = e.step < 1 ? 1 : 0;
  const val = e.currentVal;
  const base = e.baseVal !== undefined ? e.baseVal : val;
  const hasValue = val > 0;
  const diff = val - base;
  const hasDiff = Math.abs(diff) > (e.step < 1 ? 0.05 : 0.5);
  // direction: 'lower' = 낮을수록 좋음, 그 외 = 높을수록 좋음
  const isGood = e.direction === 'lower' ? diff < 0 : diff > 0;
  const diffColor = hasDiff ? (isGood ? 'var(--green)' : 'var(--red)') : 'var(--muted)';
  const diffSign = diff > 0 ? '+' : '';
  
  // 슬라이더 accent color: 기준값 대비
  const sliderColor = hasDiff ? (isGood ? '#00e676' : '#ff5252') : 'var(--purple)';

  return `
  <div class="sim-item">
    <div class="slider-header">
      <div style="font-size:12px;font-weight:700;color:var(--text)">${e.label || e.key}</div>
      <div style="display:flex;align-items:baseline;gap:3px">
        <span style="font-size:20px;font-weight:900;color:${hasValue ? (hasDiff ? diffColor : 'var(--purple)') : 'var(--muted)'}" id="sim-${e.key}">${Number(val).toFixed(decimals)}</span>
        <span style="font-size:11px;color:var(--muted)">${e.unit}</span>
        ${hasDiff ? `<span id="sim-delta-${e.key}" style="font-size:11px;font-weight:700;color:${diffColor};margin-left:4px">(${diffSign}${diff.toFixed(decimals)})</span>` : `<span id="sim-delta-${e.key}" style="font-size:11px;color:transparent"></span>`}
      </div>
    </div>
    ${base > 0 ? `<div style="font-size:10px;color:var(--muted);margin-bottom:2px">기준: ${Number(base).toFixed(decimals)}${e.unit}</div>` : ''}
    <input type="range" min="${e.min}" max="${e.max}" step="${e.step}" value="${val}" data-sim="${e.key}" data-base="${base}" data-direction="${e.direction || 'higher'}" style="accent-color:${sliderColor}">
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:4px">
      <span>${e.min}${e.unit}</span>
      <span>${e.max}${e.unit}</span>
    </div>
  </div>`;
}

// ── 합격선 갭 분석 렌더 ──
function renderCutlineGapAdvice(advice) {
  if (!advice) {
    return `<div style="margin-bottom:14px;padding:10px 14px;background:var(--surface);border-radius:8px;font-size:12px;color:var(--muted);line-height:1.6">
      <i class="fas fa-info-circle" style="margin-right:4px;color:var(--accent)"></i>
      커트라인 미공개 학교입니다. 소신 지원으로 분류됩니다.
    </div>`;
  }

  let html = '';

  if (advice.type === 'above') {
    html += `
    <div style="margin-bottom:14px;padding:12px 16px;background:rgba(0,230,118,0.06);border-radius:10px;border:1px solid rgba(0,230,118,0.2);font-size:12px;color:var(--green);line-height:1.8">
      <i class="fas fa-check-circle" style="margin-right:6px;font-size:14px"></i>
      ${advice.message}
    </div>`;
  } else {
    html += `
    <div style="margin-bottom:14px;padding:12px 16px;background:rgba(255,109,0,0.06);border-radius:10px;border:1px solid rgba(255,109,0,0.2);font-size:12px;color:var(--orange);line-height:1.8">
      <i class="fas fa-exclamation-triangle" style="margin-right:6px;font-size:14px"></i>
      ${advice.message}
    </div>`;

    if (advice.suggestions.length > 0) {
      html += `
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:10px;letter-spacing:0.5px">
          <i class="fas fa-lightbulb" style="margin-right:4px"></i> 효율적인 점수 올리기 추천 (기여도순)
        </div>
        <div class="advice-grid">
          ${advice.suggestions.map((sug, i) => `
            <div class="advice-card">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="width:22px;height:22px;border-radius:50%;background:${sug.color}22;color:${sug.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;border:1px solid ${sug.color}44">${i + 1}</span>
                <i class="fas ${sug.icon}" style="color:${sug.color};font-size:13px"></i>
                <span style="font-size:11px;font-weight:700;color:var(--text)">${sug.area}</span>
              </div>
              <div style="font-size:12px;color:var(--text);line-height:1.6;margin-bottom:6px">${sug.action}</div>
              <div style="font-size:10px;color:var(--muted)">
                환산점수 <strong style="color:${sug.color}">+${sug.totalGain.toFixed(1)}</strong> · 
                1단위당 <strong style="color:var(--text)">+${sug.gainPerStep.toFixed(2)}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
    }
  }

  return html;
}

// ── 실시간 역산 결과 렌더링 (전체 총점 기준) ──
function renderLiveAdvice(univ) {
  if (!univ) return '';
  const totalEst = calcTotalEstimate(univ);
  const cutline = univ.cutline_total || 0;
  if (cutline <= 0) {
    return `<div style="margin-bottom:14px;padding:10px 14px;background:var(--surface);border-radius:8px;font-size:12px;color:var(--muted);line-height:1.6">
      <i class="fas fa-info-circle" style="margin-right:4px;color:var(--accent)"></i>
      커트라인 미공개 학교입니다. 소신 지원으로 분류됩니다.
    </div>`;
  }

  const totalScore = totalEst.totalScore;
  const diff = totalScore - cutline;

  // ▶ 합격권인 경우
  if (diff >= 0) {
    return `
    <div style="margin-bottom:14px;padding:12px 16px;background:rgba(0,230,118,0.06);border-radius:10px;border:1px solid rgba(0,230,118,0.2);font-size:12px;color:var(--green);line-height:1.8">
      <i class="fas fa-check-circle" style="margin-right:6px;font-size:14px"></i>
      현재 총점이 합격선보다 <strong>${diff.toFixed(1)}점</strong> 높습니다. ✅<br>
      현재 상태를 유지하면 합격권입니다.
    </div>`;
  }

  // ▶ 부족한 경우 — 효율적인 방법 TOP 3
  const needed = Math.abs(diff);
  const student = getSimStudent();
  const impacts = [];

  // 수능 과목별: 원점수 1점 변화 → 표준점수 변화 → 총점 기여도 계산
  const suneungAreas = [
    { area: 'korean', label: '국어', icon: 'fa-book', color: '#00D4FF', stdKey: 'koreanStd', rawKey: 'koreanRaw', maxRaw: 100 },
    { area: 'math', label: '수학', icon: 'fa-calculator', color: 'var(--purple)', stdKey: 'mathStd', rawKey: 'mathRaw', maxRaw: 100 },
    { area: 'inquiry1', label: '탐구1', icon: 'fa-flask', color: 'var(--green)', stdKey: 'inq1Std', rawKey: 'inq1Raw', maxRaw: 50 },
    { area: 'inquiry2', label: '탐구2', icon: 'fa-flask', color: 'var(--green)', stdKey: 'inq2Std', rawKey: 'inq2Raw', maxRaw: 50 }
  ];

  for (const s of suneungAreas) {
    const curRaw = state.simSuneung ? (state.simSuneung[s.rawKey] !== undefined ? state.simSuneung[s.rawKey] : (state.student[s.area].raw || 0)) : (state.student[s.area].raw || 0);
    const curStd = state.simSuneung ? state.simSuneung[s.stdKey] : state.student[s.area].standard;
    if (curRaw >= s.maxRaw) continue; // 이미 만점

    const subject = state.student[s.area].subject;
    // 원점수 +1 했을 때 표준점수 변화량
    const nextStd = rawToStandard(subject, curRaw + 1);
    if (nextStd === null) continue;
    const stdDelta = nextStd - curStd;
    if (stdDelta <= 0) continue;

    // 표준점수 +stdDelta가 총점에 미치는 영향 계산
    // 학생 복사 후 표준점수만 변경하여 총점 차이 산출
    const modStudent = JSON.parse(JSON.stringify(student));
    modStudent[s.area].standard = nextStd;
    const modSuneung = calcSuneungLocal(modStudent, univ);
    const modTotal = modSuneung + totalEst.sportsScore;
    const totalDelta = modTotal - totalScore;

    if (totalDelta <= 0) continue;

    const headroom = s.maxRaw - curRaw;
    const stepsNeeded = Math.min(Math.ceil(needed / totalDelta), headroom);

    impacts.push({
      type: 'suneung',
      area: s.area,
      label: s.label,
      icon: s.icon,
      color: s.color,
      subject,
      curRaw,
      rawDelta: 1,
      stdDelta,
      totalDeltaPerUnit: totalDelta,
      stepsNeeded,
      totalGain: stepsNeeded * totalDelta,
      desc: `${s.label} 원점수 +${stepsNeeded}점`,
      detail: `→ 표준점수 +${(stepsNeeded * stdDelta).toFixed(0)}점 → 총점 +${(stepsNeeded * totalDelta).toFixed(1)}점 효과`
    });
  }

  // 영어 등급 개선
  if (univ.english_yn && univ.english_grade_scores && univ.english_grade_scores.length >= 9) {
    const curGrade = student.english.grade;
    if (curGrade > 1) {
      const modStudent2 = JSON.parse(JSON.stringify(student));
      modStudent2.english.grade = curGrade - 1;
      const modSuneung2 = calcSuneungLocal(modStudent2, univ);
      const modTotal2 = modSuneung2 + totalEst.sportsScore;
      const totalDelta2 = modTotal2 - totalScore;
      if (totalDelta2 > 0) {
        impacts.push({
          type: 'grade',
          label: '영어',
          icon: 'fa-globe',
          color: 'var(--yellow)',
          totalDeltaPerUnit: totalDelta2,
          stepsNeeded: 1,
          totalGain: totalDelta2,
          desc: `영어 ${curGrade}등급 → ${curGrade - 1}등급`,
          detail: `→ 총점 +${totalDelta2.toFixed(1)}점 효과`
        });
      }
    }
  }

  // 실기 종목별: 1단위 변화 → 총점 기여도
  if (univ.sports_events && univ.sports_total > 0) {
    for (const eventName of univ.sports_events) {
      const field = findSportsField(eventName);
      const curVal = state.simSports[eventName] !== undefined ? state.simSports[eventName] : (state.student.sports[eventName] || state.student.sports[field.key] || 0);
      const step = field.step || 1;

      // 1단위(step) 변화 시 총점 변화 시뮬레이션
      const newVal = field.direction === 'lower' ? curVal - step : curVal + step;
      // 범위 체크
      if (field.direction === 'lower' && newVal < field.min) continue;
      if (field.direction !== 'lower' && newVal > field.max) continue;

      const savedSimSport = state.simSports[eventName];
      state.simSports[eventName] = newVal;
      const modTotalEst = calcTotalEstimate(univ);
      // 복원
      if (savedSimSport !== undefined) state.simSports[eventName] = savedSimSport;
      else delete state.simSports[eventName];

      const sportsDelta = modTotalEst.totalScore - totalScore;
      if (sportsDelta <= 0.01) continue;

      const headroom = field.direction === 'lower' ? Math.floor((curVal - field.min) / step) : Math.floor((field.max - curVal) / step);
      if (headroom <= 0) continue;
      const stepsNeeded = Math.min(Math.ceil(needed / sportsDelta), headroom);

      impacts.push({
        type: 'sports',
        label: field.label || eventName,
        icon: 'fa-running',
        color: 'var(--purple)',
        totalDeltaPerUnit: sportsDelta,
        stepsNeeded,
        totalGain: stepsNeeded * sportsDelta,
        curVal,
        step,
        unit: field.unit,
        direction: field.direction,
        desc: `${field.label || eventName} ${field.direction === 'lower' ? '-' : '+'}${(stepsNeeded * step).toFixed(step < 1 ? 1 : 0)}${field.unit}`,
        detail: `(현재 ${curVal.toFixed(step < 1 ? 1 : 0)} → ${(field.direction === 'lower' ? curVal - stepsNeeded * step : curVal + stepsNeeded * step).toFixed(step < 1 ? 1 : 0)}) → 총점 +${(stepsNeeded * sportsDelta).toFixed(1)}점 효과`
      });
    }
  }

  // 기여도순 정렬 → TOP 3
  impacts.sort((a, b) => b.totalDeltaPerUnit - a.totalDeltaPerUnit);
  const top3 = impacts.slice(0, 3);

  let html = `
  <div style="margin-bottom:14px;padding:12px 16px;background:rgba(255,109,0,0.06);border-radius:10px;border:1px solid rgba(255,109,0,0.2);font-size:12px;color:var(--orange);line-height:1.8">
    <i class="fas fa-exclamation-triangle" style="margin-right:6px;font-size:14px"></i>
    합격하려면 <strong>${needed.toFixed(1)}점</strong>이 더 필요합니다.<br>
    아래 중 가장 효율적인 방법을 선택하세요:
  </div>`;

  if (top3.length > 0) {
    html += `<div class="advice-grid">`;
    top3.forEach((item, i) => {
      html += `
      <div class="advice-card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="width:22px;height:22px;border-radius:50%;background:${item.color}22;color:${item.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;border:1px solid ${item.color}44">${i + 1}</span>
          <i class="fas ${item.icon}" style="color:${item.color};font-size:13px"></i>
          <span style="font-size:11px;font-weight:700;color:var(--text)">${item.label}</span>
        </div>
        <div style="font-size:12px;color:var(--text);line-height:1.6;margin-bottom:6px">${item.desc}</div>
        <div style="font-size:11px;color:var(--muted);line-height:1.5">${item.detail}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">
          1단위당 총점 <strong style="color:${item.color}">+${item.totalDeltaPerUnit.toFixed(2)}</strong>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  return html;
}


// ════════════════════════════════════════════
// ═══ 화면 4: 관리자 패널 ═══
// ════════════════════════════════════════════
function renderAdmin() {
  if (!state.admin.loggedIn) {
    return `
    <div class="admin-login">
      <div style="font-size:40px;margin-bottom:16px"><i class="fas fa-lock" style="color:var(--accent)"></i></div>
      <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:8px">관리자 로그인</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:24px">입시요강 데이터를 관리하려면 비밀번호를 입력하세요.</div>
      <div style="margin-bottom:16px">
        <input type="password" id="admin-pw" placeholder="비밀번호" style="width:100%;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;outline:none;font-family:inherit">
      </div>
      <button id="btn-admin-login" style="width:100%;padding:12px;border-radius:8px;border:none;background:var(--accent);color:#000;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;transition:all 0.2s">
        <i class="fas fa-sign-in-alt"></i> 로그인
      </button>
      <div style="margin-top:16px;font-size:10px;color:var(--muted)">기본 비밀번호: k1sports</div>
    </div>`;
  }

  return `
  <div class="section-title" style="margin-top:24px"><span>대학 데이터 관리</span></div>
  <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
    <div class="search-wrap">
      <i class="fas fa-search"></i>
      <input type="text" class="search-input" placeholder="대학명 검색..." id="admin-search" style="width:200px">
    </div>
    <div style="flex:1"></div>
    <span style="font-size:11px;color:var(--muted)" id="admin-count">전체 ${state.admin.universities ? state.admin.universities.length : '...'}개 대학</span>
    <button id="btn-admin-logout" class="admin-btn" style="color:var(--red);border-color:rgba(255,23,68,0.3)">
      <i class="fas fa-sign-out-alt"></i> 로그아웃
    </button>
  </div>
  <div class="admin-table-wrap" style="max-height:600px;overflow-y:auto">
    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>대학교</th>
          <th>학과</th>
          <th>군</th>
          <th>지역</th>
          <th>유형</th>
          <th>모집</th>
          <th>경쟁률</th>
          <th>수능비율</th>
          <th>활용지표</th>
          <th>실기종목</th>
          <th>커트라인</th>
        </tr>
      </thead>
      <tbody id="admin-tbody">
        ${renderAdminRows()}
      </tbody>
    </table>
  </div>`;
}

function renderAdminRows(searchQuery) {
  if (!state.admin.universities) return '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--muted)">데이터 로딩 중...</td></tr>';
  
  let data = state.admin.universities;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    data = data.filter(u => u.university.toLowerCase().includes(q) || u.department.toLowerCase().includes(q));
  }
  
  return data.map(u => `
    <tr>
      <td style="color:var(--muted)">${u.id}</td>
      <td style="font-weight:700">${u.university}</td>
      <td>${u.department}</td>
      <td><span style="color:${u.group === '가군' ? 'var(--accent)' : u.group === '나군' ? 'var(--purple)' : 'var(--green)'};font-weight:600">${u.group}</span></td>
      <td>${u.location || '-'}</td>
      <td>${u.univ_type || '-'}</td>
      <td>${u.capacity || '-'}</td>
      <td>${u.competition_rate > 0 ? u.competition_rate.toFixed(1) : '-'}</td>
      <td>${(u.suneung_ratio * 100).toFixed(0)}%</td>
      <td style="font-size:10px">${u.score_method || '-'}</td>
      <td style="font-size:10px">${u.sports_events ? u.sports_events.join(', ') : '-'}</td>
      <td style="font-weight:700;color:var(--accent)">${u.cutline_suneung > 0 ? u.cutline_suneung.toFixed(1) : '-'}</td>
    </tr>
  `).join('');
}

function renderDisclaimer() {
  return `
  <div class="disclaimer">
    <i class="fas fa-exclamation-triangle" style="color:var(--yellow);margin-right:4px"></i>
    본 결과는 <strong>참고용</strong>이며, 실제 합격 여부와 다를 수 있습니다.<br>
    정확한 정보는 각 대학 입학처에 문의하시기 바랍니다.<br>
    <span style="color:var(--accent);margin-top:4px;display:inline-block">&copy; 2026 K1 SPORTS 체대입시 컨설팅</span>
  </div>`;
}

// ════════════════════════════════════════════
// ═══ 실시간 업데이트 (DOM 부분 교체) ═══
// ════════════════════════════════════════════
function updateDetailScores() {
  const u = state.selectedUniv;
  if (!u || state.tab !== 'detail') return;

  const sim = state.simSuneung;
  const simResult = sim ? calcSimScore() : null;
  const currentScore = sim ? simResult.score : u.my_suneung_score;
  const currentDiff = sim ? simResult.diff : u.diff;
  const currentStatus = sim ? simResult.status : u.status;
  const statusMap = { '지원가능': '가능', '소신지원': '소신', '지원위험': '위험', '지원불가': '불가' };
  const s = statusMap[currentStatus];

  // 내 수능 환산 점수 업데이트
  const scoreEl = document.getElementById('detail-my-score');
  if (scoreEl) {
    scoreEl.textContent = currentScore.toFixed(1);
  }

  // 차이 업데이트
  const diffEl = document.getElementById('detail-diff');
  if (diffEl) {
    diffEl.textContent = (currentDiff >= 0 ? '+' : '') + currentDiff.toFixed(1);
    diffEl.style.color = currentDiff >= 0 ? 'var(--green)' : 'var(--red)';
  }

  // 배지 업데이트
  const badgeEl = document.getElementById('detail-badge');
  if (badgeEl) {
    badgeEl.textContent = currentStatus;
    badgeEl.className = `badge badge-${s} badge-lg`;
  }

  // 실기 변경 종목 정보 업데이트
  const sportsChanged = Object.keys(state.simSports).filter(k => {
    const base = state.student.sports[k] || 0;
    return Math.abs(state.simSports[k] - base) > 0.01;
  }).length;

  // 실기 변경 요약 배지 업데이트
  const sportsSummaryEl = document.getElementById('sports-change-summary');
  if (sportsSummaryEl) {
    if (sportsChanged > 0) {
      sportsSummaryEl.innerHTML = `<i class="fas fa-running" style="margin-right:3px"></i>실기 ${sportsChanged}개 종목 조정됨`;
      sportsSummaryEl.style.display = 'inline-block';
    } else {
      sportsSummaryEl.style.display = 'none';
    }
  }

  // 시뮬레이션 바 업데이트 (있으면)
  const simBar = document.querySelector('.sim-mode-bar');
  if (simBar && sim) {
    const baseScore = state.simBaseScore || u.my_suneung_score;
    const delta = currentScore - baseScore;
    simBar.outerHTML = renderSimBar(u);
    // 리바인드 시뮬레이션 바 버튼
    bindSimBarEvents();
  }

  // ── 전체 총점 추정 실시간 업데이트 ──
  const totalEst = calcTotalEstimate(u);
  const hasCutlineTotal = u.cutline_total > 0;

  const totalSuneungEl = document.getElementById('detail-total-suneung');
  if (totalSuneungEl) totalSuneungEl.textContent = totalEst.suneungScore.toFixed(1);

  const totalSportsEl = document.getElementById('detail-total-sports');
  if (totalSportsEl) {
    totalSportsEl.textContent = totalEst.sportsScore.toFixed(1);
    // 실기 추정 비율도 업데이트
    const parentLabel = totalSportsEl.closest('.compare-stats > div');
    if (parentLabel) {
      const labelEl = parentLabel.querySelector('.compare-label');
      if (labelEl) labelEl.innerHTML = `실기 추정 <span style="font-size:9px">(${Math.round(totalEst.sportsRatio * 100)}%)</span>`;
    }
  }

  const totalScoreEl = document.getElementById('detail-total-score');
  if (totalScoreEl) totalScoreEl.textContent = totalEst.totalScore.toFixed(1);

  const totalDiffEl = document.getElementById('detail-total-diff');
  if (totalDiffEl) {
    totalDiffEl.textContent = hasCutlineTotal ? (totalEst.diff >= 0 ? '+' : '') + totalEst.diff.toFixed(1) : '-';
    totalDiffEl.style.color = totalEst.diff >= 0 ? 'var(--green)' : 'var(--red)';
  }

  // 전체 총점 기준으로 배지도 업데이트 (수능 커트라인이 없고 총점 커트라인이 있는 경우)
  if (hasCutlineTotal && (u.cutline_suneung <= 0)) {
    const totalStatus = totalEst.status;
    const ts = statusMap[totalStatus];
    if (badgeEl) {
      badgeEl.textContent = totalStatus;
      badgeEl.className = `badge badge-${ts} badge-lg`;
    }
  }

  // ── 바 그래프 위치 실시간 업데이트 ──
  // 수능 환산점수 vs 커트라인 바
  const maxRef = Math.max(u.suneung_total, u.cutline_suneung || 0, currentScore || 0) * 1.1;
  const myPct = Math.min((currentScore / maxRef) * 100, 100);
  const suneungBarFill = document.querySelector('#detail-compare-stats')?.closest('.card')?.querySelector('.compare-bar-fill');
  if (suneungBarFill) {
    suneungBarFill.style.width = myPct + '%';
  }

  // 전체 총점 바
  const totalMax = u.suneung_total + u.sports_total;
  const totalMyPct = totalMax > 0 ? Math.min((totalEst.totalScore / totalMax) * 100, 100) : 0;
  const totalBarFill = document.querySelector('#detail-total-stats')?.closest('.card')?.querySelector('.compare-bar-fill');
  if (totalBarFill) {
    totalBarFill.style.width = totalMyPct + '%';
  }

  // 전체 총점 기준 합불 배지 업데이트 (총점 커트라인이 있는 경우)
  if (hasCutlineTotal) {
    const totalStatus = totalEst.status;
    const ts = statusMap[totalStatus];
    const totalBadge = document.getElementById('detail-badge');
    if (totalBadge) {
      totalBadge.textContent = totalStatus;
      totalBadge.className = `badge badge-${ts} badge-lg`;
    }
  }

  // ── 역산 결과 실시간 갱신 ──
  const reversalEl = document.getElementById('reversal-advice-content');
  if (reversalEl) {
    reversalEl.innerHTML = renderLiveAdvice(u);
  }
}

function bindSimBarEvents() {
  const btnReset = document.getElementById('btn-sim-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      // 원래 입력 점수로 복원
      state.simSuneung = {
        koreanStd: state.student.korean.standard,
        mathStd: state.student.math.standard,
        engGrade: state.student.english.grade,
        inq1Std: state.student.inquiry1.standard,
        inq2Std: state.student.inquiry2.standard,
        hanksaGrade: state.student.hanksa.grade,
        koreanRaw: state.student.korean.raw || 0,
        mathRaw: state.student.math.raw || 0,
        inq1Raw: state.student.inquiry1.raw || 0,
        inq2Raw: state.student.inquiry2.raw || 0
      };
      state.simSports = {};
      showToast('슬라이더가 원래 점수로 초기화되었습니다.');
      render();
    });
  }
  const btnSave = document.getElementById('btn-sim-save');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const sim = state.simSuneung;
      if (!sim) return;
      // 조정된 점수를 기본 학생 데이터에 저장
      state.student.korean.standard = sim.koreanStd;
      state.student.math.standard = sim.mathStd;
      state.student.english.grade = sim.engGrade;
      state.student.inquiry1.standard = sim.inq1Std;
      state.student.inquiry2.standard = sim.inq2Std;
      state.student.hanksa.grade = sim.hanksaGrade;
      // 시뮬레이션 기준점도 현재 점수로 갱신
      const u = state.selectedUniv;
      if (u) {
        state.simBaseScore = calcSuneungLocal(getSimStudent(), u);
      }
      showToast('조정된 점수가 새로운 기준으로 저장되었습니다!');
      render();
    });
  }
  const btnExit = document.getElementById('btn-sim-exit');
  if (btnExit) {
    btnExit.addEventListener('click', () => {
      state.simSuneung = null;
      state.simBaseScore = null;
      state.simOriginalStudent = null;
      showToast('시뮬레이션 모드를 종료합니다.');
      render();
    });
  }
}


// ════════════════════════════════════════════
// ═══ 이벤트 바인딩 ═══
// ════════════════════════════════════════════
function bindEvents() {
  // 탭 전환
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      state.tab = btn.dataset.tab;
      render();
    });
  });

  // 성적 입력 필드
  document.querySelectorAll('[data-field]').forEach(el => {
    const handler = () => {
      const path = el.dataset.field.split('.');
      let val = el.value;
      if (el.type === 'number') val = parseFloat(val) || 0;
      if (path.length === 2) {
        if (path[0] === 'english' || path[0] === 'hanksa') {
          state.student[path[0]][path[1]] = parseInt(val);
        } else {
          state.student[path[0]][path[1]] = el.type === 'number' ? val : el.value;
          // 표준점수를 직접 수정한 경우 → 연동 해제
          if (path[1] === 'standard' && (path[0] === 'korean' || path[0] === 'math' || path[0] === 'inquiry1' || path[0] === 'inquiry2')) {
            state.student[path[0]].stdLinked = false;
            const icon = document.querySelector('[data-link-icon="' + path[0] + '"]');
            if (icon) icon.textContent = '\u270F\uFE0F';
          }
          // 선택과목 변경 시 → 원점수 기반으로 표준점수 재계산
          if (path[1] === 'subject' && (path[0] === 'korean' || path[0] === 'math' || path[0] === 'inquiry1' || path[0] === 'inquiry2')) {
            const area = path[0];
            const raw = state.student[area].raw;
            if (raw !== undefined && raw !== null && state.student[area].stdLinked) {
              const newSubject = el.value;
              const newStd = rawToStandard(newSubject, raw);
              if (newStd !== null) {
                state.student[area].standard = newStd;
                const stdInput = document.querySelector('[data-field="' + area + '.standard"]');
                if (stdInput) stdInput.value = newStd;
              }
            }
          }
        }
      }
    };
    el.addEventListener('change', handler);
    if (el.type === 'number') el.addEventListener('input', handler);
  });

  // ── 원점수 변경 → 표준점수 자동 갱신 ──
  document.querySelectorAll('[data-raw]').forEach(el => {
    const handler = () => {
      const area = el.dataset.raw; // korean, math, inquiry1, inquiry2
      const rawVal = parseFloat(el.value);
      if (isNaN(rawVal)) return;
      
      state.student[area].raw = rawVal;
      
      // 현재 선택과목 기준으로 표준점수 변환
      const subject = state.student[area].subject;
      const newStd = rawToStandard(subject, rawVal);
      
      if (newStd !== null) {
        state.student[area].standard = newStd;
        state.student[area].stdLinked = true;
        
        // 표준점수 입력란 자동 갱신
        const stdInput = document.querySelector('[data-field="' + area + '.standard"]');
        if (stdInput) stdInput.value = newStd;
        
        // 아이콘 갱신 → 🔗
        const icon = document.querySelector('[data-link-icon="' + area + '"]');
        if (icon) icon.textContent = '\u{1F517}';
      }
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });

  // 실기 슬라이더 (입력 화면)
  document.querySelectorAll('[data-sport]').forEach(el => {
    el.addEventListener('input', () => {
      const key = el.dataset.sport;
      const val = parseFloat(el.value);
      state.student.sports[key] = val;
      const svEl = document.getElementById('sv-' + key);
      if (svEl) {
        const field = findSportsField(key);
        svEl.textContent = val.toFixed(field && field.step < 1 ? 1 : 0);
      }
    });
  });

  // ── 수능 시뮬레이터 슬라이더 (상세 화면) ──
  document.querySelectorAll('[data-suneung]').forEach(el => {
    el.addEventListener('input', () => {
      if (!state.simSuneung) return;
      const key = el.dataset.suneung;
      const val = parseInt(el.value);
      state.simSuneung[key] = val;
      
      // 값 표시 업데이트
      const valEl = document.getElementById('sim-' + key);
      if (valEl) valEl.textContent = val;

      // 기준값과 비교해 색상 클래스 변경
      const baseMap = {
        koreanStd: state.student.korean.standard,
        mathStd: state.student.math.standard,
        inq1Std: state.student.inquiry1.standard,
        inq2Std: state.student.inquiry2.standard
      };
      const base = baseMap[key];
      if (base !== undefined && valEl) {
        valEl.className = 'suneung-value';
        if (val > base) valEl.classList.add('above');
        else if (val < base) valEl.classList.add('below');
      }

      // 슬라이더 색상 클래스 업데이트
      if (base !== undefined) {
        el.className = 'suneung-range';
        if (val > base) el.classList.add('range-above');
        else if (val < base) el.classList.add('range-below');
      }

      // 실시간 점수 업데이트
      updateDetailScores();
    });
  });

  // ── 등급 ±버튼 (영어/한국사) ──
  document.querySelectorAll('[data-suneung-grade]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.simSuneung) return;
      const key = btn.dataset.suneungGrade;
      const dir = btn.dataset.dir;
      let current = state.simSuneung[key];
      if (dir === 'down' && current > 1) current--;
      else if (dir === 'up' && current < 9) current++;
      state.simSuneung[key] = current;

      // 표시 업데이트
      const display = document.getElementById('sim-' + key);
      if (display) {
        display.textContent = current + '등급';
        const baseMap = { engGrade: state.student.english.grade, hanksaGrade: state.student.hanksa.grade };
        const base = baseMap[key];
        display.className = 'suneung-grade-display';
        if (current < base) display.classList.add('above');
        else if (current > base) display.classList.add('below');
      }

      updateDetailScores();
      // 전체 리렌더 (델타 표시 갱신 위해)
      render();
    });
  });

  // ── 시뮬레이션 원점수 슬라이더 (상세 화면, data-sim-raw) ──
  document.querySelectorAll('[data-sim-raw]').forEach(el => {
    const handler = () => {
      if (!state.simSuneung) return;
      const area = el.dataset.simRaw; // korean, math, inquiry1, inquiry2
      const rawVal = parseInt(el.value);
      if (isNaN(rawVal)) return;

      // simSuneung에 원점수 저장
      const rawKeyMap = { korean: 'koreanRaw', math: 'mathRaw', inquiry1: 'inq1Raw', inquiry2: 'inq2Raw' };
      const stdKeyMap = { korean: 'koreanStd', math: 'mathStd', inquiry1: 'inq1Std', inquiry2: 'inq2Std' };
      state.simSuneung[rawKeyMap[area]] = rawVal;

      // 원점수 → 표준점수 변환 (STEP1의 rawToStandard 사용)
      const subject = state.student[area].subject;
      const newStd = rawToStandard(subject, rawVal);
      if (newStd !== null) {
        state.simSuneung[stdKeyMap[area]] = newStd;
      }

      // DOM 직접 업데이트 — 원점수 표시
      const rawDisplay = document.getElementById('sim-raw-' + area);
      if (rawDisplay) {
        rawDisplay.textContent = rawVal;
        const baseStd = state.student[area].standard;
        const curStd = newStd !== null ? newStd : state.simSuneung[stdKeyMap[area]];
        rawDisplay.style.color = curStd > baseStd ? '#00E676' : curStd < baseStd ? '#FF1744' : 'var(--text)';
      }

      // DOM 직접 업데이트 — 변화량 텍스트
      const item = el.closest('.sim-suneung-item');
      if (item && newStd !== null) {
        const baseStd = state.student[area].standard;
        const stdDiff = newStd - baseStd;
        const deltaContainer = item.querySelectorAll('div')[1]; // 두 번째 div = 변화량 행
        if (deltaContainer && deltaContainer.children.length > 0) {
          // deltaContainer 자체가 변화량 span을 포함
        }
        // 변화량 span 찾기 (renderSimRawSlider에서 생성한 것)
        const deltaSpan = item.querySelector('[style*="font-size:12px"]');
        if (deltaSpan) {
          if (stdDiff !== 0) {
            deltaSpan.innerHTML = `<span style="font-size:12px;font-weight:800;color:${stdDiff > 0 ? '#00E676' : '#FF1744'}">${baseStd} → ${newStd} (${stdDiff > 0 ? '+' : ''}${stdDiff})</span>`;
          } else {
            deltaSpan.innerHTML = `<span style="font-size:12px;color:var(--muted)">표준 ${newStd}</span>`;
          }
        }
      }

      // 슬라이더 색상 업데이트
      const baseStd = state.student[area].standard;
      const curStd = newStd !== null ? newStd : state.simSuneung[stdKeyMap[area]];
      el.className = 'suneung-range';
      if (curStd > baseStd) el.classList.add('range-above');
      else if (curStd < baseStd) el.classList.add('range-below');

      // 즉시 재계산 (render() 없이 DOM 직접 업데이트)
      updateDetailScores();
    };
    el.addEventListener('input', handler);
  });

  // ── 영어 등급 버튼 (시뮬레이션, data-sim-eng-grade) ──
  document.querySelectorAll('[data-sim-eng-grade]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.simSuneung) return;
      const grade = parseInt(btn.dataset.simEngGrade);
      state.simSuneung.engGrade = grade;
      updateDetailScores();
      render();
    });
  });

  // ── 한국사 등급 버튼 (시뮬레이션, data-sim-hks-grade) ──
  document.querySelectorAll('[data-sim-hks-grade]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.simSuneung) return;
      const grade = parseInt(btn.dataset.simHksGrade);
      state.simSuneung.hanksaGrade = grade;
      updateDetailScores();
      render();
    });
  });

  // ── 시뮬레이션 인라인 초기화 버튼 ──
  const btnSimResetInline = document.getElementById('btn-sim-reset-inline');
  if (btnSimResetInline) {
    btnSimResetInline.addEventListener('click', () => {
      state.simSuneung = {
        koreanStd: state.student.korean.standard,
        mathStd: state.student.math.standard,
        engGrade: state.student.english.grade,
        inq1Std: state.student.inquiry1.standard,
        inq2Std: state.student.inquiry2.standard,
        hanksaGrade: state.student.hanksa.grade,
        koreanRaw: state.student.korean.raw || 0,
        mathRaw: state.student.math.raw || 0,
        inq1Raw: state.student.inquiry1.raw || 0,
        inq2Raw: state.student.inquiry2.raw || 0
      };
      state.simSports = {};
      showToast('모든 슬라이더가 원래 입력값으로 초기화되었습니다.');
      render();
    });
  }

  // 실기 시뮬레이터 슬라이더 (상세 화면)
  document.querySelectorAll('[data-sim]').forEach(el => {
    el.addEventListener('input', () => {
      const key = el.dataset.sim;
      const val = parseFloat(el.value);
      const base = parseFloat(el.dataset.base) || 0;
      const direction = el.dataset.direction || 'higher';
      state.simSports[key] = val;

      const field = findSportsField(key);
      const decimals = field && field.step < 1 ? 1 : 0;

      // 값 표시 업데이트
      const svEl = document.getElementById('sim-' + key);
      if (svEl) {
        svEl.textContent = val.toFixed(decimals);
      }

      // 델타 표시 업데이트
      const diff = val - base;
      const hasDiff = Math.abs(diff) > (field && field.step < 1 ? 0.05 : 0.5);
      const isGood = direction === 'lower' ? diff < 0 : diff > 0;
      const diffColor = hasDiff ? (isGood ? 'var(--green)' : 'var(--red)') : 'transparent';
      const diffSign = diff > 0 ? '+' : '';

      const deltaEl = document.getElementById('sim-delta-' + key);
      if (deltaEl) {
        deltaEl.textContent = hasDiff ? `(${diffSign}${diff.toFixed(decimals)})` : '';
        deltaEl.style.color = diffColor;
      }

      // 값 색상 업데이트
      if (svEl) {
        svEl.style.color = hasDiff ? diffColor : (val > 0 ? 'var(--purple)' : 'var(--muted)');
      }

      // 슬라이더 accent color 업데이트
      el.style.accentColor = hasDiff ? (isGood ? '#00e676' : '#ff5252') : 'var(--purple)';

      // 시뮬레이션 바 + 점수 업데이트
      updateDetailScores();
    });
  });

  // 분석하기 버튼
  const btnAnalyze = document.getElementById('btn-analyze');
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', async () => {
      state.loading = true;
      render();
      
      try {
        const res = await fetch(API + '/api/calculate/all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student: state.student })
        });
        if (!res.ok) throw new Error('서버 응답 오류');
        const data = await res.json();
        if (!data || !data.results) throw new Error('응답 데이터 형식 오류');
        state.results = data;
        state.tab = 'result';
        showToast(`${state.results.results.length}개 대학 분석 완료!`);
      } catch (e) {
        showToast('계산 중 오류가 발생했습니다: ' + e.message);
      }
      
      state.loading = false;
      render();
    });
  }

  // 결과 행 클릭 → 상세
  document.querySelectorAll('.result-row').forEach(row => {
    row.addEventListener('click', () => {
      const uid = parseInt(row.dataset.uid, 10);
      if (!state.results || !state.results.results) return;
      state.selectedUniv = state.results.results.find(r => r.university_id === uid);
      state.simSports = {};
      state.simSuneung = null;
      state.simBaseScore = null;
      state.tab = 'detail';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // 요약 카드 클릭 → 상태 필터
  document.querySelectorAll('[data-summary-status]').forEach(el => {
    el.addEventListener('click', () => {
      const st = el.dataset.summaryStatus;
      state.filters.status = state.filters.status === st ? '전체' : st;
      render();
    });
  });

  // 상태 필터 버튼
  document.querySelectorAll('[data-status-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filters.status = btn.dataset.statusFilter;
      render();
    });
  });

  // 필터 (셀렉트 + 검색)
  const debouncedSearchRender = debounce(() => render(), 300);
  document.querySelectorAll('[data-filter]').forEach(el => {
    const isSearch = el.tagName === 'INPUT' && el.dataset.filter === 'search';
    const eventType = el.tagName === 'INPUT' ? 'input' : 'change';
    el.addEventListener(eventType, () => {
      state.filters[el.dataset.filter] = el.value;
      if (isSearch) {
        debouncedSearchRender();
      } else {
        render();
      }
    });
  });

  // 목록으로 버튼
  const btnBack = document.getElementById('btn-back-result');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      state.tab = 'result';
      state.simSuneung = null;
      state.simBaseScore = null;
      render();
    });
  }

  // ── 시뮬레이션 모드 시작 버튼 ──
  const btnStartSim = document.getElementById('btn-start-sim');
  if (btnStartSim) {
    btnStartSim.addEventListener('click', () => {
      const u = state.selectedUniv;
      if (!u) return;
      state.simSuneung = {
        koreanStd: state.student.korean.standard,
        mathStd: state.student.math.standard,
        engGrade: state.student.english.grade,
        inq1Std: state.student.inquiry1.standard,
        inq2Std: state.student.inquiry2.standard,
        hanksaGrade: state.student.hanksa.grade,
        koreanRaw: state.student.korean.raw || 0,
        mathRaw: state.student.math.raw || 0,
        inq1Raw: state.student.inquiry1.raw || 0,
        inq2Raw: state.student.inquiry2.raw || 0
      };
      state.simBaseScore = u.my_suneung_score;
      state.simOriginalStudent = JSON.parse(JSON.stringify(state.student));
      showToast('시뮬레이션 모드가 시작되었습니다. 슬라이더로 점수를 조정하세요!');
      render();
    });
  }

  // 시뮬레이션 바 이벤트
  bindSimBarEvents();

  // 테마 토글
  const btnTheme = document.getElementById('btn-theme');
  if (btnTheme) {
    btnTheme.addEventListener('click', toggleTheme);
  }

  // 관리자 로그인
  const btnAdminLogin = document.getElementById('btn-admin-login');
  if (btnAdminLogin) {
    btnAdminLogin.addEventListener('click', async () => {
      const pw = document.getElementById('admin-pw').value;
      if (pw === 'k1sports' || pw === 'admin') {
        state.admin.loggedIn = true;
        try {
          const res = await fetch(API + '/api/universities');
          const data = await res.json();
          state.admin.universities = data.universities;
        } catch (e) {
          state.admin.universities = [];
        }
        showToast('관리자 로그인 성공!');
        render();
      } else {
        showToast('비밀번호가 틀렸습니다.');
      }
    });
    const pwInput = document.getElementById('admin-pw');
    if (pwInput) {
      pwInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnAdminLogin.click();
      });
    }
  }

  // 관리자 로그아웃
  const btnAdminLogout = document.getElementById('btn-admin-logout');
  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', () => {
      state.admin.loggedIn = false;
      state.admin.universities = null;
      render();
    });
  }

  // 관리자 검색
  const adminSearch = document.getElementById('admin-search');
  if (adminSearch) {
    adminSearch.addEventListener('input', () => {
      const tbody = document.getElementById('admin-tbody');
      if (tbody) {
        tbody.innerHTML = renderAdminRows(adminSearch.value);
        const cnt = document.getElementById('admin-count');
        const q = adminSearch.value.toLowerCase();
        if (cnt && state.admin.universities) {
          const filtered = q ? state.admin.universities.filter(u => u.university.toLowerCase().includes(q) || u.department.toLowerCase().includes(q)) : state.admin.universities;
          cnt.textContent = `검색결과 ${filtered.length}개 대학`;
        }
      }
    });
  }
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', () => {
  // 테마 초기화
  setTheme(getTheme());
  render();
});
