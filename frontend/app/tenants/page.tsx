import SimpleCrudPage, { CrudField } from "../components/SimpleCrudPage";

const fields: CrudField[] = [
  { key: "name", label: "임차인명", required: true },
  { key: "juminNumber", label: "주민등록번호", secret: true },
  { key: "phone", label: "연락처", type: "tel", required: true },
  { key: "email", label: "이메일", type: "email" },
  { key: "address", label: "주소" },
];

export default function TenantsPage() {
  return <SimpleCrudPage title="임차인 관리" description="임차인 정보를 등록하고 관리합니다." endpoint="/tenants" fields={fields} columns={fields.filter((field) => !field.secret)} searchFields={[{ key: "name", label: "이름" }, { key: "phone", label: "전화번호" }]} sortBy="name" />;
}
