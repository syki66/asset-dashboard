# 📈 자산 대시보드

신한투자증권의 계좌 거래내역 데이터(CSV)를 기반으로 파생 데이터를 생성하고, 이를 직관적인 대시보드와 차트로 시각화해 주는 웹 애플리케이션입니다.

기존 증권사 앱(MTS, HTS)은 제공되는 정보가 제한적이고 UI가 직관적이지 않아 투자자가 원하는 핵심 지표를 파악하기 어렵다는 문제를 해결하기 위해 제작되었습니다.

투자 성과, 자산 현황, 배당 수익, 위험도, 포트폴리오 구성, 거래 히스토리 등을 한눈에 확인할 수 있습니다.

🔗 **[Live Demo](https://asset.pokugi.com/setup?mode=demo)**

![자산 대시보드](./public/asset-dashboard.png)

## 🛠️ 기술 스택 (Tech Stack)

- **Framework**: Next.js (App Router), React
- **Language**: TypeScript
- **State Management**: Zustand
- **Data fetching**: TanStack Query, Axios
- **Backend / Auth**: Supabase Postgres, Supabase Auth
- **Styling / UI**: Tailwind CSS, shadcn/ui, Sonner, Lucide
- **Chart**: Recharts, d3-scale
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## 어떻게 사용하나요? 🤔 (Usage)

신한투자증권 신한알파(HTS)에서 거래내역 CSV를 내려받아 Setup 페이지에 업로드합니다.

1. 신한투자증권에 로그인합니다.
2. **자산현황** 메뉴로 이동합니다.
3. **[1750] 계좌별 거래내역(원장)**을 선택합니다.
4. **[00] 전체계좌**를 선택하고 **MMW내역**을 체크합니다.
5. 조회할 기간을 설정하고 조회 버튼을 누릅니다.
6. 화면에서 우클릭 후 **엑셀로 내보내기 (CSV)**를 선택합니다.
7. **/setup**에서 CSV를 업로드하고 설정을 완료합니다.

_(⚠️ 체험용 더미 데이터도 제공하고 있어, CSV 파일 없이도 기능을 둘러보실 수 있습니다.)_

## 🔒 데이터 처리 안내

Setup에서 업로드한 CSV와 계좌 거래내역은 서버에 저장되거나 외부로 업로드되지 않습니다. 브라우저에서 거래내역을 읽어 계좌 데이터를 계산하고, 보유 종목의 가격·히스토리·ETF 구성·섹터 정보를 표시하기 위해 필요한 종목 코드/심볼 기준의 공개 시장 데이터만 API로 조회합니다.

로그인한 사용자가 Setup의 저장 버튼을 누른 경우에만 선택한 CSV 묶음을 브라우저에서 gzip 압축한 뒤 AES-GCM으로 암호화해 Supabase Postgres의 `asset_data` 테이블에 저장합니다. `user_id`가 기본 키이므로 사용자별 한 행만 존재하며, 다시 저장하면 그 행을 덮어씁니다. CSV 파일명과 내용은 모두 암호문 안에 포함되고 암호화 비밀번호와 복호화된 CSV는 테이블에 저장되지 않습니다. RLS 정책은 로그인한 사용자가 자신의 행만 조회·추가·수정하도록 제한합니다.

저장된 CSV를 불러올 때는 로그인 인증과 RLS를 통과해 본인의 암호문을 조회한 뒤, 브라우저에서 입력한 암호화 비밀번호로 복호화하고 gzip 압축을 해제해 원본 CSV를 복원합니다. 암호가 다르면 복호화되지 않으며, 복원된 파일은 일반 파일 선택과 같은 검증 및 다음 단계 계산 로직을 사용합니다.

### CSV 암복호화 흐름

```mermaid
flowchart LR
  subgraph SAVE["저장"]
    A["CSV 파일 묶음"] --> B["gzip 압축"]
    B --> C["AES-GCM 암호화"]
    P1["암호화 비밀번호"] --> K1["PBKDF2 키 파생"]
    K1 --> C
    C --> D["Supabase에 암호문 저장"]
  end

  subgraph LOAD["불러오기"]
    E["Supabase 암호문 조회"] --> F["AES-GCM 복호화"]
    P2["암호화 비밀번호"] --> K2["PBKDF2 키 재생성"]
    K2 --> F
    F --> G["gzip 압축 해제"]
    G --> H["원본 CSV 복원"]
  end

  D --> E
```

서버로 올라가는 CSV는 브라우저에서 먼저 암호화되고 브라우저에서만 복호화되는 클라이언트 측 종단간 암호화 형태로 처리되며, Supabase에는 암호화 비밀번호 없이는 원본을 복원할 수 없는 암호문만 저장됩니다.

저장된 CSV를 앱에서 열려면 두 보안 단계를 모두 통과해야 합니다.

1. **로그인 비밀번호**: Supabase Auth 로그인과 RLS를 통과해 본인의 암호문을 조회합니다.
2. **암호화 비밀번호**: 브라우저에서 암호화 키를 파생해 조회한 암호문을 복호화합니다.

로그인 비밀번호는 데이터 암호화 키로 사용되지 않고 계정 인증에만 사용됩니다. 암호화 비밀번호와 파생 키는 서버에 저장되지 않으며, 암호화 비밀번호를 변경하려면 기존 암호로 데이터를 불러온 뒤 새 암호로 다시 저장해야 합니다.

암호화 비밀번호를 분실하면 로그인 비밀번호 재설정이나 서버 작업으로 복구할 수 없습니다. 서버에 복구용 키를 보관하지 않으므로 사전 대입이나 브루트포스 방식으로 비밀번호를 추측해 복구를 시도할 수는 있지만, 강한 비밀번호와 높은 키 파생 비용을 사용하면 현실적인 시간 안에 복구하기 어렵습니다. 다만 거래내역 CSV를 HTS에서 다시 발급받아 새 비밀번호로 저장할 수 있으므로 복구 불가능한 기존 암호문 자체의 중요도는 높지 않습니다.

## ✨ 주요 기능 (Key Features)

### ⚙️ 간편한 설정 (Setup & Settings)

|              Setup              |                    Settings                     |
| :-----------------------------: | :---------------------------------------------: |
| ![Setup](docs/images/setup.png) | ![Settings](docs/images/dashboard-settings.png) |

- **CSV 업로드 및 형식 검증**  
  신한투자증권에서 내보낸 거래내역 CSV를 끌어다 놓거나 직접 선택해 업로드할 수 있으며, 업로드 시 지원하는 CSV 형식인지 검증합니다.
- **계정별 암호화 CSV 저장**  
  여러 CSV 파일을 별도 비밀번호로 종단간 암호화해 계정별로 저장합니다. 서버에는 암호문만 저장되며, 복호화한 CSV는 기존 검증과 계산 흐름을 그대로 사용합니다.
- **계좌 합산 분석**  
  여러 CSV 계좌를 선택해 하나의 통합 포트폴리오로 병합하고, 선택 계좌 조합에 따라 대시보드를 다시 계산합니다.
- **예금 벤치마크 시뮬레이션**  
  실제 입출금 흐름을 예금 상품에 넣었다고 가정해 벤치마크를 생성합니다. best/worst 금리 시나리오를 제공하며, 금리는 사용자가 직접 수정할 수 있습니다.
- **과거 시점 기준 자산 조회**  
  특정 날짜를 선택해 해당 시점 기준의 자산 현황과 포트폴리오 상태를 확인할 수 있습니다.
- **수수료 / 세금 설정**  
  국내·미국 주식 매도 및 양도차익 비용, 환전 비용, 배당/이자 세율을 직접 설정할 수 있습니다.
- **파일별 원금 보정**  
  CSV에 누락된 초기 원금이나 출금성 보정값을 파일별로 입력할 수 있습니다. 보정값은 첫 거래일의 가상 입출금 거래로 반영됩니다.
- **계좌별 요약 정보 확인**  
  계좌를 선택하기 전에 원금, 예수금, 보유 종목, 거래내역 기간, 최근 업로드 시점을 확인할 수 있습니다.
- **체험용 더미 데이터 제공**  
  실제 거래 데이터가 없어도 주요 화면과 계산 결과를 확인할 수 있도록 샘플 CSV 데이터를 제공합니다.

### 📊 종합 대시보드 & 공통 기능

![Overview](docs/images/dashboard-overview.png)

- **핵심 지표 요약 제공**  
  성과, 배당, 현금 보유액, 포트폴리오 구성, 매매 기록, 리스크 지표 등 각 분석 페이지의 주요 정보를 한 화면에 요약해 보여줍니다.
- **대시보드 카드 제공**  
  주요 자산 지표를 카드 형태로 제공해 전체 자산 상태를 빠르게 파악할 수 있습니다.
- **통화 및 세금 기준 전환**  
  USD/KRW 통화 전환과 세전/세후 기준 전환을 지원해 같은 데이터를 다양한 기준으로 확인할 수 있습니다.
- **차트 분석 옵션 제공**  
  로그 스케일, 인플레이션 보정, 기간 설정, 시리즈 토글을 지원해 필요한 데이터만 선택적으로 확인할 수 있습니다.
- **날짜 기준 조회 지원**  
  계좌 조회 기준일을 설정해 특정 시점의 자산 현황을 확인할 수 있고, 업로드된 파일의 최근 업데이트 날짜도 함께 확인할 수 있습니다.
- **화면 보기 방식 전환**  
  데스크톱에서는 차트를 펼쳐보기 또는 모아보기로 전환할 수 있고, 모바일은 가독성을 위해 펼쳐보기로 고정됩니다.
- **반응형 모바일 UI 지원**
  데스크톱뿐 아니라 모바일에서도 Setup, 대시보드, 차트와 표를 편리하게 확인하고 조작할 수 있습니다.
- **Toast 알림 제공**  
  파일 업로드, 설정 적용, 데이터 조회 실패 등 주요 처리 결과와 발생한 오류 내역을 Toast 메시지로 안내합니다.
- **계산 결과 캐싱**  
  이미 연산된 계좌 조합과 통화 기준의 대시보드 결과를 캐시해, 환전/세금 설정이나 화면 옵션을 바꾼 뒤에도 같은 조건의 결과를 빠르게 다시 불러옵니다.

### 📈 수익성 분석

![Performance](docs/images/dashboard-performance.png)

- **수익률 / 수익금 분석**  
  원금, 평가금액, 누적수익금, 누적수익률, MWR, TWR, CAGR, 단순연평균수익률, 벤치마크 대비 초과수익, 연도별 수익금을 표와 차트로 제공해 투자 성과를 여러 관점에서 확인할 수 있습니다.
- **예금 벤치마크 비교 분석**  
  Setup에서 설정한 best/worst 금리 시나리오를 바탕으로 같은 입출금 흐름을 예금에 넣었을 때의 결과를 시뮬레이션하고, 실제 포트폴리오 성과와 표 및 차트로 비교합니다. 그래프에서는 best/worst 벤치마크 사이를 범위로 표시해 예금 대비 성과 구간을 직관적으로 확인할 수 있습니다.
- **세금 및 제비용 내역 확인**  
  해외주식 양도소득세, 증권거래세, 매매 수수료, 환전 수수료, SEC 수수료, 유관기관 비용 등 추정 비용을 확인할 수 있습니다.

### 💸 이자 및 배당 수익

![Dividends](docs/images/dashboard-dividends.png)

- **배당 핵심 지표 제공**  
  최근 1년 배당금, 배당률, 원금 대비 배당률(YOC)과 전체 기간 누적 배당금을 함께 확인할 수 있습니다.
- **기간별 배당금 그래프**  
  기간별 배당금 지급 내역을 막대그래프로 표시해 배당 현금흐름을 직관적으로 보여줍니다.
- **배당금 물가 보정**  
  배당금 막대 차트를 최신 CPI 기준 구매력으로 환산해 명목 금액과 비교할 수 있습니다.
- **배당률 변화 추이 차트**  
  평가금 대비 배당률과 원금 대비 배당률(YOC)을 선 그래프로 표시해 시간에 따른 배당 효율 변화를 확인할 수 있습니다.

### 🚨 리스크 관리

![Risk](docs/images/dashboard-risk.png)

- **최대 손실 낙폭(MDD) 확인**  
  최대 손실 낙폭과 손실 시작일, 종료일, 회복 일수를 함께 표시합니다.
- **일간 최대 낙폭 확인**  
  하루 기준 최대 하락 금액과 해당 낙폭이 발생한 날짜를 확인할 수 있습니다.
- **손실 낙폭 차트 제공**  
  고점 대비 손실 구간과 회복 흐름을 차트로 표시하며, 기간을 선택해 구간별 낙폭을 확인할 수 있습니다.
- **90거래일 롤링 리스크 지표**  
  최근 90거래일의 TWR 일별 수익률을 기반으로 변동성을 계산하고, 사용자가 입력한 금리 데이터를 무위험 수익률로 가정해 샤프지수를 산출하여 두 지표의 변화 추이를 차트로 제공합니다.

### 🍕 포트폴리오 분석

![Portfolio](docs/images/dashboard-portfolio.png)

- **포트폴리오 요약 지표 제공**  
  실보유한 종목 수, ETF 내부 구성까지 반영한 구성 종목 수, 종목 집중도, 섹터 집중도를 카드로 제공합니다. 집중도는 현금을 포함한 전체 자산 비중을 기준으로 계산한 HHI를 백분율로 환산해 표시합니다.
- **포트폴리오 구성 현황 확인**  
  전체 자산 기준 종목과 현금 비중을 파이 차트와 목록으로 표시합니다. ETF는 구성 종목 정보를 개별 주식 비중으로 환산해 함께 반영합니다.
- **섹터 비중 분석**  
  섹터별 자산 비중을 파이 차트와 목록으로 함께 제공하며, 현금까지 포함한 전체 자산 기준으로 계산합니다.
- **보유 주식 간략 / 상세 조회**  
  기본 보기에서는 종목, 수량, 평가금, 수익 정보를 빠르게 확인하고, 상세 보기에서는 티커, 보유 수량, 평가금액, 매수금액, 손익, 수익률, 현재가, 평균단가까지 확인할 수 있습니다.

### 📚 거래 내역 관리

![Transaction](docs/images/dashboard-transaction.png)

- **매수 / 매도 막대그래프 표시**  
  주식 매수는 양수 방향, 매도는 음수 방향으로 표시해 같은 시점의 거래 흐름을 직관적으로 확인할 수 있습니다.
- **기간별 조회 및 합산 단위 변경**  
  전체 기간 또는 특정 연도를 조회할 수 있고, 일별 / 월별 / 연도별 기준으로 거래를 합산해 볼 수 있습니다.
- **수량 기준 / 금액 기준 전환**  
  거래 그래프를 수량 기준 또는 거래금액 기준으로 전환할 수 있습니다.
- **종목별 표시 토글 지원**  
  거래한 종목 목록을 토글로 선택해 차트에 표시하거나 숨길 수 있습니다.
- **거래 요약 카드 제공**  
  차트 상단에서 총 매수, 총 매도, 순매매와 매수·매도 종목 수를 확인할 수 있습니다. 매수·매도 수량과 거래금액을 함께 표시하며, 선택한 기간과 종목 필터를 동일하게 반영합니다.

## 🚀 개발 서버 (Configuration & Setup)

### 📦 요구 사항

- Node.js 20+ 권장
- npm

### 💻 설치 및 실행

```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev
```

### Supabase 사용자 데이터 저장 설정

1. `cp .env.example .env.local`을 실행하고 실제 프로젝트 값으로 교체합니다.
2. `supabase/schema.sql`을 Supabase SQL Editor에서 실행합니다.
3. Supabase Auth의 이메일/비밀번호 로그인을 활성화합니다.
4. `.env.local`과 Vercel 환경변수에 다음 값을 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### 📋 테스트

현재 테스트는 주요 계산 유틸과 API 파싱 로직 중심입니다.

```bash
npm run test
```

### 🔍 코드 품질 검사

커밋 전에는 Husky pre-commit 훅이 실행되어 lint와 test를 순서대로 검증합니다.
둘 중 하나라도 실패하면 커밋이 중단됩니다.

push 전에는 Husky pre-push 훅이 실행되어 Next.js 프로덕션 빌드를 검증합니다.

```bash
# pre-commit
npm run lint
npm run test

# pre-push
npm run build
```

### 🌐 배포

- **Vercel · GitHub 연동 자동 배포**  
  GitHub 저장소와 Vercel을 연동하여 커밋 또는 푸시 시 자동으로 빌드 및 배포되도록 구성했습니다.
  별도의 배포 작업 없이 항상 최신 상태가 서비스에 반영됩니다.

## 디렉토리 구조

```txt
asset-visualizer/
├── app/
│   ├── api/                    # 종목 검색, 가격 히스토리, ETF holdings/sectors API
│   ├── dashboard/              # 대시보드 레이아웃과 분석 페이지
│   │   ├── overview/           # 종합 대시보드
│   │   ├── performance/        # 수익성 분석
│   │   ├── dividends/          # 이자 및 배당
│   │   ├── risk/               # 리스크 관리
│   │   ├── portfolio/          # 포트폴리오 분석
│   │   ├── transaction/        # 거래 내역
│   │   └── settings/           # 계좌 선택 및 설정
│   ├── login/                  # Supabase 이메일 인증 화면
│   ├── services/data/          # Yahoo Finance 응답 변환
│   ├── setup/                  # CSV 업로드 및 초기 설정
│   ├── globals.css             # 전역 스타일과 테마 변수
│   ├── layout.tsx              # 루트 레이아웃
│   └── page.tsx                # 초기 진입 페이지
├── components/
│   ├── auth/                   # 인증 세션 Provider와 로그인 폼
│   ├── chart/                  # 자산, 배당, 포트폴리오, 거래내역 차트
│   ├── dashboard/              # 대시보드 카드, 비교표, 보유 종목 테이블
│   ├── footer/                 # Disclaimer
│   ├── stepper/                # Setup 단계별 입력 컴포넌트
│   └── ui/                     # 공통 UI 컴포넌트
├── constants/
│   ├── keywords.ts             # 기본 환율, 세율, 수수료, 심볼
│   └── korea-cpi-indexes.ts    # 한국 월별 소비자물가지수 원지수
├── lib/
│   ├── asset-data-crypto.ts    # CSV gzip 압축과 AES-GCM 암복호화
│   ├── setup-mode.ts           # default/demo/admin 진입 모드 판별
│   └── supabase/               # 브라우저 Supabase client
├── store/                      # Zustand 전역 상태
├── supabase/schema.sql         # asset_data 테이블과 강제 RLS 정책
├── types/                      # 주요 타입 정의
├── utils/
│   ├── converter.ts            # 계좌 데이터 생성, 병합, 대시보드 데이터 변환
│   ├── dashboard-calculation-cache.ts # 계좌 조합·DashboardDataset LRU 캐시
│   ├── shsec-adapter.ts        # 신한 CSV 파싱 및 거래 정규화
│   ├── generator.ts            # 예금 벤치마크 생성
│   ├── inflation.ts            # CPI 기준 금액 보정
│   ├── mergeHelpers.ts         # 배당/종목/거래 이력 병합
│   ├── risk.ts                 # 변동성, 샤프지수 계산
│   ├── security-identifiers.ts # 미국 ISIN에서 CUSIP 추출
│   ├── twr.ts                  # TWR 계산
│   ├── xirr.ts                 # XIRR/MWR 계산
│   └── year-performance.ts     # 연도별 성과 계산
├── public/                     # 샘플 CSV, README 이미지 등 정적 파일
├── jest.config.js              # Jest 설정
├── package.json
└── README.md
```

## 주요 데이터 흐름

```mermaid
flowchart TD
  A[신한투자증권 CSV] --> B[shsecCsvToJson]
  B --> C[createShsecTransactions]
  C --> T[TransactionProps 거래 목록]

  S[Setup 설정값] --> S1[원금 보정]
  S --> S2[수수료/세금 설정]
  S --> S3[금리 best/worst 설정]

  T --> E[createAccountData]
  S1 --> E
  E --> F[계좌별 AccountProps 날짜 시계열]

  T --> G[createBenchmarkData]
  S3 --> G
  G --> H[예금 벤치마크 날짜 시계열]

  F --> I[useAccountStore.totalAccountData]
  H --> I

  I --> J[선택 계좌 필터링]
  O2[Setup 완료 또는 Settings 계좌 적용] --> J
  O1[표시 통화 USD/KRW 변경] --> J
  S2 --> J
  J --> K[mergeAccountData]
  K --> L[convertToDashboardData]
  L --> DATA[DashboardDataset]

  DATA --> M1[snapshots: 날짜별 계산 지표]
  DATA --> M2[charts: 전체 기간 차트 1벌]
  DATA --> M3[accountData: 선택 날짜 보유종목 생성·통화 환산용 원본]
  DATA --> M4[currency: 보유종목 표시 통화]

  M1 --> N[getDashboardDataByDate]
  M2 --> N
  M3 --> N
  M4 --> N
  N --> N1[선택 날짜 스냅샷 검색]
  N --> N2[선택 날짜 stocks만 환산·복제]
  N --> N3[최신 차트 재사용 또는 과거 구간 절단]
  N1 --> D[선택 날짜 DashboardProps]
  N2 --> D
  N3 --> D
  D --> DS[useDashboardStore.dashboardData]
  DS --> O[대시보드 화면 렌더링]
  TAX[세전/세후 표시 토글] --> O
```

## 주요 파일 및 함수

| 파일                       | 함수 / 상태               | 역할                                                                                                                       |
| -------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `utils/shsec-adapter.ts`   | `shsecCsvToJson`          | 신한 CSV 문자열을 JSON 배열로 변환합니다.                                                                                  |
| `utils/shsec-adapter.ts`   | `createShsecTransactions` | 신한 거래 구분값을 앱 내부 거래 형식인 `TransactionProps[]`로 정규화합니다.                                                |
| `utils/converter.ts`       | `createAccountData`       | 거래 목록을 날짜별 계좌 스냅샷인 `AccountProps[]`로 변환합니다.                                                            |
| `utils/converter.ts`       | `mergeAccountData`        | 여러 계좌의 날짜별 데이터와 벤치마크를 copy-on-write 방식으로 병합하며, 변경되지 않은 하위 데이터는 readonly로 공유합니다. |
| `utils/converter.ts`       | `convertToDashboardData`  | 병합 데이터를 전체 기간 MWR이 계산된 날짜별 표시 스냅샷과 공용 차트 한 벌을 가진 `DashboardDataset`으로 변환합니다.        |
| `utils/converter.ts`       | `getDashboardDataByDate`  | 이진 검색으로 조회 스냅샷을 찾고, 선택 날짜의 보유종목과 과거 차트 구간을 결합해 최종 `DashboardProps`를 만듭니다.         |
| `utils/generator.ts`       | `createBenchmarkData`     | 실제 입출금 흐름을 예금 상품에 넣었다고 가정해 best/worst 벤치마크 데이터를 생성합니다.                                    |
| `app/setup/page.tsx`       | `Page`                    | CSV 업로드부터 원금 보정, 수수료/세금, 금리 설정까지 처리하고 계좌 데이터를 생성합니다.                                    |
| `app/dashboard/layout.tsx` | `DashboardLayout`         | 대시보드 공통 레이아웃을 구성하며, 선택 계좌와 통화 기준에 따라 데이터를 병합/변환하고 대시보드 전역 상태를 갱신합니다.    |
| `app/dashboard/*`          | `Page`                    | 레이아웃이 전역 상태에 구체화한 `DashboardProps`를 사용해 각 분석 화면을 렌더링하고 세전/세후 및 차트 옵션을 적용합니다.   |

## 데이터 모델

핵심 타입은 `types/index.d.ts`에 있습니다.

```mermaid
classDiagram
  class TransactionProps {
    date
    type
    currency
    ISIN
    quantity
    price
    krwCash
    usdCash
    dividendSource
  }
  class AccountProps {
    date
    lastUpdated
    fxRate
    krw
    usd
  }
  class ReadonlyAccountProps {
    DeepReadonly AccountProps
  }
  class DashboardSnapshot {
    date
    lastUpdated
    fxRate
    performance
    dividends
    cash
    costs
    benchmarkBest
    benchmarkWorst
    drawdown
  }
  class DashboardCharts {
    전체 기간 누적 차트 배열
  }
  class DashboardDataset {
    DashboardSnapshot[] snapshots
    DashboardCharts charts
    ReadonlyAccountProps[] accountData
    Currency currency
  }
  class DashboardProps {
    date
    lastUpdated
    fxRate
    performance
    dividends
    cash
    costs
    stocks
    benchmarkBest
    benchmarkWorst
    drawdown
    charts
  }
  class MergeAccountDataInput {
    name
    accountData
    benchmarkBestData
    benchmarkWorstData
  }
  TransactionProps --> AccountProps
  AccountProps --> MergeAccountDataInput
  MergeAccountDataInput --> ReadonlyAccountProps : mergeAccountData
  ReadonlyAccountProps --> DashboardDataset : convertToDashboardData
  DashboardDataset *-- DashboardSnapshot : snapshots
  DashboardDataset *-- DashboardCharts : charts 1벌
  DashboardDataset o-- ReadonlyAccountProps : accountData 참조
  DashboardDataset --> DashboardProps : getDashboardDataByDate
```

### TransactionProps

CSV에서 추출한 거래내역을 앱 내부에서 사용하기 위해 정규화한 단위 거래 데이터입니다. `deposit`, `withdrawal`, `buy`, `sell`, `dividend` 등의 거래 유형이 들어갑니다.

`dividendSource`는 배당/이자 수익의 원천을 나타내며, 국내/해외 배당세율을 구분해 적용하는 데 사용됩니다.

`krwCash`, `usdCash`는 해당 거래가 반영된 이후의 원화/달러 현금 잔고를 의미합니다. 이후 `createAccountData`에서 날짜별 계좌 상태를 만들 때 예수금 기준값으로 사용됩니다.

### AccountProps

날짜별 계좌 스냅샷입니다. `createAccountData`가 거래내역을 순서대로 처리하면서 각 날짜의 계좌 상태를 `AccountProps`로 저장합니다.

`krw`와 `usd`는 각각 현금 잔고, 배당금 내역, 주식 거래내역, 주식 잔고를 원본 통화 기준으로 따로 저장합니다. 원금과 벤치마크는 입출금 시점의 환율을 기준으로 KRW/USD 양쪽 값을 함께 누적 계산해 저장합니다.

`stocksProfit`은 해당 날짜 기준 보유 주식의 평가손익입니다. `createAccountData`에서 현재가와 평균매수가의 차이를 기반으로 미리 계산해두고, 이후 `convertToDashboardData`에서 선택 통화로 환산해 낙폭/리스크 차트 데이터에 사용합니다.

이후 `convertToDashboardData`가 사용자가 선택한 KRW/USD 표시 통화에 맞춰 모든 날짜의 숫자 지표를 환산·합산합니다. 보유종목은 전체 날짜에 미리 복제하지 않고, `getDashboardDataByDate`가 선택 날짜의 `stocks`와 각 `balance`만 환산합니다.

### DashboardDataset / DashboardSnapshot

`DashboardDataset`은 Setup 완료 또는 Settings 계좌 적용 시 전체 기간을 선계산하는 중간 모델입니다. 날짜별 표시 지표와 MWR 6종은 `snapshots`에, 누적 시계열은 `charts` 한 벌에 저장해 모든 날짜마다 같은 차트 배열과 보유종목 목록을 복제하지 않습니다. `accountData`와 `currency`는 선택 날짜의 보유종목을 환산할 때 사용합니다.

`convertToDashboardData`가 `DashboardDataset`을 반환하면 `DashboardLayout`의 `commitDashboardDataset`이 이를 현재 선택 날짜와 함께 `getDashboardDataByDate`에 전달해 화면용 `DashboardProps`를 만듭니다.  
이후 조회 날짜만 바뀌면 계좌 병합과 전체 기간 변환은 다시 실행하지 않고 기존 데이터셋에 `getDashboardDataByDate`만 적용합니다. 계산 캐시에 적중한 경우에도 `mergeAccountData`와 `convertToDashboardData`를 건너뛰고 캐시된 데이터셋부터 같은 과정을 진행합니다.

`DashboardSnapshot`에는 날짜와 최근 업데이트일, 성과·배당·현금·비용·벤치마크·낙폭 및 연도별 성과처럼 해당 날짜에 필요한 표시 지표가 들어갑니다. 크기가 계속 누적되는 `charts`, `stocks`, 원본 `stockTradeHistory`는 스냅샷에 넣지 않습니다. 거래 차트는 마지막 계좌 상태의 누적 거래내역에서 한 번 생성해 `DashboardDataset.charts`에 저장합니다.

### DashboardProps

선택한 한 날짜의 화면 표시용 최종 데이터입니다. `getDashboardDataByDate`가 요청일 이하의 가장 가까운 스냅샷을 이진 검색하고, 해당 날짜에 환산한 `stocks`와 선택일까지의 `charts`를 결합합니다. MWR 6종을 포함한 숫자 지표는 계좌 적용 단계에서 이미 계산되어 있습니다.

### Readonly와 copy-on-write 병합

병합 과정에서는 `DeepReadonly` 타입을 사용해 입력 데이터를 그대로 유지합니다. `mergeAccountData`와 병합 helper는 실제로 변경되는 객체와 배열만 새로 만들고, 바뀌지 않은 데이터는 기존 참조를 재사용합니다. `Object.freeze`를 적용한 것은 아니므로, 공유된 데이터를 수정해야 한다면 먼저 복사한 뒤 변경해야 합니다.

## API 라우트

| Route                                | 역할                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `app/api/search/[ISIN]/route.ts`     | Yahoo Finance Search API에서 종목 코드/ISIN 기반 symbol, shortName, longName 조회                  |
| `app/api/history/[symbol]/route.ts`  | Yahoo Finance Chart API에서 주가/환율 히스토리, 배당, 액면분할/액면병합 이벤트 조회 후 가공해 반환 |
| `app/api/holdings/[symbol]/route.ts` | Vanguard/Invesco API에서 ETF 구성 종목과 비중을 조회 후 가공해 반환                                |
| `app/api/sectors/[symbol]/route.ts`  | Vanguard/Invesco API에서 지원 ETF의 섹터 비중을 조회 후 가공해 반환                                |

클라이언트는 Yahoo Finance, Vanguard, Invesco를 직접 호출하지 않고 Next.js API Route를 프록시 서버처럼 거쳐 필요한 공개 시장 데이터를 가져옵니다.

브라우저에서 외부 API를 직접 호출할 때 발생할 수 있는 CORS 제한을 피하고, 응답 데이터를 화면에서 쓰기 좋은 형태로 가공하기 위해 Next.js API Route가 중간 프록시 역할을 하도록 구성했습니다.

외부 API 호출량을 줄이기 위해 Next.js `fetch`의 `revalidate` 옵션을 사용한 데이터 캐시를 적용합니다. 주가·환율 히스토리는 8시간, 종목 검색과 ETF 구성 종목·섹터 정보는 24시간 동안 같은 요청의 응답을 재사용하며, 유효시간이 지난 뒤 들어온 다음 요청에서 데이터를 갱신합니다.

## ⚡ 계산 성능 최적화

계좌 선택 적용 시 브라우저 메인 스레드에서 반복되던 XIRR 계산, 누적 배열 병합, 날짜별 차트·보유종목 복사를 다음과 같이 줄였습니다.

- **계좌 조합 및 계산 결과 LRU 캐시**
  같은 계좌 조합으로 돌아오면 병합 결과를 재사용하고, 수수료·세율·금리 입력 객체가 변경되지 않은 상태에서 같은 표시 통화로 돌아오면 완성된 `DashboardDataset`도 재사용합니다. 캐시 적중 시 무거운 병합과 전체 변환을 건너뛰고 계산 상태를 바로 종료합니다.
- **XIRR 전처리 및 배치 계산**
  같은 입출금 이력을 한 번만 전처리하고 현재가·세후 현재가·best/worst 벤치마크의 최종 현금흐름 6개를 한 배치로 계산합니다.
- **Copy-on-write 계좌 병합**
  `DeepReadonly` 경계 안에서 변경되지 않은 잔고와 거래 데이터를 구조적으로 공유하고, 계좌 간 충돌이 생긴 wrapper와 배열만 새로 만듭니다.
- **스냅샷과 차트 분리**
  날짜별 `DashboardSnapshot`에는 `stocks`와 누적 `charts`를 제외한 해당 날짜의 표시 지표만 저장하고 전체 기간 차트는 `DashboardDataset`에 한 벌만 보관합니다. 과거 날짜 조회 시에만 차트를 선택 날짜까지 자릅니다.
- **선택 날짜의 보유종목만 구체화**
  모든 날짜의 KRW/USD 보유종목을 미리 환산하지 않고, 사용자가 조회한 한 날짜의 `stocks`와 `balance`만 새 객체로 환산·복제합니다.
- **누적 배당·거래 차트 1회 생성**
  날짜마다 같은 누적 이력을 다시 변환하지 않고 마지막 계좌 스냅샷의 누적 데이터에서 한 번만 차트를 생성합니다.

### 실데이터 벤치마크

아래 값은 4개 CSV의 계좌 시계열 7,637개를 병합해 1,966일의 대시보드를 만드는 시나리오에서 워밍업 후 3회 실행한 중앙값입니다. 로컬 Node 단일 프로세스의 순수 계산 시간으로 네트워크 요청, React 렌더링과 브라우저 paint는 포함하지 않았으며 실행 환경과 데이터 구성에 따라 달라질 수 있습니다.

| 측정 구간                               |  중앙값 |
| --------------------------------------- | ------: |
| 계좌 병합                               | 1,264ms |
| 전체 기간 MWR 포함 변환                 | 1,444ms |
| 계좌 적용 전체 계산 (`merge + convert`) | 2,708ms |

별도의 기간별 XIRR 격리 벤치마크에서는 전체 기간의 MWR 6개 시계열 계산이 약 33.7초에서 0.543초로 줄었습니다. 날짜별 스냅샷에 차트와 보유종목을 복제하던 변환 결과의 JSON 직렬화 크기도 약 272MB에서 7.60MB로 감소했습니다. 새 크기는 `snapshots + charts` 기준의 근사치이며, 구조적으로 공유하는 원본 `accountData` 참조와 전체 프로세스 heap은 포함하지 않습니다.

## 🚧 개발 주의사항 & 한계점

### 데이터 모델을 변경할 때 함께 확인할 항목

- `createAccountData` 또는 `AccountProps`에 날짜별 누적 필드를 추가하면 `mergeAccountData`의 병합 로직도 추가해야 합니다. 대표적으로 `principalAmount`, `cash`, `stocksProfit`, 배당, 종목, 거래내역과 best/worst 벤치마크 값이 병합 대상입니다. 배열은 필요하면 `utils/mergeHelpers.ts`에 전용 `Map` 기반 helper를 추가합니다.
- `DashboardProps`에 필드를 추가하면 `store/dashboard.ts`의 `initialDashboardData`와 `DashboardSnapshot` 생성·선택일 구체화 경로를 함께 갱신합니다.
- 새 차트 배열을 추가하면 `DashboardProps.charts`, `initialDashboardData.charts`, `convertToDashboardData`와 해당 대시보드 화면의 단위·표시 옵션을 함께 확인합니다.
- 새 설정값이 병합 또는 변환 결과에 영향을 주면 `app/dashboard/layout.tsx`의 effect 의존성과 `DashboardCalculationCache`의 데이터셋 키도 함께 갱신합니다. 현재 키는 계좌 조합·표시 통화와 수수료/세율·best/worst 금리 배열의 객체 식별자를 사용합니다.
- copy-on-write 병합이 구조적으로 공유한 객체는 직접 수정하지 않습니다. 변경이 필요하면 해당 객체와 그 상위 경로를 새로 만들어 교체합니다.

### 로그인 기능은 admin 모드에서만 활성화

Setup 진입 모드는 `mode` 쿼리 하나로 구분합니다. 일반 화면은 `/setup`, 체험 화면은 `/setup?mode=demo`, 암호화 CSV 관리 화면은 `/setup?mode=admin`을 사용합니다. `mode=admin`은 로그인하지 않은 사용자를 먼저 `/login`으로 보내며, 로그인 후 원래 관리 화면으로 돌아옵니다.

Supabase Auth 기반 로그인·회원가입·세션 관리와 사용자별 암호화 CSV 저장 기능 자체는 구현되어 있습니다. 다만 현재는 `/setup?mode=admin`으로 진입한 경우에만 로그인을 강제하고 암호화 CSV 관리 UI를 표시하며, Supabase Auth 설정에서도 신규 회원가입을 비활성화한 상태입니다.

이 제한은 기능 개발이 완료되지 않아서가 아니라, 공개 운영 전 임의 계정 생성과 불필요한 Auth 사용자·DB 트래픽·저장공간 사용을 방지하기 위한 것입니다. Supabase Auth에서 신규 회원가입을 활성화하고 `mode=admin` 진입 제한을 제거하면 별도의 백엔드 추가 구현 없이 로그인부터 암호화 CSV 저장·불러오기까지 정상적으로 사용할 수 있습니다.

일반 `/setup`과 `/setup?mode=demo`는 로그인 없이 이용할 수 있으며, 이 경로에서는 Supabase 저장·불러오기 UI가 노출되지 않습니다. 향후 로그인 기능을 일반 사용자에게 공개할 경우 Setup 진입 조건과 메뉴 연결 범위를 함께 수정해야 합니다.

### 신한투자증권 CSV의 컬럼명이나 형식이 변경되면 파싱에 실패할 수 있습니다.

이 경우 `utils/shsec-adapter.ts`의 `shsecCsvToJson`과 `createShsecTransactions`를 확인해야 합니다.

### 외화 RP 거래는 관련 거래내역을 함께 봐야 함

신한 거래내역에서 외화 RP는 하나의 거래 행만으로 처리하지 않습니다. 현재 `createShsecTransactions`는 RP 잔고, 이자 금액을 맞추기 위해 아래 구분값들을 함께 해석합니다.

#### 외화 RP 잔고 추적

- `외화RP_매수`, `외화RP_재투자매수`: `수량`만큼 USD RP 잔고를 증가시킵니다.
- `외화RP_매도`, `외화RP_재투자환매`: `수량`만큼 USD RP 잔고를 감소시킵니다.

#### 외화 RP 이자 수익 추적

##### 방법1: 외화 RP 매도 거래를 기준으로 이자 수익을 역산 (현재 적용 중)

같은 외화 RP 상품을 여러 번에 나누어 매도하더라도 `외화RP_매도` 또는 `외화RP_재투자환매` 행의 `수량`에는 `[매수 원금 + 이자]`가 들어가고, 이어지는 `외화RP매도입금` 행의 `거래대금`에는 `[매수 원금]`이 들어갑니다. 그래서 두 값을 비교해 각 매도 단위의 이자만 분리할 수 있고, 분할 매도 상황에서도 이자 수익 계산이 정확합니다.

##### 방법2: 원천징수된 세금값으로 외화 RP 이자 추적

`외화RP원천징수` 행으로도 배당/이자 수익을 역산하는 보조 방법은 있습니다. 원천징수 직전의 `환전입금` 거래에 기록된 달러 금액을 보고 원천징수 세율을 역산하면 세전 배당/이자 값을 추정할 수 있습니다. 다만 이 방식은 두 거래내역 사이에 다른 환전 거래가 끼어들면 꼬일 수 있습니다. 실제로는 보통 1초 이내에 연속 실행되어 가능성은 낮습니다. 또한 주말에 외화 RP가 매도된 경우에는 세금 반영이 평일까지 지연될 수 있습니다.

##### 방법 비교

현재 적용된 `방법1`의 로직은 이자 수익을 정확히 추적할 수 있으며 (세금에서 오차 발생), `방법2`를 사용할 경우 세금을 정확하게 추적할 수 있습니다. (이자 수익에서 오차 발생)

추후 방법1, 방법2를 모두 적용하면 이자와 세금까지 정확히 추적할 수 있습니다. (현재는 1번 방법에서 15.4% 세율로 세금 추정)

### 국내 이자 세금은 세율로 일괄 계산

`증금예금_증금예금상환`, `RP_매도`는 CSV 거래내역에 세금과 수수료 값이 있지만 현재 로직에서는 해당 값을 직접 사용하지 않습니다. 세후 보기가 적용되면 국내 이자 세율 15.4%를 일괄 적용합니다.

### 액면분할/액면병합 수량 보정은 추후 반영

Yahoo Finance에서 액면분할/액면병합 이벤트를 받아와 `preSplitClose`를 계산하는 이유는 과거 시점의 계좌를 조회할 때 당시 기준의 가격으로 자산을 보기 위해서입니다.

다만 보유 수량과 평균단가 보정은 아직 구현하지 않았습니다. 현재 개발에 사용된 신한투자증권 거래내역 CSV에서 액면분할/액면병합이 발생한 사례가 없어서, 신한 거래내역 CSV에 분할/병합이 어떤 구분값과 수량으로 표시되는지 확인할 실제 데이터가 없기 때문입니다.

추후 신한 거래내역에서 액면분할/액면병합 데이터가 확인되면, 해당 CSV 형식을 기준으로 `createAccountData`에서 분할/병합 발생 시점 이후의 보유 수량과 평균단가를 조정하도록 수정할 예정입니다.

### 대체출고 거래 구분은 추정값

`타사대체출고`, `계좌대체출고`, `은행이체외화출금`은 현재 개발에 사용한 CSV에 실제 사례가 없어 예상 구분값으로 추가해 둔 상태입니다. 추후 신한투자증권 거래내역에서 실제 데이터가 확인되면 해당 구분값과 컬럼 의미에 맞춰 `createShsecTransactions`의 출고/출금 처리 로직을 수정해야 합니다.

### 현금 잔고는 반영 시점에 따라 오차가 있을 수 있음

현금 잔고는 모든 현금 흐름을 독립적으로 재계산하는 방식이 아니라, 신한 CSV의 특정 거래내역에 기록된 최종 예수금 값을 기준으로 갱신합니다. 따라서 거래내역 반영 시점의 딜레이나 환전 시 중복 집계 문제 등으로 인해 특정 기간의 현금 잔고가 실제 계좌와 다르게 보일 수 있습니다.

> ex. 현금량이 찍힌 거래내역 사이에 다른 통화를 환전할 경우 양쪽 통화로 중복 집계됨

### 달러 예수금 소수점 기록 규칙은 불명확

신한 CSV의 달러 예수금 `최종금액`은 소수점 또는 정수로 기록될 수 있습니다. 같은 `구분`값의 거래내역 안에서도 두 표기 방식이 함께 확인되어, 어떤 방식으로 기록되는지에 대한 일정한 규칙은 아직 확인되지 않았습니다.

### 시작일 선택 대신 조회일만 지원하는 이유

현재 계좌 날짜 선택은 기간 범위가 아니라 대시보드에서 확인할 조회일을 정하는 기능입니다. 계좌 데이터는 첫 거래일부터 당일까지 계산되고, 사용자는 그중 특정 날짜의 스냅샷을 선택해 확인합니다.

이렇게 처리하는 이유는 현금 잔고 추적 방식 때문입니다. 현재 현금 잔고는 특정 거래내역에 기록된 최종 예수금 값을 기준으로 갱신되므로, 중간 날짜부터 거래내역을 잘라 계산하더라도 현금 잔고는 전체 기간 흐름에 의존합니다. 즉 임의의 `startDate`만 지정해서는 시작일 시점의 원화/달러 예수금과 외화 RP 잔고를 정확히 복원하기 어렵습니다.

추후 모든 거래내역을 기반으로 현금 잔고를 정확하게 추적할 수 있게 되면, `createAccountData`에 `startDate`를 전달해 사용자가 원하는 기간 범위를 선택해서 계산할 수 있도록 수정할 예정입니다.

### MDD는 주식 평가손익 기준으로 계산

전체 평가금 기준으로 MDD를 계산하면 현금 잔고 반영 시점의 오차뿐 아니라 입출금에 따른 평가금 증감까지 낙폭에 섞일 수 있습니다. 이 영향을 줄이기 위해 MDD와 하루 최대 낙폭은 전체 평가금 대비 비율이 아니라 주식 평가손익 기준의 금액 낙폭으로 계산합니다.

따라서 일반적인 퍼센트 기준 MDD와 다르며, 실제 계좌 손실률이나 변동률과 차이가 날 수 있습니다.

### 인플레이션 보정용 CPI 데이터는 수동으로 갱신

인플레이션 보정에는 [KOSIS 소비자물가지수](https://kosis.kr/statHtml/statHtml.do?sso=ok&returnurl=https%3A%2F%2Fkosis.kr%3A443%2FstatHtml%2FstatHtml.do%3Fpath%3D%252Fvisual%252FeconomyBoard%252FeconomyJipyo.do%26conn_path%3DZF%26tblId%3DDT_1J22003%26vw_cd%3DMT_ZTITLE%26orgId%3D101%26)의 한국 월별 CPI 원지수(2020년=100)를 사용합니다. 데이터는 `constants/korea-cpi-indexes.ts`에서 수동으로 갱신합니다.

차트 날짜에 해당하는 월의 CPI를 사용합니다. 아직 CPI가 갱신되지 않은 최신 월 이후 기간은 최신 CPI와 같은 값으로 처리되어 인플레이션 보정이 적용되지 않습니다.

### 소수점 주식 수량

국내/해외 주식 매수/매도 수량은 일부 경로에서 `parseInt`로 처리되어 소수점 주식은 무시될 수 있습니다. 소수점 거래를 지원하려면 `balance` 구조와 매도 차감 로직을 함께 바꿔야 합니다.

## TODO List

- [ ] KRX 금현물 계좌 합산 계산 (계좌 추적은 가능하지만 Yahoo Finance에 KRX 금현물 시세가 없어, `GC=F` 금 선물 가격에 환율을 곱해 유사하게 산출하는 방식 검토)
- [ ] 현금 잔고 정확하게 추적 (최종현금잔고가 아닌 추적에 필요한 모든 거래내역을 기반으로 계산해야됨)
- [ ] 현금 잔고 추적이 정확해지면 `startDate`를 사용해 사용자가 계산 기간을 선택할 수 있도록 수정
- [ ] MDD를 금액 낙폭과 퍼센트 낙폭으로 분리해 표시 (현금 흐름 정확한 추적, 입출금 계산 제외 필요)
- [ ] 국내주식 양도소득세 계산 추가 (금투세 도입되면 추가, 대주주 양도세도 추가)
- [ ] 외화RP 이자의 세금까지 정확하게 추적하기 (`외화RP원천징수`, `환전입금` 거래내역 사용)
- [ ] 투자 성과 비교용 벤치마크 추가 (S&P 500, KOSPI, Nikkei 225, Hang Seng 등)
- [ ] 포트폴리오 구성 종목 및 섹터 조회에 Vanguard·Invesco 외 타 운용사 ETF 지원 추가
- [ ] 한국/미국 외 국가 거래내역 지원
- [ ] 종목을 검색해 벤치마크 포트폴리오 조합을 만들고, 매월/매년 정기 납입 금액을 설정해 내 계좌 성과와 비교하는 시뮬레이션 기능 추가
- [ ] 종목별 전체 기간 시장 데이터를 온디맨드로 외부 API에서 조회해 DB에 저장하고, 이후 요청에는 저장된 데이터에서 필요한 기간만 반환하도록 개선
- [ ] 신한투자증권 CSV에서 액면분할/액면병합 거래 형식 확인 후 보유 수량과 평균단가 보정
- [ ] 신한투자증권 CSV에서 `타사대체출고`, `계좌대체출고`, `은행이체외화출금` 실제 거래 형식 확인 후 로직 수정
- [ ] 신한투자증권 외 증권사 거래내역 지원하기
- [ ] 계좌별 원금 보정 기준일 직접 선택
- [ ] 소수점 주식 계산
- [ ] 환율 차트 추가할지 여부
- [ ] `createAccountData` 단계부터 배당·보유잔고 등 중첩 배열의 데이터 구조를 개선해 `DashboardDataset.accountData`의 메모리 사용 최적화
