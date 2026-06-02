#!/usr/bin/env node
// 데모용: 키워드 없이 전체 메일 수집 → Sheets 생성

const { execSync } = require('child_process');
const GWS = './node_modules/.bin/gws';

function gws(service, subcommand, paramsObj, jsonObj) {
  let cmd = `${GWS} ${service} ${subcommand}`;
  if (paramsObj) cmd += ` --params '${JSON.stringify(paramsObj)}'`;
  if (jsonObj)   cmd += ` --json '${JSON.stringify(jsonObj)}'`;
  cmd += ' 2>/dev/null';
  try {
    return JSON.parse(execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString());
  } catch { return null; }
}

function decodeBase64(str) {
  try { return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'); } catch { return ''; }
}

function extractBody(payload) {
  if (!payload) return '';
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) return decodeBase64(part.body.data);
      const sub = extractBody(part);
      if (sub) return sub;
    }
  }
  return '';
}

function getHeader(headers, name) {
  return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function classify(subject, body) {
  const text = (subject + ' ' + body).toLowerCase();
  let type = '기타';
  if (/주문|order/.test(text)) type = '주문';
  else if (/계약|contract/.test(text)) type = '계약';
  else if (/문의|inquiry/.test(text)) type = '문의';
  else if (/환불|refund/.test(text)) type = '환불';
  else if (/협업|협력|파트너/.test(text)) type = '협업';
  else if (/대회|챌린지|공모전/.test(text)) type = '공모전';
  else if (/sale|할인|off|promo/.test(text)) type = '마케팅';

  let urgency = '하';
  if (/긴급|urgent|즉시|빠른|당장/.test(text)) urgency = '상';
  else if (/확인 부탁|검토|회신|답변|부탁드립니다/.test(text)) urgency = '중';

  let sentiment = '중립';
  if (/감사|고맙|좋은|만족|훌륭|참여/.test(text)) sentiment = '긍정';
  else if (/불만|화가|실망|짜증|최악|환불|항의/.test(text)) sentiment = '부정';

  let score = 5;
  if (urgency === '상') score += 3;
  else if (urgency === '중') score += 1;
  if (sentiment === '부정') score += 2;
  else if (sentiment === '긍정') score -= 1;
  if (type !== '기타' && type !== '마케팅') score += 1;
  return { type, urgency, sentiment, score: Math.min(10, Math.max(1, score)) };
}

async function main() {
  console.log('📧 Gmail 수집 시작 (키워드 없이 전체)...\n');

  const profile = gws('gmail', 'users get-profile', { userId: 'me' });
  const myEmail = profile?.emailAddress || '';
  console.log(`📮 계정: ${myEmail}`);

  const threadList = gws('gmail', 'users threads list', { userId: 'me', q: 'after:2026/05/26', maxResults: 50 });
  const threads = threadList?.threads || [];
  console.log(`✅ 스레드 ${threads.length}개 발견\n`);

  const rows = [];

  for (const t of threads) {
    const thread = gws('gmail', 'users threads get', { userId: 'me', id: t.id, format: 'full' });
    if (!thread?.messages?.length) continue;

    const msg = thread.messages[0];
    const headers = msg.payload?.headers || [];
    const date    = getHeader(headers, 'Date');
    const from    = getHeader(headers, 'From');
    const subject = getHeader(headers, 'Subject') || '(제목 없음)';
    const body    = extractBody(msg.payload);

    const hasMyReply = thread.messages.slice(1).some(m =>
      getHeader(m.payload?.headers || [], 'From').includes(myEmail)
    );

    const { type, urgency, sentiment, score } = classify(subject, body);
    const summary = body.replace(/\s+/g, ' ').trim().substring(0, 120) + (body.length > 120 ? '...' : '');
    const link = `https://mail.google.com/mail/u/0/#inbox/${t.id}`;

    rows.push([date, from, subject, summary, type, urgency, sentiment, score, !hasMyReply ? '미회신' : '회신완료', link]);
  }

  rows.sort((a, b) => new Date(b[0]) - new Date(a[0]));

  console.log('📊 Google Sheets 생성 중...');
  const newSheet = gws('sheets', 'spreadsheets create', null, {
    properties: { title: 'Gmail 메일로그' },
    sheets: [{ properties: { title: '메일로그' } }]
  });

  const spreadsheetId = newSheet?.spreadsheetId;
  const sheetId = newSheet?.sheets?.[0]?.properties?.sheetId ?? 0;
  if (!spreadsheetId) { console.error('❌ 스프레드시트 생성 실패'); return; }
  console.log(`✅ 생성됨: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);

  const header = ['수신일시', '발신자', '제목', '내용 요약', '유형', '긴급도', '감정', '중요도', '미회신 여부', 'Gmail 링크'];
  const values = [header, ...rows];

  gws('sheets', 'spreadsheets values update',
    { spreadsheetId, range: '메일로그!A1', valueInputOption: 'RAW' },
    { values }
  );
  console.log(`✅ ${rows.length}행 데이터 입력 완료`);

  // 서식
  const totalRows = rows.length + 1;
  const requests = [
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
        cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }, backgroundColor: { red: 0.26, green: 0.52, blue: 0.96 }, horizontalAlignment: 'CENTER' } },
        fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)'
      }
    },
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1, frozenColumnCount: 1 } }, fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount' } },
    { setBasicFilter: { filter: { range: { sheetId, startRowIndex: 0, endRowIndex: totalRows, startColumnIndex: 0, endColumnIndex: 10 } } } },
    { autoResizeDimensions: { dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 10 } } },
    { addConditionalFormatRule: { rule: { ranges: [{ sheetId, startRowIndex: 1, endRowIndex: totalRows, startColumnIndex: 0, endColumnIndex: 10 }], booleanRule: { condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: '상' }] }, format: { backgroundColor: { red: 1.0, green: 0.8, blue: 0.8 } } } }, index: 0 } },
    { addConditionalFormatRule: { rule: { ranges: [{ sheetId, startRowIndex: 1, endRowIndex: totalRows, startColumnIndex: 0, endColumnIndex: 10 }], booleanRule: { condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: '미회신' }] }, format: { backgroundColor: { red: 1.0, green: 0.95, blue: 0.6 } } } }, index: 1 } },
    { addConditionalFormatRule: { rule: { ranges: [{ sheetId, startRowIndex: 1, endRowIndex: totalRows, startColumnIndex: 7, endColumnIndex: 8 }], booleanRule: { condition: { type: 'NUMBER_GREATER_THAN_EQ', values: [{ userEnteredValue: '8' }] }, format: { textFormat: { bold: true } } } }, index: 2 } }
  ];

  gws('sheets', 'spreadsheets batchUpdate', { spreadsheetId }, { requests });
  console.log('✅ 서식 적용 완료 (헤더 강조 / 행열 고정 / 필터 / 조건부 서식)');

  // 하이퍼링크
  const linkValues = rows.map((r, i) => [`=HYPERLINK("${r[9]}","메일 열기")`]);
  gws('sheets', 'spreadsheets values update',
    { spreadsheetId, range: '메일로그!J2', valueInputOption: 'USER_ENTERED' },
    { values: linkValues }
  );
  console.log('✅ Gmail 하이퍼링크 적용 완료');

  // 요약
  const byType = {};
  let unrepliedCount = 0, highCount = 0;
  rows.forEach(r => {
    byType[r[4]] = (byType[r[4]] || 0) + 1;
    if (r[8] === '미회신') unrepliedCount++;
    if (Number(r[7]) >= 8) highCount++;
  });

  console.log('\n' + '='.repeat(50));
  console.log('📋 완료 요약 보고');
  console.log('='.repeat(50));
  console.log(`📬 총 스레드: ${rows.length}건`);
  console.log('\n[유형별 건수]');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  · ${k}: ${v}건`));
  console.log(`\n⚠️  미회신: ${unrepliedCount}건`);
  console.log(`🔥 중요도 8 이상: ${highCount}건`);
  console.log('\n' + '='.repeat(50));
  console.log(`\n🔗 시트 링크: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
}

main().catch(console.error);
