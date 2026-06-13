[ExtensionManager] Error loading agent from caveman: Failed to load agent from /Users/junghojang/.gemini/extensions/caveman/agents/cavecrew-builder.md: Validation failed: Agent Definition:
tools.0: Invalid tool name
tools.1: Invalid tool name
tools.2: Invalid tool name
tools.3: Invalid tool name
tools.4: Invalid tool name
[ExtensionManager] Error loading agent from caveman: Failed to load agent from /Users/junghojang/.gemini/extensions/caveman/agents/cavecrew-investigator.md: Validation failed: Agent Definition:
tools.0: Invalid tool name
tools.1: Invalid tool name
tools.2: Invalid tool name
tools.3: Invalid tool name
[ExtensionManager] Error loading agent from caveman: Failed to load agent from /Users/junghojang/.gemini/extensions/caveman/agents/cavecrew-reviewer.md: Validation failed: Agent Definition:
tools.0: Invalid tool name
tools.1: Invalid tool name
tools.2: Invalid tool name
Ripgrep is not available. Falling back to GrepTool.
[critical] Whitelabeling (revfactory → cookyman) 누락 및 링크 불일치
- 현황: `plugin.json` 및 `marketplace.json`은 `cookyman74/my_harness`로 업데이트됨.
- 이슈: `README.md` (3개국어 공통), `index.html`, `quickstart.md`, `_workspace/` 내 대다수 문서에서 여전히 `revfactory/harness` 링크와 명칭이 잔존함. 특히 `harness-100`, `claude-code-harness` 등 형제 레포 링크가 모두 구계정(`revfactory`)을 가리키고 있어 whitelabeling이 불완전함.
- 권고: 모든 마크다운 및 HTML 내 `github.com/revfactory/harness` → `github.com/cookyman74/my_harness`로 일괄 치환 필요 (이전 commit `9abe62c`에서 복구된 링크들도 cookyman 계정으로 이동되었다면 동기화).

[high] 설치 명령 및 마켓플레이스명 정합성 drift
- 현황: `install.sh` 및 `plugin.json`은 `myharness`를 사용.
- 이슈: `quickstart.md` 및 `delta_commits.txt` 등에서 `myharness@myharness-marketplace`와 `myharness@harness-marketplace`가 혼용됨. 마켓플레이스 등록 명령어와 실제 설치 명령어가 문서마다 달라 사용자 혼란 야기 가능.
- 권고: `myharness@myharness-marketplace`로 통일하고 `quickstart.md`, `README.md`의 설치 가이드를 최신화할 것.

[high] 3개국어 README 및 FAQ 내 Dual Runtime 정보 모순
- 현황: `CHANGELOG.md` 및 `AGENTS.md`는 Dual Runtime(Claude+Codex)을 핵심 기능으로 명시.
- 이슈: `README.md` (및 JA/KO)의 Q&A 섹션(Q2)에 "Currently the official runtime is Claude Code only"라는 설명이 그대로 남아있으며, `meta-harness`를 별도의 Codex 포트 레포로 소개하고 있음. 이는 현재 레포의 Dual Runtime 지원 정책과 정면으로 배치됨.
- 권고: FAQ Q2 내용을 "Dual Runtime 지원으로 Claude Code와 Codex를 동시 지원한다"로 수정하고, `meta-harness`와의 관계를 재정의(또는 삭제)할 것.

[high] CONTRIBUTING.md 내 stale 식별자 및 경로 잔존
- 현황: `skills/harness`가 `skills/myharness`로 리네임됨.
- 이슈: `CONTRIBUTING.md` 내 로컬 링크 명령이 `claude plugin link ./harness`로 되어 있어 작동 불가(디렉토리 불일치). 또한 보안 보고 이메일 제목(`[harness-security]`), CoC 보고 이메일 제목(`[harness-coc]`) 등 브랜드 리네임이 누락된 식별자가 많음.
- 권고: `./harness` → `./` 또는 `.`으로 수정. `[harness-...]` 식별자를 `[myharness-...]`로 통일.

[med] CLAUDE.md 및 SKILL.md 명칭 불일치
- 현황: `skills/myharness/SKILL.md` 내 이름은 `myharness`.
- 이슈: `CLAUDE.md`에서 하네스 이름을 `my-harness` (하이픈 포함)로 표기하거나 `harness` 플러그인으로 혼용 중.
- 권고: `myharness` (하이픈 없음)로 명칭을 통일하여 트리거 및 호출 시의 일관성 확보.

[med] factory-map.md 정책 vs 구현 상태 격리
- 현황: `factory-map.md`에 `🧪 실험적`, `📐 설계만` 등 상태가 잘 명시됨.
- 이슈: 하지만 메인 `README.md`나 `SKILL.md` 워크플로우에는 이러한 "미구현/실험적" 상태가 충분히 강조되지 않아 사용자가 모든 기능이 즉시 작동하는 것으로 오해할 수 있음.
- 권고: `README.md` 기능 목록에 `(Experimental)` 또는 `(Planned)` 태그를 병기하고 `factory-map.md`로의 링크를 강화할 것.

[low] Manifest (plugin.json) 키워드 중복
- 현황: `plugin.json`에 `myharness`와 `harness`가 공존.
- 이슈: 검색성을 위한 의도적 배치로 보이나, whitelabeling 관점에서는 `harness` 키워드가 구 브랜드의 흔적으로 보일 수 있음.
- 권고: 하위 호환성 검색이 필요 없다면 `myharness` 중심으로 정리.

[low] AGENTS.md 내 Codex 전용 어댑터 설명 부족
- 현황: `install.sh`가 `AGENTS.md` 존재 여부를 체크함.
- 이슈: `AGENTS.md`는 Codex의 진입점인데, 현재 레포 루트의 `AGENTS.md` 내용이 `CLAUDE.md`와 거의 동일하게 구성되어 있어 Codex 전용 오케스트레이션(subagents 등)에 대한 가이드가 약함.
- 권고: `runtime-adapters.md`의 내용을 참조하여 `AGENTS.md`에 Codex 환경에서의 `$myharness` 호출 및 subagent 활용법을 요약 추가.

---
**리뷰 요약:**
whitelabeling(`revfactory` → `cookyman`) 및 리네임(`harness` → `myharness`) 작업이 파일명 수준에서는 진행되었으나, **문서 내 텍스트, 하이퍼링크, FAQ 및 설치 가이드**에서는 심각한 drift와 모순이 발견됨. 특히 Dual Runtime을 홍보하면서 FAQ에서는 Claude 전용이라고 말하는 정책적 불일치는 즉각적인 수정이 필요함.
