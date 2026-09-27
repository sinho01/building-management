import RelationCrudPage, { RelationField } from "../components/RelationCrudPage";

const fields: RelationField[] = [
  { key: "facilityId", label: "시설물", type: "select", required: true, endpoint: "/facilities", recordPath: "facility.id", optionLabel: ["name"] },
  { key: "vendorId", label: "협력업체", type: "select", endpoint: "/vendors", recordPath: "vendor.id", optionLabel: ["name"] },
  { key: "inspectionDate", label: "점검일", type: "date", required: true },
  { key: "inspectionType", label: "점검 유형" },
  { key: "result", label: "점검 결과" },
  { key: "actionTaken", label: "조치 내용", type: "textarea" },
  { key: "cost", label: "비용", type: "number" },
  { key: "nextInspectionDate", label: "다음 점검일", type: "date" },
  { key: "notes", label: "비고", type: "textarea" },
];

export default function MaintenanceHistoryPage() {
  return <RelationCrudPage title="점검·정비 이력" description="점검 및 정비 이력을 조회하고 관리합니다." endpoint="/maintenance-history" fields={fields} columns={[fields[0], fields[2], fields[3], fields[4], fields[6]]} searchFields={[{ key: "facility", label: "시설물", path: "facility.name" }, { key: "inspectionMonth", label: "점검월", path: "inspectionDate", type: "month" }]} />;
}
