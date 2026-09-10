# API 재연동 계획 (2026-08-24 기준)

백엔드를 원격에서 새로 받은 뒤, 팀원 보고 4건이 실제 코드에 반영됐는지 확인하고
프론트 재연동 순서를 정리한 문서입니다. **아직 코드는 건드리지 않았습니다.**

조사 범위는 `arubi_backend` 읽기 전용. 작업 대상은 `arubi_frontend`뿐입니다.

---

## 0. 팀원 보고 검증 결과

| 보고 내용 | 실제 확인 | 비고 |
|---|---|---|
| 일정 생성 API 대폭 수정됨 | **경로·단계는 그대로** | `POST /trip/api` → `date-plans` → `place-plans` → `transport-plans` 4단계 유지. 바뀐 건 내부 로직과 `TripInfoDto` 필드 |
| 일정 수정 API 5개 생김 | **확인됨** | `add-place` / `change-place` / `move-place` / `remove-place` / `fix-place`. 동시에 **기존 3개가 삭제됨** |
| 초대 API 구현됨 | **확인됨** | 5개 엔드포인트 모두 존재. 프론트 `trip-member-api.ts`와 경로가 이미 일치 |
| 일정 최종 반환값 형식 변경됨 | **확인됨** | `GET /plan/api/{tripId}`가 `Map<Theme, PlacePlan[]>` → `List<DatePlanInfo>` |

보고에 없었지만 **프론트를 깨뜨리는 변경 2건**을 추가로 발견했습니다 (아래 P0).

---

## 1. 계약 변경 전수표

### 1-1. 삭제된 엔드포인트 (호출 시 404)

| 기존 | 프론트 사용처 | 대체 |
|---|---|---|
| `PUT /plan/api/place-plan` | `planApi.replacePlacePlan`, `use-replace-place-plan.ts` | `POST /plan/api/{datePlanId}/change-place` |
| `PUT /plan/api/place-plan/switch` | `planApi.switchPlacePlan`, `use-switch-place-plan.ts` | `POST /plan/api/{datePlanId}/move-place` (개념이 "교환"→"이동"으로 바뀜) |
| `DELETE /plan/api/place-plan/{id}` | `planApi.deletePlacePlan`, `use-delete-place-plan.ts` | `POST /plan/api/{datePlanId}/remove-place` |

### 1-2. 신규 일정 수정 API 5종

공통: `POST /plan/api/{datePlanId}/{action}?version={version}`, 응답 `SuccessResponse<DatePlanInfo>`

| action | body | 비고 |
|---|---|---|
| `add-place` | `{ placeId, previousPlacePlanId, nextPlacePlanId }` | prev/next **둘 다 null이면 409** |
| `change-place` | `{ placePlanId, placeId }` | |
| `move-place` | `{ placePlanId, previousPlacePlanId, nextPlacePlanId }` | prev/next 둘 다 null이면 409 |
| `remove-place` | `{ placePlanId }` | |
| `fix-place` | `{ placePlanId, isFixed }` | **미구현. 성공해도 HTTP 409를 반환하고 fix가 적용되지 않음** |

응답이 항상 갱신된 `DatePlanInfo` 전체이므로, 성공 시 재조회 없이 해당 날짜 캐시를 통째로 교체하면 됩니다.

### 1-3. 동시성 모델 (`version`)

- `DatePlanInfo.version`은 그 날짜의 편집 시퀀스 번호. **항상 non-null** (편집 이력 없으면 `0`).
- 수정 요청 시 마지막으로 받은 `version`을 쿼리로 보냅니다.
- 서버는 그 사이 들어온 편집에 내 요청을 **자동 rebase**합니다. 단순 낙관적 락이 아니라, 충돌 없으면 조용히 병합됩니다.
- 폴링용 경량 엔드포인트: `GET /plan/api/{datePlanId}/version` → `SuccessResponse<Long>`.

**409가 나는 경우** (재조회 후 사용자에게 알려야 함):
- 같은 대상에 같은 종류의 편집이 이미 들어옴
- 수정/이동/고정하려는 PlacePlan이 이미 삭제됨
- add/move의 prev·next 기준이 모두 사라짐

**404**: 대상 id가 해당 DatePlan 소속이 아님 / DatePlan·Place 없음.

### 1-4. `GET /plan/api/{tripId}` 응답 구조 변경

**기존**
```ts
{ message, body: Record<TripThemeType, PlacePlan[]> }
```

**변경 후**
```ts
{ message, body: DatePlanInfo[] }

type DatePlanInfo = {
  id: number                    // datePlanId — 수정 API의 경로 파라미터
  date: string                  // "yyyy-MM-dd"
  tripInfo: TripInfoDto
  datePlanTheme: TripThemeType | null
  region: { name: string; code: string }
  version: number               // non-null, 최소 0
  placePlanInfos: PlacePlanInfo[]  // 이미 정렬되어 옴
}

type PlacePlanInfo = {
  id: number
  orderIndex: number            // ⚠️ 아래 함정 참고 — 프론트는 쓸 일 없음
  date: string
  startTime: string | null      // "HH:mm:ss"
  endTime: string | null
  placeInfo: PlaceInfo          // null 아님. 대신 빈 객체가 올 수 있음
  fromTransport: TransportPlanInfo | null
}
```

`TransportPlanInfo` / `RouteInfo` 구조는 기존과 동일합니다 (`takeTime`은 여전히 **초** 단위).

### 1-5. `TripInfoDto` 필드 변경

- **`planCreated` 삭제됨.** 백엔드 `src` 전체에 문자열 자체가 없습니다.
- 진행 상태는 `GET /plan/api/{tripId}/status`의 `planStatus` / `planning`으로만 판단합니다.
- 나머지 필드는 동일.

### 1-6. `TripThemeType`에서 `ACTIVITY` 삭제

백엔드는 `FOOD`, `HEALING`, `LANDMARK` **3개**뿐입니다. 프론트는 4개 기준으로 짜여 있습니다.

### 1-7. 변경 없음 (그대로 동작)

- 여행 생성 4단계 경로 전부
- `GET /trip/api`, `GET /trip/api/{tripId}`, `PUT`, `DELETE`, `PATCH .../fixed`, `PATCH .../theme`
- 초대·멤버 5개 엔드포인트 — 프론트 `trip-member-api.ts`와 경로가 **이미 일치**
- `POST /place/api/recommend` — 경로·DTO 동일 (단, 백엔드가 여전히 `weather`를 무시하고 `SUNNY` 하드코딩)
- 인증 규칙 (`/*/public/**` 공개, `/*/api/**` USER 롤)

---

## 2. 프론트 영향 파일

| 파일 | 무엇이 깨지는가 | 단계 |
|---|---|---|
| `pages/trip-list/Trip-listPage.tsx:37` | `t.planCreated &&` 필터 → **여행 목록 전체가 빈 화면** | P0 |
| `features/trip/components/TripCard.tsx:37` | `!trip.planCreated` → 모든 카드가 "생성 중" 배지 | P0 |
| `features/trip/types/trip-types.ts` | `planCreated`, `TripThemeType`에 `ACTIVITY` | P0 |
| `features/trip/hooks/use-trip-planning-status.ts` | `isPlanning` 키 이름 (아래 함정) | P0 |
| `features/trip/types/plan-types.ts` | `PlanListBody = Record<Theme, PlacePlan[]>` 전제 | P1 |
| `features/trip/api/plan-mapper.ts` | `THEME_ORDER`/`THEME_META` 4개, 맵 기반 매핑 | P1 |
| `features/trip/api/plan-api.ts` | `getPlans` 매핑 + 삭제된 3개 엔드포인트 | P1 |
| `pages/trip-detail/TripDetailPage.tsx:54` | `plans.body[trip.tripThemeType] ?? []` | P1 |
| `pages/trip-select/TripSelectPage.tsx` | 4개 테마 카드 구성 | P2 |
| `hooks/use-replace-place-plan.ts` | 404 | P3 |
| `hooks/use-switch-place-plan.ts` | 404 | P3 |
| `hooks/use-delete-place-plan.ts` | 404 | P3 |
| `mocks/plans.ts`, `mocks/trips.ts` | 새 계약과 형태가 다름 | 각 단계에 붙여서 |

---

## 3. 작업 순서

### P0 — 앱이 다시 뜨게 만들기

가장 먼저. 지금 실서버에 붙이면 **여행 목록이 빈 화면**이라 그 뒤를 아무것도 확인할 수 없습니다.

1. `trip-types.ts`에서 `planCreated` 제거, `TripThemeType`에서 `ACTIVITY` 제거
2. `Trip-listPage.tsx` 필터에서 `planCreated` 조건 제거
3. `TripCard.tsx`의 "생성 중" 판정을 `planStatus` 기반으로 교체하거나, 카드에서 뺌
4. `use-trip-planning-status.ts`의 status 응답 키를 `planning`으로 수정
5. `mocks/trips.ts`에서 `planCreated` 제거 + 하드코딩된 과거 날짜 갱신

완료 기준: 실서버 모드로 `/trips` 진입 시 목록이 보인다.

### P1 — 일정 조회 응답 구조 갈아끼우기

가장 큰 덩어리. 여기가 끝나야 상세 화면이 산다.

1. `plan-types.ts`에 `DatePlanInfo` / 새 `PlacePlanInfo` 타입 추가
2. `plan-mapper.ts`를 `DatePlanInfo[]` 입력 기준으로 재작성
   - 화면이 날짜별로 그리므로, 오히려 날짜 그룹핑 로직이 단순해집니다
   - `datePlanId`와 `version`을 뷰모델에 **반드시 보존** (P3에서 필요)
3. `plan-api.ts`의 `getPlans` 수정
4. `TripDetailPage.tsx:54` 평탄화 로직 교체
5. `mocks/plans.ts`를 새 형태로 재작성

### P2 — 테마 선택 화면

**여기서 백엔드 확인이 먼저 필요합니다** (아래 4번 항목). 확인 전엔 착수하지 않습니다.

1. `THEME_ORDER` / `THEME_META`를 3개로
2. `TripSelectPage` 카드 구성 조정
3. `mocks`의 `ACTIVITY` 데이터 정리

### P3 — 일정 수정 API 5종 연동

1. 기존 3개 훅/API 함수 제거 또는 신규 계약으로 교체
   - `replace` → `change-place`, `delete` → `remove-place`
   - `switch`(교환)는 `move-place`(이동)로 **동작 의미가 바뀌므로** UI 재확인 필요
2. `version` 전달 + 응답 `DatePlanInfo`로 캐시 교체
3. 409 / 404를 사용자에게 구분해서 표시
4. `add-place`는 신규 기능 — UI 유무 확인 후 결정
5. `fix-place`는 **백엔드 미구현이므로 이번 범위에서 제외**

### P4 — 정리

- mock 플래그 3종 기본값 통일 (`VITE_USE_MOCK_TRIPS`만 opt-out이라 `.env` 누락 시 조용히 mock)
- 에러 정규화 유틸 (`src/shared/utils/`가 비어 있음)
- `docs/api-resync-test-scenarios.md`를 새 계약에 맞게 갱신

---

## 4. 백엔드에 확인해야 할 것

작업 전에 답이 필요한 순서대로.

1. **테마 선택 화면을 어떻게 그리나?** (P2 차단 요소)
   `GET /plan/api/{tripId}`는 이제 확정 테마의 DatePlan만 내려줍니다. 테마 미확정 상태에서 3개 테마를
   비교하는 `TripSelectPage`를 그릴 방법이 없습니다.
   `PlanController`에 주석 처리된 `/api/{tripId}/summary`가 이 자리이고, 코드에 남은 todo가
   프론트에 던진 질문입니다 — *"반환값이 변경되면서 front에서 처리 가능 여부를 확인해야함
   (불가능 하다면 back 처리 필요)"*. → **불가능하므로 백엔드 처리 필요**로 회신해야 합니다.

2. **`ACTIVITY` 삭제가 의도된 것인가?** 프론트 UI·mock·스탬프가 4개 기준입니다.

3. **`switch`(두 장소 교환) 기능이 `move-place`로 대체 가능한가?** 현재 UI에 교환 트리거가 있는지와
   함께 확인 필요.

4. **`fix-place`는 언제 구현되나?** 지금은 성공해도 409 + 미적용입니다.

5. `POST /place/api/recommend`의 `weather`가 여전히 무시됩니다 (`WeatherType.SUNNY` 하드코딩).
   프론트가 보내는 값이 의미 없으므로 안 보내도 되는지 확인.

6. ~~**[중요] 토큰이 만료·불량일 때 401을 반환해달라.**~~ → **해결됨 (2026-08-27 확인).**
   `AccessTokenFilter`가 만료 토큰에 `ErrorTokenAuthentication(EXPIRED_TOKEN)`을 세팅하고,
   `CustomAuthorizationManager` → `CustomAuthenticationException` → `ErrorCode.EXPIRED_TOKEN`
   (`HttpStatus.UNAUTHORIZED`)로 **401**이 나갑니다. 프론트의 403 우회는 제거했습니다(6장 참고).
   단, 만료가 아닌 불량 토큰(`todo : add other case`)과 토큰 없음은 여전히 403입니다 —
   이건 재발급 대상이 아니므로 문제 없습니다.

---

## 5. 함정 목록

연동하다 조용히 틀리기 쉬운 것들. 전부 백엔드 코드에서 직접 확인했습니다.

1. **`isPlanning`의 JSON 키는 `planning`입니다.** 백엔드 필드가 `private boolean isPlanning`이라
   Lombok 게터가 `isPlanning()`이 되고 Jackson이 `is` 접두어를 떼어냅니다.
   프론트는 지금 `body.isPlanning`을 읽고 있어 **항상 `undefined`**입니다.
   같은 이유로 `TripInfoDto.isFixed` → JSON 키는 **`fixed`**.
   반면 `FixPlacePlanRequestDto.isFixed`는 래퍼 타입(`Boolean`)이라 **`isFixed` 그대로**입니다.

2. **`PlaceType`은 한글로 직렬화됩니다** (`"식당"`, `"카페"`, `"관광지"`, `"쇼핑"`, `"호텔"`, `"공항"`).
   `@JsonValue` 때문이며 enum 이름이 아닙니다. 프론트 타입이 `PlaceType = string`이라 지금은
   우연히 통과하고 있고, 요청도 `@JsonCreator`로 한글을 받으므로 왕복은 정상입니다.
   다만 **문자열 비교로 분기하는 코드가 있으면 한글 기준**이어야 합니다.

3. **`orderIndex`를 `number`로 쓰지 마세요.** 초기 간격이 `10^16`이라 첫 항목부터
   `Number.MAX_SAFE_INTEGER`(약 `9.007×10^15`)를 넘습니다.
   다만 `placePlanInfos`가 이미 정렬되어 오고 수정 API도 `previous`/`next` **id**를 받으므로,
   **프론트는 `orderIndex`를 쓸 일이 없습니다.** 타입에서 아예 빼는 게 안전합니다.

4. **`placeInfo`는 null이 아닙니다.** 장소가 없으면 `{ name: "empty place", 나머지 전부 null }`인
   객체가 옵니다. `placeInfo == null` 체크는 통과해버립니다.

5. **`fromTransport`는 재계산 전이면 null**입니다 (detached transport는 응답에서 제외).

6. **에러 응답도 성공과 같은 껍데기**(`{ message, body }`)를 씁니다. `body`는 보통 null이고
   500일 때만 문자열입니다. **HTTP status로만 성공/실패를 판단해야 합니다.**

7. **`PATCH .../fixed`와 `PATCH .../theme`는 원시 리터럴 body**를 받습니다.
   `{ isFixed: true }`를 보내면 400입니다. 현재 프론트는 맞게 보내고 있습니다.

8. `PlanStatus`는 해당 여행의 여러 DatePlan 중 **가장 뒤처진 상태**입니다.
   DatePlan이 하나도 없으면(생성 직후) `null`입니다.

9. 생성 파이프라인 3단계는 **즉시 202를 반환하고 백그라운드 실행**됩니다.
   실패는 응답에 안 실리고 서버 로그에만 남으므로, 완료 판정은 반드시 폴링으로 합니다.
   각 단계는 멱등하므로 진전이 없을 때 재호출해도 안전합니다.

---

## 6. 작업 기록

### 2026-08-24 — P0 완료

목표는 "실서버 모드에서 여행 목록이 다시 보이게" 하나였습니다. 화면을 막는 것만 고치고
연쇄 범위가 큰 것은 전부 뒤 단계로 미뤘습니다.

**착수 시 계획 변경**: 원래 P0에 넣었던 `ACTIVITY` 제거를 **P2로 이동**했습니다.
`TripThemeType`에서 값을 빼면 `plan-mapper.ts`(THEME_ORDER/THEME_META), `mocks/plans.ts`,
`TripSelectPage`까지 연쇄되어 P1·P2 범위를 통째로 끌고 들어옵니다.
게다가 `ACTIVITY`는 화면이 안 뜨는 원인이 아닙니다 — 테마 UI를 손보는 P2에서 함께 처리하는 게 맞습니다.

수정한 파일 (작업 순서대로):

| # | 파일 | 변경 |
|---|---|---|
| 1 | `features/trip/types/trip-types.ts` | `TripSummaryApiItem.planCreated` 제거. `TripStatusResponse.body`의 `isPlanning` → **`planning`** (사유 주석 추가) |
| 2 | `pages/trip-list/Trip-listPage.tsx` | 탭 필터에서 `t.planCreated &&` 조건 제거 |
| 3 | `features/trip/components/TripCard.tsx` | "생성 중" 배지 제거, 확정 여부만 표시. `clsx` 분기도 단순화 |
| 4 | `features/trip/components/TripCard.css` | 위에서 죽은 `.trip-card__status--planning` 규칙 삭제 |
| 5 | `features/trip/hooks/use-trip-planning-status.ts` | `isPlanning` → `planning` 3곳 (폴링 중단 조건, 단계 트리거 가드, done 판정) |
| 6 | `mocks/trip.ts` | `mockGetTripStatus` 응답 키를 `planning`으로 |
| 7 | `mocks/trips.ts` | `planCreated` 제거(5건). 하드코딩 날짜 → `dayOffset()` 상대 날짜 |
| 8 | `features/trip/types/plan-types.ts` | 미사용 `FixedTrip` 타입 삭제(낡은 `isPlanning` 필드 보유), 미사용 `ScheduleType` import 정리 |
| 9 | `features/trip/api/plan-api.ts` | mock 플래그 극성 통일 (P4에서 앞당김, 아래 사유) |
| 10 | `features/trip/hooks/use-trip-planning-status.ts` | 파이프라인 단계 실패를 콘솔에 기록 (기존엔 `.catch(() => ...)`로 에러를 통째로 버려 원인 파악 불가) |

**P4 항목 하나를 앞당겼습니다.** `VITE_USE_MOCK_TRIPS` 하나를 `trip-api.ts`는 `=== 'true'`로,
`plan-api.ts`는 `!== 'false'`로 **정반대 극성으로** 읽고 있었습니다.
값이 정확히 `'true'`나 `'false'`가 아니면 여행 목록은 실서버, 일정은 mock으로 갈라져
P0 검증 결과를 신뢰할 수 없게 됩니다. 검증 직전에 밟을 지뢰라 먼저 맞췄습니다.
이제 mock 플래그 4개(`AUTH`/`TRIP`/`TRIPS`)가 전부 `=== 'true'` 기준입니다 —
**명시적으로 `true`일 때만 mock**입니다.

#### 판단이 필요했던 지점

- **`TripCard`의 "생성 중" 배지를 없앤 이유**
  여행 목록 응답(`GET /trip/api` → `TripInfoDto[]`)에 일정 진행도가 아예 없습니다.
  카드마다 상태를 알려면 여행 수만큼 `GET /plan/api/{tripId}/status`를 호출해야 하는데,
  생성 중 안내는 이미 `TripGenerationWatcher`의 전체화면 오버레이가 담당하므로 중복입니다.
  → 카드는 `fixed` 기준 "확정 / 확정 전"만 표시합니다.

- **mock 날짜를 상대 날짜로 바꾼 이유**
  기존 값이 `2025-12` ~ `2026-08`로 박혀 있어 오늘(2026-08-24) 기준 대부분 과거였습니다.
  mock 모드에서 "다가오는 여행" 탭이 비어 보이는데, 이건 P0가 고치려는 증상과 구분이 안 됩니다.
  → `dayOffset(days)`로 오늘 기준 계산. 다시 썩지 않습니다.

- **`FixedTrip` 삭제**
  어디서도 import하지 않는 데드 타입인데 낡은 `isPlanning` 필드를 갖고 있어,
  P1에서 새 타입을 만들 때 잘못 참조될 소지가 있었습니다.

### 2026-08-24 — P0 검증 중 발견한 인증 버그 (수정함)

브라우저 검증에서 **폴링이 한동안 잘 되다가 갑자기 죽는** 증상이 나왔습니다.
`GET /plan/api/{tripId}/status`가 `{"planStatus":null,"planning":false}`로 계속 오다가
`date-plans`가 실패하고 그대로 멈췄습니다.

#### 원인 — 세션 만료가 401이 아니라 403으로 나온다

`AccessTokenFilter`(백엔드)는 토큰이 만료·불량이어도 **예외를 던지지 않고 그냥 통과**시킵니다.
인증 정보 없이 다음 필터로 넘어가고, `SecurityConfig`의 `/*/api/**` → `hasRole(USER)`에 걸려
**403**이 됩니다. 그런데 프론트 인터셉터는 **401일 때만** 토큰을 재발급했습니다.

```
로그인 직후  → 토큰 유효 → 폴링 200 계속 성공
accessToken 만료
다음 요청     → 403
인터셉터     → 401이 아니므로 재발급 안 함
             → 재시도도 재로그인도 없음 → 그대로 죽음
```

`date-plans`는 `planStatus`가 안 바뀌면 재시도하지 않으므로(`triggeredStatusRef` 잠김)
한 번 죽으면 복구되지 않습니다.

#### 이 백엔드에서 403이 나올 수 있는 경우 (전수 확인)

`SecurityConfig` 43-44번 줄의 `hasRole` 두 개가 전부입니다.

| 흔한 403 원인 | 이 백엔드 |
|---|---|
| 비즈니스 권한 실패 (OWNER 아님 등) | **400** — `NOT_AUTHOR`가 `BAD_REQUEST` |
| `@PreAuthorize` | 없음 (grep 0건) |
| CSRF | 없음 (disabled) |
| `ErrorCode.FORBIDDEN` | enum에 존재하지 않음 |
| ADMIN 엔드포인트 | 미구현 |
| ADMIN 유저가 `/api/` 호출 | 403 안 남 (`UserRole.ADMIN(USER)`라 `ROLE_USER`도 부여) |

→ **이 백엔드에서 403은 사실상 인증 누락만 의미**하므로 재발급 대상에 넣어도 안전합니다.

#### 수정 (당시) — 403도 재발급 대상에 넣는 우회

`shared/api/client.ts` 인터셉터가 401뿐 아니라 403도 재발급 대상으로 처리했습니다.
**지금은 제거됐습니다.** 아래 참고.

### 2026-08-27 — 403 우회 제거, 401 단일 기준으로 복귀

두 가지가 겹쳐서 우회를 걷어냈습니다.

1. **백엔드가 401을 내려주게 됐습니다.** `AccessTokenFilter`가 `ExpiredJwtException`일 때
   `ErrorTokenAuthentication(ErrorCode.EXPIRED_TOKEN)`을 SecurityContext에 세팅하고,
   `SecurityConfig`의 `CustomAuthorizationManager`가 이를 `CustomAuthenticationException`으로
   던져 `handlerExceptionResolver`가 `EXPIRED_TOKEN`(=`HttpStatus.UNAUTHORIZED`)으로 응답합니다.
   → **만료는 401. 우회의 존재 이유가 사라졌습니다.**

2. **우회 자체가 로그인 직후 튕김을 만들었습니다.** 로그아웃 상태의 백그라운드 요청도 403을
   받는데, 이걸 재발급 대상에 넣으면 `refreshToken`이 없어 `logout()`이 호출되고,
   그 사이 완료된 로그인의 토큰까지 지워버립니다.

**현재 기준**: 401 → 재발급 + 재시도. 403(토큰 없음 / 만료가 아닌 불량 토큰) → 그대로 에러 전달.
안전장치는 그대로입니다 — `_retry` 가드로 루프 없이 반환, 재발급 실패 시 로그아웃.

**남은 백엔드 todo**: `AccessTokenFilter`의 `// todo : add other case (ex strange token, ...)` —
만료가 아닌 불량 토큰은 아직 403입니다. 재발급 대상이 아니라 프론트 동작에는 영향 없습니다.

#### 검증

- `npm run verify` (lint + typecheck + build) **통과**
- `grep`으로 `planCreated` / `isPlanning` 잔존 참조 없음 확인 (주석 제외)
- **브라우저 수동 확인은 아직 안 했습니다** — 아래 "남은 확인" 참고

#### 남은 확인 (사람이 직접)

실서버 모드(`.env.local`에서 mock 플래그 해제 + 백엔드 기동)로 확인해야 합니다:

1. `/trips` 목록에 여행이 보이는지 — **P0의 완료 기준**
2. 카드 배지가 "확정 / 확정 전"으로 나오는지
3. 여행 생성 시 폴링이 `TRANSPORT_PLANNED`에서 정상 종료되는지
   (`planning` 키 수정이 실제로 맞았는지 확인하는 지점. 기존엔 `undefined`라
   "생성 중 가드"가 동작하지 않아 단계가 중복 호출됐을 수 있습니다)

단, **2번 항목은 P1 전까지 상세 화면에서 막힐 수 있습니다** — `GET /plan/api/{tripId}` 응답
구조가 아직 안 맞아서 여행 상세는 P1 완료 후에나 정상 동작합니다.

### 다음 단계

P1(일정 조회 응답 구조 교체)이 다음입니다. P2는 여전히 백엔드 답변 대기 중입니다(4번 항목).

---

## 7. 참고

- 기존 수동 검증 시나리오: `docs/api-resync-test-scenarios.md` — **현재 계약과 어긋난 부분이 있어
  P4에서 갱신 대상입니다.**
- 이 프로젝트에는 자동 테스트/E2E 프레임워크가 없습니다. 각 단계 완료 검증은
  `npm run verify`(lint + typecheck + build) + 브라우저 수동 확인입니다.
