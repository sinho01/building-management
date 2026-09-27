import RelationCrudPage, { RelationField } from "../components/RelationCrudPage";

const fields: RelationField[] = [
  { key: "facilityId", label: "시설물", type: "select", required: true, endpoint: "/facilities", recordPath: "facility.id", optionLabel: ["name"] },
  { key: "vendorId", label: "협력업체", type: "select", endpoint: "/vendors", recordPath: "vendor.id", optionLabel: ["name"] },
  { key: "planName", label: "점검 계획명", required: true },
  { key: "cycleDays", label: "점검 주기(일)", type: "number", required: true },
  { key: "lastInspectionDate", label: "최근 점검일", type: "date" },
  { key: "nextInspectionDate", label: "다음 점검일", type: "date" },
  { key: "status", label: "상태" },
  { key: "notes", label: "비고", type: "textarea" },
];

export default function MaintenancePlansPage() {
  return <RelationCrudPage title="정기 점검 계획" description="정기 점검 계획을 조회하고 관리합니다." endpoint="/maintenance-plans" fields={fields} columns={[fields[0], fields[2], fields[1], fields[3], fields[5], fields[6]]} searchFields={[{ key: "facility", label: "시설물", path: "facility.name" }, { key: "inspectionMonth", label: "점검월", path: "nextInspectionDate", paths: ["lastInspectionDate"], type: "month" }]} />;
}
