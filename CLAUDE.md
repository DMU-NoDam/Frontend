# Arubi Frontend

여행 계획 서비스 Arubi의 Vite + React + TypeScript 프론트엔드다.
이 문서는 저장소에서 작업할 때 항상 적용할 프로젝트 수준 지침이다.

## 기술 스택

- React 19, TypeScript, Vite
- React Router
- TanStack Query: 서버 상태
- Zustand: 여러 기능에서 공유하는 클라이언트 상태
- Axios: HTTP 요청
- react-hook-form + Zod: 폼과 유효성 검사
- 일반 CSS 파일과 기존 BEM 형태의 클래스 이름

## 주요 명령

- `npm run dev`: 로컬 개발 서버
- `npm run lint`: ESLint 검사
- `npm run typecheck`: TypeScript 프로젝트 검사
- `npm run build`: 타입 검사 후 프로덕션 빌드
- `npm run verify`: lint, typecheck, 프로덕션 빌드를 포함한 기본 완료 검증

현재 자동 테스트와 E2E 테스트 프레임워크는 설정되어 있지 않다. 존재하지 않는 테스트를 실행했다고 보고하지 말고, 필요한 동작은 수동 검증 항목으로 명확히 구분한다.

## 코드 구조

- `src/pages`: URL 단위 페이지와 화면 조합
- `src/features`: 도메인 API, hooks, types, mapper, 기능 UI
- `src/shared`: 공용 API client, UI, hooks, 유틸리티
- `src/app/router`: 라우트와 보호 라우트 구성
- `src/app/providers`: 앱 전역 provider
- `src/app/store`: 공유 클라이언트 상태
- `src/query`: TanStack Query 설정
- `src/mocks`: mock 데이터와 mock API

새 파일이나 폴더를 만들기 전에 같은 역할의 기존 코드를 먼저 찾고 그 구조와 명명 방식을 따른다.

## 아키텍처 규칙

- 페이지는 조합 계층으로 유지하고 무거운 비즈니스 로직은 소유 도메인의 `features`에 둔다.
- 서버 상태는 TanStack Query로 관리한다. 특별한 이유 없이 query 데이터를 Zustand에 복제하지 않는다.
- Zustand는 서로 관련 없는 여러 컴포넌트가 공유하는 클라이언트 상태에만 사용한다.
- 컴포넌트에만 필요한 UI 상태는 로컬 상태를 사용한다.
- URL로 표현되어야 하는 필터, 탭, 검색 조건은 React Router의 URL 상태를 우선 검토한다.
- 공유 Axios client와 인증 header 처리는 `src/shared/api`에 둔다.
- 도메인 API 함수와 타입은 `src/features/{domain}` 아래에 둔다.
- raw API response와 화면에서 사용하는 타입의 형태가 다르면 mapper를 거친다.
- 로딩, 오류, 빈 결과, 권한 없음 상태를 기능에 맞게 처리한다.
- 기존 CSS와 컴포넌트 패턴을 우선 사용한다.
- `any` 대신 구체적인 타입 또는 `unknown`과 narrowing을 사용한다.

## 작업 절차

1. 요청과 완료 조건을 읽고 관련 파일, 호출부, 기존 패턴을 먼저 조사한다.
2. 수정 전에 예상 변경 범위와 짧은 구현 계획을 제시한다.
3. 요청을 만족하는 최소 범위만 변경한다.
4. 소스 변경 후 `npm run verify`를 실행한다.
5. 검증이 실패하면 원인을 분석하고 요청 범위 안에서 수정한 뒤 다시 실행한다.
6. 자동 검증이 통과해도 브라우저 상호작용은 필요한 수동 확인 항목으로 보고한다.

## 변경 안전성

- 관련 없는 리팩터링, 파일 이동, 이름 변경, 포맷 변경을 함께 수행하지 않는다.
- 사용자가 작업 중인 기존 변경을 삭제하거나 덮어쓰지 않는다.
- 새로운 의존성을 추가하기 전에 기존 도구로 해결할 수 있는지 확인하고 필요성을 설명한다.
- `.env`, `.env.*`, secret 파일의 내용을 읽거나 출력하지 않는다.
- API contract, 인증 구조, 라우터 전체 구조를 요청 없이 변경하지 않는다.
- 오류를 숨기기 위해 TypeScript나 ESLint 검사를 비활성화하지 않는다.
- 타입 오류를 `any`, 무분별한 assertion, suppression comment로 우회하지 않는다.

## 외부 입력과 URL 상태

- URL query, route parameter, 폼 값, API response는 신뢰하지 말고 허용된 형태인지 검증한다.
- 유효하지 않거나 누락된 값에는 명시적인 기본 동작을 제공한다.
- query parameter 하나를 변경할 때 요청과 무관한 기존 parameter는 보존한다.
- 동일한 상태를 URL과 로컬 또는 전역 store에 불필요하게 중복 저장하지 않는다.

## 완료 기준

다음 조건을 모두 만족해야 작업 완료로 보고할 수 있다.

- 요청한 정상 동작과 명시된 예외 동작을 구현했다.
- 변경 범위가 요청과 관련된 파일로 제한되어 있다.
- `npm run verify`가 통과했다.
- 실행하지 못한 검증이나 사람이 확인해야 할 동작을 숨기지 않았다.

## 완료 보고 형식

최종 보고에는 다음 내용을 간결하게 포함한다.

- 변경한 파일과 핵심 동작
- 주요 구현 결정
- 실행한 검증 명령과 결과
- 수행하지 못했거나 사람이 직접 확인해야 하는 항목

