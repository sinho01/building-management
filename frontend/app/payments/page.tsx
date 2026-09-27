import RelationCrudPage, { RelationField } from "../components/RelationCrudPage";

const fields: RelationField[] = [
  { key: "billId", label: "청구서 (업체/건물·호실)", type: "select", required: true, endpoint: "/bills", recordPath: "bill.id", optionLabel: ["billingMonth", "contract.companyName", "contract.tenant.name", "contract.building.name", "contract.unit.unitNumber"] },
  { key: "amount", label: "납부금액", type: "number", required: true },
  { key: "paidDate", label: "납부일", type: "date", required: true },
  { key: "paymentMethod", label: "납부방법", required: true },
  { key: "note", label: "메모", type: "textarea" },
];

export default function PaymentsPage() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const columns: RelationField[] = [
    { key: "billingMonth", label: "청구년월", recordPath: "bill.billingMonth" },
    { key: "payer", label: "업체명/건물호실", displayGroups: [["bill.contract.building.name"], ["bill.contract.companyName", "bill.contract.tenant.name"]] },
    { key: "billAmount", label: "청구금액", type: "number", recordPath: "bill.totalAmount", align: "right" },
    { key: "paidDate", label: "납부일", align: "center" },
    { key: "amount", label: "납부금액", type: "number", align: "right" },
    { key: "unpaidAmount", label: "미납금액", type: "number", recordPath: "bill.unpaidAmount", align: "right" },
  ];
  return <RelationCrudPage title="임대료 납부" description="업체를 선택해 납부 정보를 조회하고 등록·수정·삭제합니다." endpoint="/payments" fields={fields} columns={columns} createLabel="납부등록" initialSearch={{ billingMonth: month }} searchFields={[{ key: "billingMonth", label: "청구년월", path: "bill.billingMonth", type: "month" }, { key: "companyName", label: "업체명", path: "bill.contract.companyName", paths: ["bill.contract.tenant.name"], type: "combobox", endpoint: "/contracts", optionLabel: ["companyName", "tenant.name"] }]} sortBy={[{ path: "bill.billingMonth", direction: "desc" }, { path: "bill.contract.unit.floor", direction: "asc" }, { path: "bill.contract.unit.area", direction: "asc" }]} />;
}
