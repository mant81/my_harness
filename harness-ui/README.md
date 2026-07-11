# My Harness Web

이 하네스(Claude Code + Codex 에이전트 팀)를 **관찰·통제**하는 로컬 웹 패널. `_workspace/runs/**` 파일 상태를 읽어 인벤토리·실행·이력·문서·드리프트·평가를 한 화면에서 본다.

> 로컬 단일 사용자(127.0.0.1) 전용 개발 도구. 원격·다중 사용자는 비목표. 전체 문서·설계는 [`../docs/harness-ui/`](../docs/harness-ui/README.md).

## 실행

```bash
npm install      # 최초 1회
npm start        # 프로덕션: 빌드 → 단일서버(127.0.0.1:5174) → 브라우저 자동 오픈(1회용 토큰)
```

| 명령 | 용도 |
|------|------|
| `npm start` | 원커맨드. `vite build` → `src/server/start.ts` 단일 오리진 서빙 + fragment(#) 토큰 링크로 브라우저 오픈. 토큰 stdout 미노출 |
| `npm run dev` | 개발(HMR). vite 웹 `:5273` + API `:5274` |
| `npm run build` | 정적 빌드(`dist/`) |
| `npm test` | vitest |
| `npm run e2e` | 현 레포 기준 종단 테스트 |
| `npm run test:def-differential` | F7 정의 편집 파서 differential 게이트 |

접속은 **런처가 연 1회용 링크**로만(토큰 단일사용 → 세션 교환). 세션 만료 시 재접속.

## 스택

Fastify(서버) · React + Vite + TypeScript(웹) · Zod(스키마). 외부 런타임 없이 파일 상태만 읽음.

## 구조

```
harness-ui/
├── src/
│   ├── server/           # Fastify — API·supervisor·보안
│   │   ├── start.ts       # npm start 진입점(단일 오리진·브라우저 오픈)
│   │   ├── index.ts       # buildServer·projectRoot 해소
│   │   ├── security.ts    # 토큰 bootstrap→세션·Host/Origin·denylist
│   │   ├── api/           # 라우트(harness·runs·docs·metrics·evals·settings…)
│   │   ├── adapters/      # harness·runs·drift·statestats 파일상태 리더
│   │   ├── supervisor/    # spawn·서명 레지스트리·구조화 로그 ingest·reconcile
│   │   └── lib/           # exec·paths·atomic·hmac (경화 프리미티브)
│   └── web/              # React SPA
│       ├── App.tsx        # 셸(그룹 사이드바·톱바·테마·재연결)
│       ├── screens.tsx    # 11화면
│       ├── api.ts·ui.tsx  # 클라이언트·공용 UI
│       └── styles.css     # Mintlify 디자인 토큰(라이트/다크)
└── test/                 # vitest + e2e
```

## 화면 (그룹 사이드바)

- **개요** — Overview(런타임·인벤토리·구성 건강도·D4·진화 이력)
- **실행** — New Run(새 실행 시작) · History(실행 이력 조회·필터·검색·관찰)
- **정의** — Agents · Skills · Context(조회·정의 편집)
- **문서** — Docs(문서/artifact 뷰어)
- **점검** — Drift · Ops · Eval(평가·자기개선 제안)
- **설정** — Settings

흐름: New Run → run 생성 → History 관찰(fire-and-observe).

## 보안·범위

- 로컬 127.0.0.1 · fragment 토큰 → 세션 교환 · Host/Origin 게이트.
- **읽기 우선.** mutating은 정의 편집(F7)·projectRoot(F3)·평가 config(F8)뿐 — 화이트리스트·원자 쓰기·낙관적 동시성·게이트(기본 off).
- **한계:** 이력·통계는 **이 UI로 실행한 run만** 반영. 터미널 CLI 실행은 안 보임 → v0.7(CLI 세션 로그 관측) 예정.

## 디자인

**Mintlify식** — 라이트 우선 + 다크(우상단 토글)·민트그린 accent·그룹 사이드바. 본문 유동폭, Docs/Context 트리 패널 마우스 리사이즈.
