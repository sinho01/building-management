import SimpleCrudPage, { CrudField } from "../components/SimpleCrudPage";

const fields: CrudField[] = [
  { key: "name", label: "업체명", required: true },
  { key: "vendorType", label: "업체 유형" },
  { key: "contactName", label: "담당자" },
  { key: "phone", label: "연락처", type: "tel" },
  { key: "email", label: "이메일", type: "email" },
  { key: "businessNumber", label: "사업자등록번호" },
  { key: "address", label: "주소" },
  { key: "notes", label: "비고", type: "textarea" },
];

export default function VendorsPage() {
  return <SimpleCrudPage title="협력업체 관리" description="시설 점검과 보수 협력업체를 관리합니다." endpoint="/vendors" fields={fields} columns={fields.slice(0, 5)} />;
}
