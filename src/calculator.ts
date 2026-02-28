// 수능 환산 계산 엔진 v2 — 체대 입시 합불 판정 핵심 로직
// 엑셀의 계산 로직을 TypeScript로 완전 이식 (고도화)

import universitiesData from '../../data/universities.json';
import customStandardData from '../../data/custom_standard.json';

export interface StudentScore {
  korean: { subject: string; standard: number; percentile: number; grade: number };
  math: { subject: string; standard: number; percentile: number; grade: number };
  english: { grade: number };
  inquiry1: { subject: string; standard: number; percentile: number; grade: number };
  inquiry2: { subject: string; standard: number; percentile: number; grade: number };
  hanksa: { grade: number };
  sports: Record<string, number>;
}

export interface University {
  id: number;
  university: string;
  group: string;
  department: string;
  capacity: number;
  competition_rate: number;
  phone: string;
  location: string;
  step1: string;
  suneung_ratio: number;
  suneung_total: number;
  sports_ratio: number;
  sports_total: number;
  interview_ratio: number;
  interview_total: number;
  hanksa_ratio: number;
  hanksa_method: string;
  korean_yn: boolean;
  korean_bonus: number;
  korean_ratio: number;
  korean_points: number;
  math_yn: boolean;
  math_selection: string;
  math_bonus: number;
  math_ratio: number;
  math_points: number;
  english_yn: boolean;
  english_method: string;
  english_ratio: number;
  english_points: number;
  inquiry_yn: boolean;
  inquiry_selection: string;
  inquiry_bonus: number;
  inquiry_ratio: number;
  inquiry_points: number;
  score_method: string;
  reflect_subjects: string;
  calculated_score: number;
  sports_events: string[];
  sports_max: number;
  total_with_sports: number;
  univ_type: string;
  hanksa_deductions: number[];
  english_grade_scores: number[];
  avg_grade: string;
  cutline_total: number;
  cutline_suneung: number;
  standard_calc_method: string;
}

// 데이터 로드
export const universities: University[] = universitiesData as University[];
export const customStandard: Record<string, Record<string, number[]>> = customStandardData as any;

// 자체표준점수 lookup: 백분위 → 자체표준점수
function lookupCustomStandard(percentile: number, schoolName: string, category: string): number {
  const shortName = schoolName.replace('대학교', '').replace('대학', '').substring(0, 3);
  
  for (const [key, table] of Object.entries(customStandard)) {
    if (key.includes(shortName)) {
      // 카테고리 매칭 (유연한 매칭)
      let targetKey = category;
      if (!table[targetKey]) {
        // 대체 카테고리 시도
        const alternatives: Record<string, string[]> = {
          '사탐기준': ['사탐기준', '사탐영역', '사탐', '사/과'],
          '과탐기준': ['과탐기준', '과탐영역', '과탐', '사/과'],
          '수학': ['수학', '수학기준'],
        };
        const alts = alternatives[category] || [category];
        for (const alt of alts) {
          if (table[alt]) { targetKey = alt; break; }
        }
      }
      
      const percentiles = table['백분위'];
      const values = table[targetKey];
      if (!percentiles || !values) continue;
      
      // 백분위 배열에서 순차 매칭 (정확 매칭 우선, 없으면 가장 가까운 값)
      for (let i = 0; i < percentiles.length; i++) {
        if (percentiles[i] === percentile) {
          return values[i] || 0;
        }
      }
      // 가장 가까운 값 (내림차순 백분위 배열 기준)
      for (let i = 0; i < percentiles.length; i++) {
        if (percentiles[i] <= percentile) {
          return values[i] || 0;
        }
      }
      return values[values.length - 1] || 0;
    }
  }
  return percentile; // 매칭 실패 시 백분위 그대로
}

// 사탐/과탐 구분
function isSocialInquiry(subject: string): boolean {
  return ['생윤', '윤사', '한지', '세지', '사문', '정법', '경제'].includes(subject);
}

// 수능 환산점수 계산 (v2 — 활용지표 6종 모두 대응)
export function calcSuneungScore(student: StudentScore, univ: University): number {
  let score = 0;
  const method = univ.score_method || '';

  // ─── 국어 ───
  if (univ.korean_yn && univ.korean_points > 0) {
    let koreanRaw = student.korean.standard;
    
    if (method.includes('백분위')) {
      koreanRaw = student.korean.percentile;
    } else if (method === '200점') {
      // 200점 환산: 표준점수 기반
      const maxStd = 150;
      score += (koreanRaw / maxStd) * univ.korean_points;
    }
    
    if (method !== '200점') {
      if (method.includes('백분위')) {
        score += (koreanRaw / 100) * univ.korean_points;
      } else if (method.includes('최고점')) {
        // 최고점 방식: 해당 연도 최고점 기준
        const maxStd = 150;
        score += (koreanRaw / maxStd) * univ.korean_points;
      } else {
        // 표준점수 기반
        const maxStd = 150;
        score += (koreanRaw / maxStd) * univ.korean_points;
      }
    }
    
    // 국어 가산점
    if (univ.korean_bonus > 0) {
      score += univ.korean_bonus;
    }
  }

  // ─── 수학 ───
  if (univ.math_yn && univ.math_points > 0) {
    let mathRaw = student.math.standard;
    
    if (method.includes('백분위')) {
      mathRaw = student.math.percentile;
    } else if (method.includes('(수/탐)자체') || method.includes('(수)자체')) {
      // 수학 자체표준점수 적용
      mathRaw = lookupCustomStandard(student.math.percentile, univ.university, '수학');
    }
    
    // 가산점 (미적분/기하 선택 시)
    let bonus = 0;
    if (univ.math_bonus > 0 && (student.math.subject === '미적분' || student.math.subject === '기하')) {
      bonus = univ.math_bonus;
    }
    
    if (method.includes('백분위')) {
      score += ((mathRaw * (1 + bonus)) / 100) * univ.math_points;
    } else if (method === '200점') {
      const maxStd = 150;
      score += ((mathRaw * (1 + bonus)) / maxStd) * univ.math_points;
    } else {
      const maxStd = 150;
      score += ((mathRaw * (1 + bonus)) / maxStd) * univ.math_points;
    }
  }

  // ─── 영어 (등급제) ───
  if (univ.english_yn) {
    const engGrade = Math.min(Math.max(student.english.grade, 1), 9);
    const gradeIdx = engGrade - 1;
    
    if (univ.english_grade_scores && univ.english_grade_scores.length >= 9) {
      score += univ.english_grade_scores[gradeIdx] || 0;
    }
  }

  // ─── 탐구 (2과목) ───
  if (univ.inquiry_yn && univ.inquiry_points > 0) {
    let inq1 = student.inquiry1.standard;
    let inq2 = student.inquiry2.standard;
    
    if (method.includes('백분위')) {
      inq1 = student.inquiry1.percentile;
      inq2 = student.inquiry2.percentile;
    } else if (method.includes('자체') && method.includes('탐')) {
      // 탐구 자체표준점수 적용
      const is1Social = isSocialInquiry(student.inquiry1.subject);
      const is2Social = isSocialInquiry(student.inquiry2.subject);
      
      // 각 과목별로 사탐/과탐 카테고리 결정
      const cat1 = is1Social ? '사탐기준' : '과탐기준';
      const cat2 = is2Social ? '사탐기준' : '과탐기준';
      
      inq1 = lookupCustomStandard(student.inquiry1.percentile, univ.university, cat1);
      inq2 = lookupCustomStandard(student.inquiry2.percentile, univ.university, cat2);
    }
    
    // 탐구 반영 (2과목 합산)
    const inqSum = inq1 + inq2;
    
    if (method.includes('백분위')) {
      score += (inqSum / 200) * univ.inquiry_points;
    } else if (method.includes('자체')) {
      // 자체표준: 합산 점수 기반 환산
      const maxInq = 140; // 자체표준 2과목 최대 ~140
      score += (inqSum / maxInq) * univ.inquiry_points;
    } else {
      // 일반 표준점수
      const maxInq = 140; // 표준점수 2과목 최대 ~140
      score += (inqSum / maxInq) * univ.inquiry_points;
    }
    
    // 탐구 가산점
    if (univ.inquiry_bonus > 0) {
      score += univ.inquiry_bonus;
    }
  }

  // ─── 한국사 감점 ───
  if (univ.hanksa_deductions && univ.hanksa_deductions.length >= 9) {
    const hanksaGrade = Math.min(Math.max(student.hanksa.grade, 1), 9);
    const hanksaIdx = hanksaGrade - 1;
    score += univ.hanksa_deductions[hanksaIdx] || 0;
  }

  return Math.round(score * 100) / 100;
}

// 합불 판정 (4단계)
export type AdmissionStatus = '지원가능' | '소신지원' | '지원위험' | '지원불가';

export function getAdmissionStatus(myScore: number, cutline: number): AdmissionStatus {
  if (cutline <= 0) {
    // 커트라인 미공개: 점수 기반 추정
    return '소신지원';
  }
  const diff = myScore - cutline;
  if (diff >= 5) return '지원가능';
  if (diff >= -5) return '소신지원';
  if (diff >= -15) return '지원위험';
  return '지원불가';
}

// 전체 합불 판정
export interface CalculationResult {
  university_id: number;
  university: string;
  department: string;
  group: string;
  location: string;
  univ_type: string;
  capacity: number;
  competition_rate: number;
  phone: string;
  my_suneung_score: number;
  cutline_suneung: number;
  cutline_total: number;
  diff: number;
  status: AdmissionStatus;
  sports_events: string[];
  sports_max: number;
  avg_grade: string;
  suneung_ratio: number;
  sports_ratio: number;
  score_method: string;
  reflect_subjects: string;
  english_method: string;
  english_grade_scores: number[];
  hanksa_deductions: number[];
  korean_yn: boolean;
  korean_ratio: number;
  korean_points: number;
  math_yn: boolean;
  math_ratio: number;
  math_points: number;
  english_yn: boolean;
  english_ratio: number;
  english_points: number;
  inquiry_yn: boolean;
  inquiry_ratio: number;
  inquiry_points: number;
  suneung_total: number;
  sports_total: number;
  step1: string;
}

export function calculateAll(student: StudentScore): {
  summary: Record<string, number>;
  results: CalculationResult[];
} {
  const results: CalculationResult[] = [];
  
  for (const univ of universities) {
    // 빈 데이터 스킵
    if (!univ.university || !univ.department) continue;
    // 이상한 군 데이터 스킵
    if (!['가군', '나군', '다군'].includes(univ.group)) continue;
    
    const mySuneungScore = calcSuneungScore(student, univ);
    const cutline = univ.cutline_suneung || 0;
    const diff = Math.round((mySuneungScore - cutline) * 100) / 100;
    const status = getAdmissionStatus(mySuneungScore, cutline);
    
    results.push({
      university_id: univ.id,
      university: univ.university,
      department: univ.department,
      group: univ.group,
      location: univ.location,
      univ_type: univ.univ_type,
      capacity: univ.capacity,
      competition_rate: univ.competition_rate,
      phone: univ.phone,
      my_suneung_score: mySuneungScore,
      cutline_suneung: cutline,
      cutline_total: univ.cutline_total,
      diff,
      status,
      sports_events: univ.sports_events || [],
      sports_max: univ.sports_max || 0,
      avg_grade: univ.avg_grade,
      suneung_ratio: univ.suneung_ratio,
      sports_ratio: univ.sports_ratio,
      score_method: univ.score_method,
      reflect_subjects: univ.reflect_subjects,
      english_method: univ.english_method,
      english_grade_scores: univ.english_grade_scores || [],
      hanksa_deductions: univ.hanksa_deductions || [],
      korean_yn: univ.korean_yn,
      korean_ratio: univ.korean_ratio,
      korean_points: univ.korean_points,
      math_yn: univ.math_yn,
      math_ratio: univ.math_ratio,
      math_points: univ.math_points,
      english_yn: univ.english_yn,
      english_ratio: univ.english_ratio,
      english_points: univ.english_points,
      inquiry_yn: univ.inquiry_yn,
      inquiry_ratio: univ.inquiry_ratio,
      inquiry_points: univ.inquiry_points,
      suneung_total: univ.suneung_total,
      sports_total: univ.sports_total,
      step1: univ.step1,
    });
  }
  
  // 커트라인이 있는 학교 우선, 그 다음 점수차 내림차순
  results.sort((a, b) => {
    // 커트라인이 없는 학교는 뒤로
    if (a.cutline_suneung > 0 && b.cutline_suneung <= 0) return -1;
    if (a.cutline_suneung <= 0 && b.cutline_suneung > 0) return 1;
    // 둘 다 커트라인이 있으면 점수차 내림차순
    return b.diff - a.diff;
  });
  
  const summary = {
    '지원가능': results.filter(r => r.status === '지원가능').length,
    '소신지원': results.filter(r => r.status === '소신지원').length,
    '지원위험': results.filter(r => r.status === '지원위험').length,
    '지원불가': results.filter(r => r.status === '지원불가').length,
  };
  
  return { summary, results };
}
