# API 재연동 테스트 시나리오

백엔드 재연동 작업(여행 생성 파이프라인, 여행 목록/상세 필드, 여행 삭제·멤버·초대, `switchPlacePlan`)을
브라우저에서 직접 확인하기 위한 수동 시나리오입니다. 이 프로젝트엔 자동 테스트/E2E 프레임워크가 없으므로
전부 수동 검증입니다.

## 0. 준비

### 실서버로 붙이기

기본값은 mock입니다. 아래 두 플래그를 `.env.local`에서 실서버 모드로 바꿔야 이번에 고친 것들이 실제로 검증됩니다
(값 자체는 프로젝트의 `.env*` 파일에서 직접 설정 — 이 문서에서 값을 지시하지 않습니다).

- `VITE_USE_MOCK_TRIPS` — `false`로: 여행 목록/상세/플랜 조회가 실서버를 탐
- `VITE_USE_MOCK_TRIP` — mock 해제(빈 값 또는 미설정): 여행 생성·상태 폴리링·항공편 조회가 실서버를 탐
- `VITE_API_BASE_URL`이 백엔드(`arubi_backend`) 실행 주소를 가리키는지 확인

백엔드는 `arubi_backend`를 별도로 기동해야 합니다(이 리포지토리 밖, 사용자가 직접 실행).

### 테스트 계정 2개 준비 (멤버/초대 시나리오용)

- 브라우저에서 서로 다른 탭(같은 창도 무방 — `sessionStorage`는 탭별로 분리됨) 2개를 열고 각각 `/login`에서
  "Test user login"(`VITE_ENABLE_TEST_AUTH=true`일 때만 노출)을 눌러 서로 다른 유저를 만듭니다 → 탭 A = userA,
  탭 B = userB.
- OAuth로만 테스트할 경우 다른 브라우저 프로필/시크릿 창으로 2계정을 준비합니다.

### 상태 재현이 필요할 때

- React Query Devtools가 붙어 있다면 캐시를 보면서 진행 상황을 확인하면 편합니다.
- 진행 중인 여행 생성을 중간에 리셋하려면 새로고침 후 다시 `/trips/create`로 진입합니다.

---

## 1. 여행 생성 파이프라인 (Phase A)

`use-trip-planning-status.ts`가 내부적으로 `date-plans` → `place-plans` → `transport-plans`를 순서대로
호출하는지 확인합니다.

1. userA로 로그인 → `/trips/create`에서 국가/도시/날짜/인원 등 스텝을 채우고 제출.
2. 제출 직후 "일정 생성 중" 전체화면 오버레이가 뜨는지 확인.
3. 브라우저 개발자도구 Network 탭에서 다음이 **순서대로** 호출되는지 확인:
   - `POST /trip/api` (1회)
   - `POST /trip/api/{tripId}/date-plans` (1회)
   - `GET /plan/api/{tripId}/status` 폴링 (2초 간격)
   - `planStatus`가 `CREATED`(또는 `FIXED_PLANNED`)로 바뀌면 `POST /trip/api/{tripId}/place-plans` (1회)
   - `planStatus`가 `AI_PLANNED`로 바뀌면 `POST /trip/api/{tripId}/transport-plans` (1회)
4. `planStatus === TRANSPORT_PLANNED`가 되면 오버레이가 사라지고 `/trips/{tripId}/select`로 자동 이동하는지 확인.
5. **동일 단계가 중복 호출되지 않는지** 확인 — 같은 `planStatus`에서 `place-plans`나 `transport-plans`가 두 번
   찍히면 안 됩니다(가드 로직 회귀 확인). 이 중복은 평소엔 잘 안 보이고 POST 응답이 다음 폴링(2초)보다 느릴 때만
   드러나므로, Network 탭을 "Slow 3G" 등으로 스로틀링해서 각 스텝 POST가 2초 이상 걸리게 만든 뒤 같은 확인을
   반복합니다.

### 1-1. 타임아웃 케이스

- 백엔드를 일부러 느리게 만들거나(혹은 place-plans 단계에서 의도적으로 실패하는 여행으로) 10분을 기다리기 어려우므로,
  `use-trip-planning-status.ts`의 `POLLING_TIMEOUT_MS`를 로컬에서 임시로 짧게(예: 15000) 바꿔서 확인 후 되돌립니다.
- 타임아웃 도달 시 실패 화면으로 전환되고, "다시 시도" 1회 후에도 실패하면 `/trips`로 이동하는지 확인.

### 1-2. 항공편 매핑

- 6단계(FlightStep)에서 실제 편명으로 조회 → 조회 결과가 화면에 표시되는지 확인.
- Network 탭에서 `POST /trip/api` 요청 바디의 `departFlight`/`arriveFlight`가
  `{ "airport": "ICN", "time": "yyyy-MM-dd HH:mm" }` 형태인지 확인(과거처럼
  `flightIata`/`departureAirport`/`departureTime` 등이 섞여 있으면 회귀).
- 항공편 스텝을 건너뛴 경우 요청 바디에 `departFlight`/`arriveFlight`가 아예 없는지(undefined) 확인.

---

## 2. 여행 목록 상태 표시 (Phase B)

1. `/trips` 목록에서 일정 생성이 아직 안 끝난 여행(`planCreated: false`)이 "생성 중" 배지로 보이는지 확인.
2. 생성이 끝난 여행은 확정 여부에 따라 "확정"/"확정 전"으로 보이는지 확인.
3. `/trips` 상단 탭(다가오는 여행/지난 여행) 필터가 `planCreated`가 아직 `false`인 여행을 목록에서 제외하는지 확인
   (Trip-listPage.tsx 필터 조건).
4. 여행 상세(`/trips/{id}/detail`) 진입 시 지도/추천 시트가 국가 코드 없이도 정상 렌더링되는지 확인(콘솔 에러 없어야 함
   — `country`/`countryCode` 필드 제거 이후 회귀 확인 포인트).
5. 마이페이지 스탬프(국가 뱃지) 영역에서 에러 없이 렌더링되는지 확인(이름 기반 매칭만 남았으므로 일부 여행은 스탬프가
   안 붙을 수 있음 — 이건 기대된 동작).
6. 여행 상세 헤더의 제목(편집 모드 아닐 때)이 볼드 처리되고, 긴 이름은 말줄임표(...)로 잘리는지 확인 — 헤더 우측
   버튼들과 겹치지 않고 한 줄에 정렬돼야 합니다(className 유실 회귀 확인 포인트).

---

## 3. 여행 관리 메뉴 — 삭제 / 멤버 / 초대 (Phase C)

### 3-1. 진입점

1. userA(OWNER)로 여행 상세 페이지 진입 → 헤더 우측 "⋮" 버튼 클릭 → `TripManageSheet`가 열리는지 확인.
2. 멤버 목록에 userA 자신이 `소유자`로 표시되는지 확인.

### 3-2. 초대 링크 생성 → 참여

1. (userA, 관리 시트) "초대 링크 만들기" 클릭 → "링크가 복사되었습니다" 안내 확인, 클립보드에 복사된 URL 확인
   (`{origin}/invitations/{token}`).
2. 같은 여행에서 링크를 한 번 더 만들면 같은 token이 재사용되는지 확인(Network 응답 비교).
3. 탭 B(비로그인 상태로 로그아웃)에서 복사한 URL 접속 → `/invitations/:token` 공개 페이지에서 로그인 없이도
   여행 이름/기간이 보이는지 확인.
4. "참여하기" 클릭(비로그인) → `/login`으로 이동하는지 확인, 로그인 후 자동으로 초대 페이지로 돌아오는지 확인
   (`pending_redirect` 재사용).
5. userB로 로그인된 상태에서 다시 "참여하기" 클릭 → 참여 성공 후 `/trips`로 이동, 목록에 해당 여행이 보이는지 확인.
6. userA 관리 시트의 멤버 목록에서 userB가 `멤버`로 추가되어 있는지 확인.

### 3-3. 나가기 (MEMBER)

1. userB로 해당 여행 상세 → 관리 메뉴 → "여행 나가기" 클릭 → `/trips`로 이동, 목록에서 사라졌는지 확인.
2. userA 관리 시트에서 userB가 멤버 목록에서 사라졌는지 확인.

### 3-4. 삭제 (OWNER 전용)

1. userB(MEMBER, 아직 여행에 남아있는 다른 여행)로 관리 메뉴를 열었을 때 "여행 삭제" 대신 "여행 나가기" 버튼만
   보이는지 확인(삭제 버튼 자체가 노출되지 않아야 함 — UI 레벨 owner 가드).
2. userA(OWNER)로 관리 메뉴 → "여행 삭제" → 확인 문구가 있는 2단계 화면으로 전환되는지 확인.
3. "삭제하기" 클릭 → `/trips`로 이동, 목록에서 사라졌는지 확인.
4. 삭제된 여행 URL로 직접 재진입 시도(`/trips/{id}/detail`) → "여행을 찾을 수 없어요" 상태 화면으로 처리되는지 확인.

---

## 4. Plan API — switchPlacePlan (Phase D)

UI 트리거가 아직 없으므로 개발자도구 콘솔에서 직접 훅 없이 API 함수만 검증합니다.

1. 여행 상세 페이지가 열려 있는 상태에서 콘솔에 아래와 유사한 코드로 두 PlacePlan의 순서를 바꿔 호출합니다
   (`placePlan1`, `placePlan2`는 현재 화면의 일정 카드 id로 교체):

   ```js
   const { planApi } = await import('/src/features/trip/api/plan-api.ts')
   await planApi.switchPlacePlan({ placePlan1: 1001, placePlan2: 1002 })
   ```

2. 요청이 `PUT /plan/api/place-plan/switch`로 나가고 200 응답을 받는지 확인.
3. 페이지 새로고침 후 두 일정의 순서/시간이 바뀌었는지 확인(백엔드 처리 결과 확인용 — 프론트는 아직 화면을
   자동 갱신하지 않으므로 새로고침 필요).

---

## 회귀 체크리스트 (요약)

- [ ] 여행 생성 4단계가 순서대로, 중복 없이 호출된다(네트워크 스로틀링 상태에서도)
- [ ] 생성 파이프라인이 끝나면 자동으로 select 페이지로 이동한다
- [ ] 여행 목록/카드가 `planCreated` 기준으로 상태를 표시한다
- [ ] 여행 상세/지도/추천 시트가 country 필드 없이도 에러 없이 렌더링된다
- [ ] 여행 상세 헤더 제목이 정상 스타일(볼드, 말줄임표)로 보인다
- [ ] 관리 메뉴에서 멤버 목록, 초대 링크 생성, 나가기, 삭제(OWNER 전용)가 모두 동작한다
- [ ] 초대 링크가 비로그인 상태에서도 미리보기되고, 로그인 후 리다이렉트가 정상 동작한다
- [ ] `switchPlacePlan` API가 백엔드와 계약대로 동작한다
