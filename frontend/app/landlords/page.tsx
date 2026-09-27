import SimpleCrudPage, { CrudField } from "../components/SimpleCrudPage";

const fields: CrudField[] = [
  { key: "name", label: "임대인명", required: true },
  { key: "phone", label: "연락처", type: "tel", required: true },
  { key: "email", label: "이메일", type: "email" },
  { key: "businessNumber", label: "사업자등록번호" },
  { key: "address", label: "주소" },
  { key: "bankName", label: "은행명" },
  { key: "accountNumber", label: "계좌번호" },
  { key: "accountHolder", label: "예금주" },
];

export default function LandlordsPage() {
  return <SimpleCrudPage title="임대인 관리" description="임대인과 정산 계좌 정보를 관리합니다." endpoint="/landlords" fields={fields} columns={fields.slice(0, 5)} />;
}
