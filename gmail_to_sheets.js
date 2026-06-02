#!/usr/bin/env node
/**
 * Gmail → Google Sheets 자동 정리 스크립트
 * 사용법: node gmail_to_sheets.js
 */

const { execSync } = require('child_process');

const GWS = './node_modules/.bin/gws';
const KEYWORDS = ['주문', '계약'];
const DAYS = 7;
const SHEET_NAME = '메일로그';

function gws(params) {
  const cmd = `${GWS} ${params} 2>/dev/null`;
  try {
    return JSON.parse(execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString());
  } catch (e) {
    return null;
  }
}

function getAfterDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function decodeBase64(str) {
  if (!str) return '';
  try {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  } catch { return ''; }
}

function extractBody(payload) {
  if (!payload) return '';
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) return decodeBase64(part.body.data);
    }
    for (const part of payload.parts) {
      const sub = extractBody(part);
      if (sub) return sub;
    }
  }
  return '';
}

function getHeader(headers, name) {
  return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function classify(subject, body, from) {
  const text = (subject + ' ' + body).toLowerCase();

  // 유형
  let type = '기타';
  if (text.includes('주문') || text.includes('order')) type = '주문';
  else if (text.includes('계약') || text.includes('contract')) type = '계약';
  else if (text.includes('문의') || text.includes('inquiry')) type = '문의';
  else if (text.includes('환불') || text.includes('refund')) type = '환불';
  else if (text.includes('협업') || text.includes('협력') || text.includes('파트너')) type = '협업';

  // 긴급도
  let urgency = '하';
  if (/긴급|urgent|즉시|빠른|당장|오늘까지|deadline/i.test(text)) urgency = '상';
  else if (/확인 부탁|검토|회신|답변|부탁드립니다/i.test(text)) urgency = '중';

  // 감정
  let sentiment = '중립';
  if (/감사|고맙|좋은|만족|훌륭|최고|기쁩/i.test(text)) sentiment = '긍정';
  else if (/불만|화가|실망|짜증|최악|환불|항의|불편|문제|오류|안됩니다/i.test(text)) sentiment = '부정';

  // 중요도 (1~10)
  let score = 5;
  if (urgency === '상') score += 3;
  else if (urgency === '중') score += 1;
  if (sentiment === '부정') score += 2;
  else if (sentiment === '긍정') score -= 1;
  if (type !== '기타') score += 1;
  score = Math.min(10, Math.max(1, score));

  return { type, urgency, sentiment, score };
}

function summarize(body) {
  const clean = body.replace(/\s+/g, ' ').replace(/https?:\/\/\S+/g, '').trim();
  return clean.length > 120 ? clean.substring(0, 120) + '...' : clean;
}

async function main() {
  console.log('📧 Gmail 수집 시작...');

  const afterDate = getAfterDate(DAYS);
  const kwQuery = KEYWORDS.map(k => k).join(' OR ');
  const query = `after:${afterDate} (${kwQuery}) -category:promotions -category:updates -is:newsletter`;

  const threadList = gws(`gmail users threads list --params '{"userId":"me","q":${JSON.stringify(query)},"maxResults":100}'`);
  if (!threadList?.threads?.length) {
    console.log('⚠️  조건에 맞는 메일이 없습니다.');
    return;
  }
  console.log(`✅ 스레드 ${threadList.threads.length}개 발견`);

  // 내 이메일 주소 확인 (미회신 판정용)
  const profile = gws(`gmail users get-profile --params '{"userId":"me"}'`);
  const myEmail = profile?.emailAddress || '';

  const rows = [];

  for (const t of threadList.threads) {
    const thread = gws(`gmail users threads get --params '{"userId":"me","id":"${t.id}","format":"full"}'`);
    if (!thread?.messages?.length) continue;

    const messages = thread.messages;
    const firstMsg = messages[0];
    const headers = firstMsg.payload?.headers || [];

    const date = getHeader(headers, 'Date');
    const from = getHeader(headers, 'From');
    const subject = getHeader(headers, 'Subject') || '(제목 없음)';
    const body = extractBody(firstMsg.payload);

    // 미회신 판정: 스레드 내 내 발신 메시지가 있는지 확인
    const hasMyReply = messages.slice(1).some(m => {
      const fromH = getHeader(m.payload?.headers || [], 'From');
      return fromH.includes(myEmail);
    });
    const unreplied = !hasMyReply;

    const { type, urgency, sentiment, score } = classify(subject, body, from);
    const summary = summarize(body);
    const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${t.id}`;

    rows.push([
      date,
      from,
      subject,
      summary,
      type,
      urgency,
      sentiment,
      score,
      unreplied ? '미회신' : '회신완료',
      gmailLink
    ]);
  }

  // 최신순 정렬 (수신일시 기준)
  rows.sort((a, b) => new Date(b[0]) - new Date(a[0]));

  console.log(`\n📊 Google Sheets 생성 중...`);

  // 새 스프레드시트 생성
  const newSheet = gws(`sheets spreadsheets create --json '{"properties":{"title":"Gmail 메일로그"},"sheets":[{"properties":{"title":"${SHEET_NAME}"}}]}'`);
  const spreadsheetId = newSheet?.spreadsheetId;
  if (!spreadsheetId) { console.error('❌ 스프레드시트 생성 실패'); return; }
  console.log(`✅ 스프레드시트 생성: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);

  const sheetId = newSheet?.sheets?.[0]?.properties?.sheetId ?? 0;

  // 헤더 + 데이터 쓰기
  const header = ['수신일시', '발신자', '제목', '내용 요약', '유형', '긴급도', '감정', '중요도', '미회신 여부', 'Gmail 링크'];
  const values = [header, ...rows];

  const writeResult = gws(`sheets spreadsheets values update --params '{"spreadsheetId":"${spreadsheetId}","range":"${SHEET_NAME}!A1","valueInputOption":"RAW"}' --json '${JSON.stringify({ values })}'`);
  if (!writeResult) { console.error('❌ 데이터 쓰기 실패'); return; }
  console.log(`✅ ${rows.length}행 데이터 입력 완료`);

  // 서식 적용 (batchUpdate)
  const totalRows = rows.length + 1;
  const requests = [
    // 헤더 굵게 + 배경색 (파란색)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            backgroundColor: { red: 0.26, green: 0.52, blue: 0.96 },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)'
      }
    },
    // 행/열 고정
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1, frozenColumnCount: 1 } }, fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount' } },
    // 필터 설정
    { setBasicFilter: { filter: { range: { sheetId, startRowIndex: 0, endRowIndex: totalRows, startColumnIndex: 0, endColumnIndex: 10 } } } },
    // 열 너비 자동조정
    { autoResizeDimensions: { dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 10 } } }
  ];

  // 긴급도 '상' → 빨강 배경 (F열=index5)
  if (rows.length > 0) {
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: 1, endRowIndex: totalRows, startColumnIndex: 0, endColumnIndex: 10 }],
          booleanRule: {
            condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: '상' }] },
            format: { backgroundColor: { red: 1.0, green: 0.8, blue: 0.8 } }
          }
        },
        index: 0
      }
    });
    // 미회신 → 노랑
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: 1, endRowIndex: totalRows, startColumnIndex: 0, endColumnIndex: 10 }],
          booleanRule: {
            condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: '미회신' }] },
            format: { backgroundColor: { red: 1.0, green: 0.95, blue: 0.6 } }
          }
        },
        index: 1
      }
    });
    // 중요도 8 이상 → 굵게 (H열=index7, 숫자 비교)
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: 1, endRowIndex: totalRows, startColumnIndex: 7, endColumnIndex: 8 }],
          booleanRule: {
            condition: { type: 'NUMBER_GREATER_THAN_EQ', values: [{ userEnteredValue: '8' }] },
            format: { textFormat: { bold: true } }
          }
        },
        index: 2
      }
    });
  }

  const formatResult = gws(`sheets spreadsheets batchUpdate --params '{"spreadsheetId":"${spreadsheetId}"}' --json '${JSON.stringify({ requests })}'`);
  if (formatResult) console.log('✅ 서식 적용 완료');

  // Gmail 링크 하이퍼링크로 변환
  const linkValues = rows.map((_, i) => [`=HYPERLINK("${rows[i][9]}","메일 열기")`]);
  gws(`sheets spreadsheets values update --params '{"spreadsheetId":"${spreadsheetId}","range":"${SHEET_NAME}!J2","valueInputOption":"USER_ENTERED"}' --json '${JSON.stringify({ values: linkValues })}'`);
  console.log('✅ Gmail 링크 하이퍼링크 적용 완료');

  // 완료 요약 보고
  const byType = {};
  let unrepliedCount = 0;
  let highImportanceCount = 0;

  rows.forEach(r => {
    byType[r[4]] = (byType[r[4]] || 0) + 1;
    if (r[8] === '미회신') unrepliedCount++;
    if (Number(r[7]) >= 8) highImportanceCount++;
  });

  console.log('\n' + '='.repeat(50));
  console.log('📋 완료 요약 보고');
  console.log('='.repeat(50));
  console.log(`📬 총 스레드 수: ${rows.length}건`);
  console.log('\n[유형별 건수]');
  Object.entries(byType).forEach(([k, v]) => console.log(`  · ${k}: ${v}건`));
  console.log(`\n⚠️  미회신: ${unrepliedCount}건`);
  console.log(`🔥 중요도 8 이상: ${highImportanceCount}건`);
  console.log('\n' + '='.repeat(50));
  console.log(`\n🔗 시트 링크: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
}

main().catch(console.error);
