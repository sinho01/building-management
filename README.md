[건물관리-프로그램-종합-설계서.md](https://github.com/user-attachments/files/32699054/-.-.-.md)
# 건물관리 프로그램 종합 설계서

작성 기준: 현재까지 논의한 건물관리 프로그램의 분석, 데이터베이스, 화면, API, 운영 및 배포 설계

---

## 1. 분석 및 설계

### 1.1 프로그램 목적

건물 운영에 필요한 업무를 하나의 시스템에서 관리한다.

- 건물 및 호실 관리
- 임대인 관리
- 임차인 관리
- 임대차 계약 관리
- 임대료·관리비·전기료·수도료 청구
- 납부 및 미납 관리
- 시설물 관리
- 관련 업체 관리
- 정기점검 및 정비 이력 관리

### 1.2 사용자 역할

#### 관리자

- 모든 건물 조회
- 임차인·계약 등록, 수정, 취소
- 청구·수납 관리
- 시설·업체·점검 관리
- 사용자 및 권한 관리

#### 관리직원

- 건물·호실 조회
- 청구서 생성
- 수납 처리
- 시설점검 등록

#### 조회 사용자

- 건물 현황 조회
- 계약 조회
- 청구·수납 현황 조회
- 시설점검 결과 조회

### 1.3 업무 흐름

#### 계약 업무

```text
건물 등록
  → 호실 등록
  → 임차인 등록
  → 임대차 계약 등록
  → 계약기간·임대료·관리비·납부일 관리
```

#### 청구 업무

```text
계약정보 확인
  → 검침자료 입력
  → 전기·수도 사용량 계산
  → 임대료·관리비·전기료·수도료 청구서 생성
  → 부가세 계산
  → 청구 상태 관리
```

#### 수납 업무

```text
납부내역 입력
  → 청구서 연결
  → 납부금액 누적
  → 미납금액 계산
  → 미납·부분납부·완납 상태 변경
```

#### 시설관리 업무

```text
시설물 등록
  → 관련 업체 등록
  → 정기점검 계획 등록
  → 점검·정비 실행
  → 정비 이력 저장
```

---

## 2. 메뉴 설계

```text
건물관리
├─ 건물·호실 관리
└─ 임대인 관리

계약관리
├─ 임차인 관리
└─ 계약 이력

청구·수납관리
├─ 임대료 청구관리
└─ 임대료 수납관리

유지관리
├─ 관련업체관리
├─ 시설물관리
├─ 점검·정비이력
└─ 정기점검관리
```

### 2.1 대시보드

대시보드에서 다음 정보를 API로 조회한다.

- 전체 건물 수
- 전체 호실 수
- 임대 중인 호실 수
- 공실 수
- 전체 임차인 수
- 진행 중인 계약 수
- 이번 달 청구금액
- 이번 달 수납금액
- 미납금액
- 점검 예정 건수

권장 API:

```text
GET /api/dashboard/summary
```

예상 응답:

```json
{
  "buildingCount": 3,
  "unitCount": 42,
  "tenantCount": 25,
  "activeContractCount": 20,
  "monthlyBillAmount": 12000000,
  "monthlyPaidAmount": 9500000,
  "unpaidAmount": 2500000,
  "maintenanceDueCount": 4
}
```

---

## 3. 데이터베이스 설계

### 3.1 buildings - 건물

```text
id
name
address
floors
units
status
landlord_id
created_at
```

관계:

```text
landlords 1 ─── N buildings
buildings 1 ─── N units
```

건물 상태 예시:

```text
관리중
보수중
사용중지
매각
```

### 3.2 units - 호실

```text
id
building_id
floor
unit_number
area
status
created_at
```

호실 상태 예시:

```text
공실
임대중
계약예정
사용중지
```

### 3.3 landlords - 임대인

```text
id
name
phone
email
address
business_number
bank_name
account_number
account_holder
created_at
```

### 3.4 tenants - 임차인

현재 설계에서는 회사명과 사업자번호를 계약 단위로 관리한다.

```text
id
name
resident_number
phone
email
address
created_at
```

삭제 대상:

```text
sangho
business_number
```

주민등록번호는 민감정보이므로 다음을 적용한다.

- 암호화 저장 권장
- API 응답에서 전체 번호 제외
- 화면에 마스킹 표시
- 로그에 출력하지 않음

### 3.5 lease_contracts - 임대차 계약

```text
id
building_id
unit_id
tenant_id
company_name
business_number
contract_start_date
contract_end_date
move_in_date
contract_area
contract_pyeong
deposit_amount
monthly_rent
maintenance_fee
payment_day
overdue_rate
contract_notes
status
rent_vat_applicable
rent_vat_rate
maintenance_vat_applicable
maintenance_vat_rate
created_at
```

관계:

```text
buildings 1 ─── N lease_contracts
units 1 ─────── N lease_contracts
tenants 1 ───── N lease_contracts
```

기본 연체이율:

```text
5.00%
```

### 3.6 utility_readings - 전기·수도 검침

```text
id
unit_id
utility_type
previous_reading
current_reading
usage_amount
unit_price
charge_amount
reading_date
comments
created_at
```

계산:

```text
usage_amount = current_reading - previous_reading
charge_amount = usage_amount × unit_price
```

공과금 종류:

```text
ELECTRICITY
WATER
```

`comments`는 검침 관련 특이사항을 기록한다.

### 3.7 bills - 청구서

```text
id
contract_id
billing_month
due_date

rent_amount
rent_vat

maintenance_fee
maintenance_vat

electricity_usage
electricity_amount
electricity_vat

water_usage
water_amount

original_amount
total_vat
overdue_interest
total_amount

paid_amount
unpaid_amount
status
created_at
```

삭제된 구식 컬럼:

```text
utility_amount
utility_vat
water_vat
```

### 3.8 payments - 수납

```text
id
bill_id
payment_date
payment_method
amount
comments
created_at
```

관계:

```text
bills 1 ─── N payments
```

상태 계산:

```text
납부액 = 0             → 미납
납부액 > 0, 총액 미만  → 부분납부
납부액 >= 청구 총액    → 완납
```

### 3.9 vendors - 관련 업체

```text
id
name
business_number
contact_name
phone
email
address
service_type
comments
created_at
```

### 3.10 facilities - 시설물

```text
id
building_id
name
facility_type
location
manufacturer
model_name
install_date
warranty_end_date
status
vendor_id
comments
created_at
```

### 3.11 maintenance_plans - 정기점검계획

```text
id
facility_id
vendor_id
plan_name
maintenance_type
cycle_type
cycle_value
last_check_date
next_check_date
status
comments
created_at
```

### 3.12 maintenance_histories - 점검·정비이력

```text
id
facility_id
vendor_id
maintenance_date
maintenance_type
description
cost
result
next_schedule_date
attachment_url
created_at
```

---

## 4. 부가세 및 금액 계산

### 4.1 임대료·관리비·전기료

입력금액이 부가세 포함 총액인 경우:

```text
공급가액 = 총액 × 100 / 110
부가세 = 총액 - 공급가액
```

예:

```text
총액: 1,100,000원
공급가액: 1,000,000원
부가세: 100,000원
```

### 4.2 수도료

수도료에는 부가세를 계산하지 않는다.

```text
수도료 공급가액 = 수도료 원금액
수도료 부가세 = 0원
```

### 4.3 청구서 합계

```text
original_amount
= 임대료 공급가액
+ 관리비 공급가액
+ 전기료 공급가액
+ 수도료

총 부가세
= 임대료 부가세
+ 관리비 부가세
+ 전기료 부가세

총 청구금액
= original_amount + total_vat
```

---

## 5. 코딩 원칙 및 코딩 설계

### 5.1 기술 스택

```text
Frontend: Next.js, React, TypeScript, Tailwind CSS
Backend: Java 21, Spring Boot, Spring Data JPA, Hibernate
Database: PostgreSQL
Build: Gradle
Deployment: Docker, Nginx, Raspberry Pi
```

### 5.2 현재 프로젝트 구조

```text
D:\building-management
├─ frontend
│  ├─ app
│  │  ├─ buildings
│  │  ├─ tenants
│  │  ├─ contracts
│  │  ├─ bills
│  │  ├─ payments
│  │  ├─ vendors
│  │  ├─ facilities
│  │  ├─ maintenance-history
│  │  └─ maintenance-plans
│  └─ package.json
│
└─ backend
   ├─ src
   │  └─ main
   │     ├─ java
   │     │  └─ backend
   │     └─ resources
   │        └─ application.properties
   └─ build.gradle
```

### 5.3 백엔드 계층 구조

```text
Controller
   ↓
Service
   ↓
Repository
   ↓
Entity
```

- Controller: HTTP 요청·응답 처리
- Service: 부가세·청구·수납·연체이자 등 업무 규칙 처리
- Repository: 데이터베이스 조회·저장
- Entity: 테이블과 Java 객체 연결
- DTO: API 요청·응답 구조 분리

규모가 커지면 다음 패키지로 분리한다.

```text
controller
service
repository
entity
dto
config
exception
```

### 5.4 REST API

```text
GET     /api/buildings
POST    /api/buildings
GET     /api/buildings/{id}
PUT     /api/buildings/{id}
DELETE  /api/buildings/{id}
```

주요 API:

```text
/api/buildings
/api/units
/api/tenants
/api/contracts
/api/bills
/api/payments
/api/vendors
/api/facilities
/api/maintenance-plans
/api/maintenance-histories
/api/dashboard/summary
```

### 5.5 삭제 및 취소 원칙

관계 데이터가 있는 업무자료는 물리 삭제보다 상태 변경을 우선한다.

```text
건물 → 사용중지
계약 → 종료
청구서 → 취소
```

수납내역이 있는 청구서는 삭제하지 않는다.

### 5.6 데이터 검증

- 필수값은 프론트엔드와 백엔드 모두 검증
- 금액은 0 이상
- 납부일은 1~31
- 계약 종료일은 시작일 이후
- 중복 계약 방지
- 중복 청구 방지
- 중복 수납 방지

### 5.7 금액·날짜 처리

금액:

```java
BigDecimal
```

사용하지 않는 방식:

```java
double
float
```

날짜:

```text
청구월: String 또는 YearMonth
납부일: LocalDate
검침일: LocalDate
생성일: LocalDateTime
```

모든 테이블의 생성일:

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 5.8 프론트엔드 API 주소

`.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

사용:

```tsx
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

fetch(`${API_BASE_URL}/api/bills`);
```

운영 시에는 PC 또는 서버의 실제 주소를 사용한다.

```env
NEXT_PUBLIC_API_BASE_URL=http://172.30.1.82:8080
```

가능하면 Nginx를 사용하고 다음처럼 상대경로를 사용한다.

```tsx
fetch("/api/bills");
```

---

## 6. 운영 및 배포

### 6.1 개발 환경

백엔드:

```bat
cd /d D:\building-management\backend
gradlew.bat bootRun
```

컴파일 확인:

```bat
gradlew.bat clean compileJava
```

프론트엔드:

```bat
cd /d D:\building-management\frontend
npm run dev
```

프론트엔드 빌드:

```bat
npm run build
```

### 6.2 Raspberry Pi 운영 구성

#### 웹서버 Raspberry Pi

```text
Raspberry Pi 4B+ 4GB
├─ Nginx
├─ Next.js
└─ Spring Boot
```

#### DB서버 Raspberry Pi

```text
Raspberry Pi 4B+ 4GB
└─ PostgreSQL
```

예시:

```text
웹서버: 172.30.1.82
DB서버: 172.30.1.83
```

백엔드 DB 주소:

```properties
spring.datasource.url=jdbc:postgresql://172.30.1.83:5432/building_management
```

`localhost`는 DB서버 주소로 사용하지 않는다.

### 6.3 운영 네트워크

```text
휴대폰 또는 PC
        ↓
웹서버 Raspberry Pi
        ├─ Next.js
        ├─ Spring Boot
        │       ↓
        └──── DB서버 Raspberry Pi
                PostgreSQL
```

PostgreSQL 5432 포트는 인터넷에 공개하지 않는다.

```text
웹서버 Pi → DB서버 Pi 5432 허용
외부 인터넷 → DB서버 Pi 5432 차단
```

### 6.4 Docker 운영

웹서버와 DB서버를 Docker Compose로 분리할 수 있다.

```text
웹서버 Pi: frontend, backend, nginx
DB서버 Pi: postgres
```

DB 데이터는 microSD보다 USB SSD에 저장하는 것을 권장한다.

### 6.5 백업

```text
매일 자동 백업
주 1회 다른 PC 또는 외장디스크에 복사
월 1회 복구 테스트
```

예시:

```bash
pg_dump -U building_admin building_management \
> building_management_20260924.sql
```

### 6.6 휴대폰 접속 시 주의사항

휴대폰 접속:

```text
http://172.30.1.82:3000
```

프론트엔드 코드에 다음과 같이 작성하면 안 된다.

```tsx
fetch("http://localhost:8080/api/buildings");
```

운영 시:

```tsx
fetch("http://172.30.1.82:8080/api/buildings");
```

또는 Nginx를 사용하여:

```tsx
fetch("/api/buildings");
```

Spring Boot CORS에는 웹서버 주소를 허용한다.

```java
@CrossOrigin(origins = {
    "http://localhost:3000",
    "http://172.30.1.82:3000"
})
```

---

## 7. Notion 및 Codex 연동

### 7.1 권장 역할 분리

```text
PostgreSQL = 운영 원본 데이터
Notion = 문서·보고·설계 자료
Codex = 코드와 Notion 자료 비교 및 보조
```

### 7.2 초기 데이터 이관

```text
Notion 건물임대관리
        ↓
PostgreSQL
```

이관 대상:

```text
tenants
units
lease_contracts
bills
payments
```

### 7.3 Notion MCP 연결

Codex 설정 파일:

```toml
[mcp_servers.notion]
url = "https://mcp.notion.com/mcp"
```

인증:

```powershell
codex.cmd mcp login notion
```

연결 확인:

```powershell
codex.cmd mcp list
```

예상 상태:

```text
notion enabled OAuth
```

### 7.4 Codex 사용 예시

```text
Notion에서 건물임대관리 데이터베이스를 찾아서
현재 프로젝트의 buildings, tenants, lease_contracts 테이블과 비교해줘.
아직 파일은 수정하지 말고 차이점을 표로 정리해줘.
```

수정 전 요청:

```text
수정할 파일 목록과 Diff를 먼저 보여줘.
내가 확인하기 전에는 파일을 수정하지 마.
```

---

## 8. 보안 및 운영 안정성

### 8.1 로그인·권한

운영 전 추가할 기능:

- 관리자 로그인
- 직원 계정
- 조회 전용 계정
- 역할별 메뉴 제한
- API 권한 검증

### 8.2 주민등록번호

- 암호화 저장
- API 응답에서 전체 값 제외
- 화면 마스킹 표시
- 로그 출력 금지

표시 예:

```text
900101-1******
```

### 8.3 감사 로그

향후 `audit_logs` 테이블을 추가한다.

```text
id
user_id
action
table_name
record_id
old_value
new_value
created_at
```

관리 대상:

```text
등록
수정
삭제·취소
청구금액 변경
수납 처리
```

### 8.4 외래키 및 중복 제약

권장사항:

- 계약의 `tenant_id`, `unit_id`, `building_id` 외래키 설정
- 같은 호실의 중복 활성계약 방지
- 같은 계약·청구월의 중복 청구 방지
- 같은 청구서·납부일·금액의 중복 수납 방지

---

## 9. 향후 추가 기능

### 필수 권장

- 로그인·권한관리
- 대시보드 통계 API
- 청구서 PDF 출력
- 영수증 출력
- 미납 알림
- 엑셀 다운로드
- 파일 첨부
- 검색·필터·정렬

### 유지관리 강화

- 점검 예정 알림
- 정비비용 집계
- 업체별 작업 이력
- 시설별 고장 이력
- 보증기간 만료 알림

### 데이터 안정성

- DB 외래키 제약
- 중복 계약 방지
- 중복 청구 방지
- 중복 수납 방지
- 트랜잭션 처리
- 입력값 검증
- 감사 로그

---

## 10. 추천 개발 순서

```text
1단계. DB 구조 정리
   - tenants와 lease_contracts 회사정보 분리
   - created_at 점검
   - 외래키 및 중복 제약 확인

2단계. 청구·수납 안정화
   - 전기·수도 항목 분리
   - 부가세 계산
   - 수납 상태 반영
   - 수정·취소 처리

3단계. 대시보드 API 연결
   - 건물 수
   - 호실 수
   - 계약 수
   - 청구액
   - 수납액
   - 미납액

4단계. 시설·업체·점검 관리 완성
   - 업체
   - 시설물
   - 정기점검
   - 정비 이력

5단계. 보안 기능
   - 로그인
   - 권한
   - 주민등록번호 보호
   - 감사 로그

6단계. 운영 배포
   - Raspberry Pi 웹서버
   - Raspberry Pi DB서버
   - Nginx
   - HTTPS
   - 자동 백업
```

---

## 11. 최종 시스템 구조

```text
사용자
  ↓
Next.js 프론트엔드
  ↓
Spring Boot REST API
  ↓
PostgreSQL
  ├─ buildings
  ├─ units
  ├─ landlords
  ├─ tenants
  ├─ lease_contracts
  ├─ utility_readings
  ├─ bills
  ├─ payments
  ├─ vendors
  ├─ facilities
  ├─ maintenance_plans
  └─ maintenance_histories
```

이 구조를 기준으로 개발을 진행하면 건물·임대·청구·수납·시설관리를 하나의 시스템에서 통합 관리할 수 있다.
