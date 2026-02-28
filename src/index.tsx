import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { calculateAll, calcSuneungScore, getAdmissionStatus, universities } from './calculator';
import type { StudentScore, University } from './calculator';

const app = new Hono();

app.use('/api/*', cors());

// ── 전체 대학 목록 API ──
app.get('/api/universities', (c) => {
  const list = universities
    .filter(u => ['가군', '나군', '다군'].includes(u.group))
    .map(u => ({
      id: u.id,
      university: u.university,
      department: u.department,
      group: u.group,
      location: u.location,
      univ_type: u.univ_type,
      capacity: u.capacity,
      competition_rate: u.competition_rate,
      sports_events: u.sports_events,
      score_method: u.score_method,
      suneung_ratio: u.suneung_ratio,
      sports_ratio: u.sports_ratio,
      cutline_suneung: u.cutline_suneung,
      cutline_total: u.cutline_total,
    }));
  return c.json({ count: list.length, universities: list });
});

// ── 전체 합불 판정 API ──
app.post('/api/calculate/all', async (c) => {
  try {
    const body = await c.req.json<{ student: StudentScore }>();
    const result = calculateAll(body.student);
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: e.message || 'Calculation error' }, 400);
  }
});

// ── 학교 상세 API ──
app.get('/api/universities/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const univ = universities.find(u => u.id === id);
  if (!univ) return c.json({ error: 'Not found' }, 404);
  return c.json(univ);
});

// ── 실기 시뮬레이터 API ──
app.post('/api/calculate/simulate', async (c) => {
  try {
    const body = await c.req.json<{
      university_id: number;
      student: StudentScore;
      sports_override?: Record<string, number>;
    }>();

    const univ = universities.find(u => u.id === body.university_id);
    if (!univ) return c.json({ error: 'University not found' }, 404);

    // 수능 환산점수 계산
    const mySuneungScore = calcSuneungScore(body.student, univ);
    const cutline = univ.cutline_suneung || 0;
    const diff = Math.round((mySuneungScore - cutline) * 100) / 100;
    const status = getAdmissionStatus(mySuneungScore, cutline);

    // 실기 종목별 정보
    const sportsBreakdown = (univ.sports_events || []).map(eventName => {
      const overrideVal = body.sports_override?.[eventName];
      const studentVal = body.student.sports[eventName] || 0;
      const myScore = overrideVal !== undefined ? overrideVal : studentVal;

      return {
        event: eventName,
        my_score: myScore,
        has_value: myScore > 0,
      };
    });

    // 수능 영역별 분해
    const suneungBreakdown: Record<string, any> = {};
    if (univ.korean_yn) {
      suneungBreakdown.korean = {
        raw_standard: body.student.korean.standard,
        raw_percentile: body.student.korean.percentile,
        ratio: univ.korean_ratio,
        points: univ.korean_points,
      };
    }
    if (univ.math_yn) {
      suneungBreakdown.math = {
        raw_standard: body.student.math.standard,
        raw_percentile: body.student.math.percentile,
        subject: body.student.math.subject,
        bonus: univ.math_bonus,
        ratio: univ.math_ratio,
        points: univ.math_points,
      };
    }
    if (univ.english_yn) {
      const engGrade = Math.min(Math.max(body.student.english.grade, 1), 9);
      suneungBreakdown.english = {
        grade: engGrade,
        method: univ.english_method,
        score: univ.english_grade_scores?.[engGrade - 1] || 0,
      };
    }
    if (univ.inquiry_yn) {
      suneungBreakdown.inquiry = {
        subject1: body.student.inquiry1.subject,
        standard1: body.student.inquiry1.standard,
        percentile1: body.student.inquiry1.percentile,
        subject2: body.student.inquiry2.subject,
        standard2: body.student.inquiry2.standard,
        percentile2: body.student.inquiry2.percentile,
        ratio: univ.inquiry_ratio,
        points: univ.inquiry_points,
      };
    }

    return c.json({
      university: {
        id: univ.id,
        name: univ.university,
        department: univ.department,
        group: univ.group,
        location: univ.location,
        capacity: univ.capacity,
        competition_rate: univ.competition_rate,
        score_method: univ.score_method,
        suneung_total: univ.suneung_total,
        sports_total: univ.sports_total,
      },
      suneung_breakdown: suneungBreakdown,
      sports_breakdown: sportsBreakdown,
      my_suneung_score: mySuneungScore,
      cutline_suneung: cutline,
      cutline_total: univ.cutline_total,
      diff,
      status,
    });
  } catch (e: any) {
    return c.json({ error: e.message || 'Simulation error' }, 400);
  }
});

// ── 통계 API ──
app.get('/api/stats', (c) => {
  const validUnivs = universities.filter(u => ['가군', '나군', '다군'].includes(u.group));
  const groups = { '가군': 0, '나군': 0, '다군': 0 };
  const locations = new Set<string>();
  const scoreMethods = new Map<string, number>();
  let withCutline = 0;

  for (const u of validUnivs) {
    groups[u.group as keyof typeof groups]++;
    if (u.location) locations.add(u.location);
    if (u.score_method) {
      scoreMethods.set(u.score_method, (scoreMethods.get(u.score_method) || 0) + 1);
    }
    if (u.cutline_suneung > 0) withCutline++;
  }

  return c.json({
    total: validUnivs.length,
    groups,
    locations: [...locations].sort(),
    score_methods: Object.fromEntries(scoreMethods),
    with_cutline: withCutline,
    without_cutline: validUnivs.length - withCutline,
  });
});

// ── 메인 HTML ──
app.get('/', (c) => {
  return c.html(getMainHTML());
});

function getMainHTML() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>K1 SPORTS 체대입시 분석 시스템 | 2027학년도 정시</title>
  <meta name="description" content="전국 230개+ 대학 체육 관련 학과의 합격·불합격 여부를 즉시 판정하는 K1 SPORTS 체대입시 분석 시스템">
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2/fonts/variable/woff2/SUIT-Variable.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="/static/styles.css" rel="stylesheet">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#09090b">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
</head>
<body>
  <div id="app"></div>
  <script src="/static/app.js"></script>
</body>
</html>`;
}

export default app;
