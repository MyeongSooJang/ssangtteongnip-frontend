# ssangtteongnip-frontend 작업 규칙

커밋 메시지 형식, 브랜치, PR 절차(푸시·보안 리뷰·PR 생성 흐름 포함)는 프로젝트 스킬 `.claude/skills/commit-and-pr-format`을 따른다. 아래는 이 프로젝트에서 추가로 지키는 규칙이다.

## UI를 바꾸면 화면을 확인하고 스크린샷을 첨부한다

UI 작업이 끝나면 `ui-preview` 스킬(`.claude/skills/ui-preview`)로 가짜 데이터 화면을 띄워 보여주고, 화면이 바뀌는 PR에는 그 화면의 스크린샷을 첨부한다. 임시 파일 `mock-preview.*`는 커밋하지 않고, PR을 머지하기 전에 지우고 개발 서버도 종료한다.

## 배포

- Vercel에 배포하며(https://www.ssangtteongnip.com/), **`main`에 머지하면 자동으로 운영에 배포된다.** 그래서 머지는 사용자가 지시할 때만 하고, 머지 전에 테스트와 타입체크가 통과했는지 확인한다.
- 운영 API 주소는 `https://api.ssangtteongnip.com`이다. Vercel 대시보드의 환경변수 `VITE_API_URL`로 넣으며, 코드에는 로컬 기본값(`http://localhost:8080`)만 둔다.
- 백엔드 저장소는 형제 폴더 `../ssangtteongnip-backend`에 있다.

## 보안 리뷰에 문제가 없으면 멈추지 않고 PR까지 진행한다

마지막 커밋 뒤에 `/security-review`를 실행한다. 리뷰 스킬이 "보고서만 출력하라"고 해도 이 규칙이 우선한다.

- **문제가 없으면** 리뷰 보고에서 턴을 끝내지 않고, 사용자에게 묻지 않고, 같은 턴에서 곧바로 `gh pr create`로 PR을 만든다.
- **문제가 나오면** PR을 만들지 않고 멈춘다. 결과(파일·줄, 심각도, 설명, 공격 시나리오, 수정 방안)를 **한국어로** 쓴다.
- 이 규칙에 PR **머지**는 포함되지 않는다. 머지는 사용자가 지시할 때만 한다.

## Hook으로 강제되는 규칙

지침만으로는 놓칠 수 있어서, 아래 규칙은 `.claude/settings.json`의 Hook이 명령 실행 직전에 검사하고 어기면 **차단**한다. 스크립트는 `.claude/hooks/`에 있다.

| 상황 | 검사 | 어기면 |
|---|---|---|
| `git commit` | `mock-preview.*`가 스테이징돼 있는가 | 차단 (`git restore --staged`로 뺀다) |
| `git push`, `gh pr create`, `gh pr merge` | `mock-preview.*`가 git에 추적되고 있는가 | 차단 (`git rm`으로 제거) |
| `gh pr create`, `gh pr merge` | 남은 `mock-preview.*` 파일 | **자동으로 삭제**하고 알린다 |
| `gh pr merge` | 미리보기 개발 서버(127.0.0.1:5173)가 켜져 있는가 | 차단 (서버를 종료한다) |
| `gh pr create` | 현재 커밋(HEAD)에 대한 `/security-review` 기록이 있는가 | 차단 (스킬을 실행한다) |
| `gh pr merge` | PR 최신 커밋에 대한 `/security-review` 기록이 있는가 | 차단 |
| `git commit`, `gh pr create` | `commit-and-pr-format` 스킬을 이 세션에서 실행했는가 | 차단 (스킬을 먼저 실행한다) |

- **보안 리뷰는 커밋마다 유효하다.** 리뷰 뒤에 커밋이 하나라도 늘면(문서·스크린샷 커밋 포함) PR을 만들거나 머지하기 전에 `/security-review`를 다시 실행한다. 그래서 리뷰는 **마지막 커밋 뒤에** 돌린다.
- 스킬 실행 기록은 `mark-skill.cjs`(PostToolUse)가 `.claude/.state/`(git 제외)에 남긴다. 스킬을 **호출한** 사실만 기록하며, 리뷰 결과를 반영했는지는 확인하지 못한다.
- 훅은 명령 문자열에서 heredoc·따옴표 속 글을 제외하고 판단하며, `cd 경로 &&`로 다른 저장소에서 실행하는 명령에는 적용하지 않는다. 사용자가 직접 입력하는 `! 명령`은 훅을 거치지 않는다.
- 훅을 고치면 `npm run test:hooks`를 함께 돌린다. 새 훅 설정은 이미 열려 있는 세션에서는 `/hooks`를 한 번 열거나 세션을 다시 시작해야 적용될 수 있다.
