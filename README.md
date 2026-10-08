# JAEWOO — Field of possibilities

순수 블랙 공간에서 네 개의 대표 프로젝트와 ETC 실험 모음을 탐색하는 정적 포트폴리오입니다.

## 미리보기
이 폴더에서 `python3 -m http.server 4173`을 실행한 뒤 http://localhost:4173 에 접속합니다. 빌드나 백엔드가 필요하지 않습니다.

## 인터랙션
- 중앙에서 네 프로젝트로 분기되는 기존 원근 공간과 Canvas 미리보기
- 패널·목록 제목을 한 번 선택하면 상세 기록으로 직접 이동
- 일반 링크이므로 Enter, 새 탭 열기, 브라우저 뒤로·앞으로 가기 지원
- 목록의 `요약 보기`에서만 별도 요약 창 표시; Escape·닫기·뒤로 가기로 복귀
- 요약의 이전·다음은 현재 요약 URL을 교체하고, 앞으로 가기로 마지막 요약 복원
- 중앙 원과 ABOUT은 클릭·키보드 활성화로 열기; 머무르기만 해서는 열리지 않음
- 홈 공간·목록은 핵심 4개 + ETC 링크 하나로 구성; 요약 모달은 핵심 4개만 순환
- ETC에서는 캠퍼스·생산공정·강화학습 사례를 짧게 요약하고 원래 상세 URL 연결
- Motion 선택 저장, 운영체제의 동작 줄이기 설정 지원
- 미리보기·요약이 보이거나 카메라가 이동할 때만 JavaScript 애니메이션 요청
- 정지·숨긴 탭·목록·소개 창에서는 불필요한 JavaScript 애니메이션 중단

## 파일
- `index.html`: 공간·목록·요약·소개 구조
- `style.css`: 기존 타이포그래피, CSS 원근 공간, 홀로그램 전환
- `app.js`: 배치, 네이티브 링크, 입력·상태·URL·애니메이션 수명주기
- `scenes.js`: 프로젝트 요약 데이터와 Canvas 모션 장면
- `projects/*/index.html`: 독립 상세 기록
- `tests/dom-regression.cjs`: DOM 모의 회귀 검사
- `tests/static-check.py`: 문서 메타·로컬 링크·리소스 검사
- `project-navigation.css`: 상세 기록의 목록 복귀 링크

`hover-stable.js`, `copy-label.js`, `core-charge.js`는 이전 버전 코드이며 홈에서 로드하지 않습니다. 현재 입력 제어는 `app.js`로 통합했습니다.

프로젝트 정보는 `scenes.js`의 `projects` 배열에서 수정합니다. 화면 연출은 실제 서비스 녹화가 아니라 프로젝트를 바탕으로 재구성한 Canvas 데모입니다. 관제 데이터·탐색 장소·차트 막대 길이는 예시이며, 루나랜더는 학습 에이전트 녹화가 아닌 착륙 연출입니다. CSS 3D와 Canvas로 구현했으며 WebGL 모델을 사용하지 않습니다.

## 검증
프로덕션 의존성은 없습니다. DOM 검사에만 jsdom이 필요합니다.

```sh
npm install --prefix /tmp/portfolio-test --cache /tmp/portfolio-npm-cache jsdom@30.1.2 --no-audit --no-fund
NODE_PATH=/tmp/portfolio-test/node_modules node tests/dom-regression.cjs
python3 tests/static-check.py
node --check app.js
node --check scenes.js
git diff --check
```

DOM 모의 검사는 링크·상태·Escape·이력·포커스·애니메이션 중단·각 상세의 스크립트와 앵커를 확인합니다. 실제 브라우저의 픽셀 레이아웃, 네이티브 모달 포커스 트랩, 터치 hit area, 프레임률이나 Core Web Vitals를 보장하지 않습니다. 데스크톱과 좁은 모바일 뷰포트에서 이 항목들을 별도로 확인해야 합니다.

## 배포
Vercel 사용 시 이 폴더를 Root Directory로 지정하고 Framework Preset은 Other, 빌드 명령은 비워둡니다. 이 수정본의 push·배포는 별도 승인 후 진행합니다.
