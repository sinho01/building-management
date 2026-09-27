import RelationCrudPage, { RelationField } from "../components/RelationCrudPage";

const fields: RelationField[] = [
  { key: "buildingId", label: "건물", type: "select", required: true, endpoint: "/buildings", recordPath: "building.id", optionLabel: ["name"] },
  { key: "name", label: "시설물명", required: true },
  { key: "facilityType", label: "시설 유형" },
  { key: "location", label: "설치 위치" },
  { key: "manufacturer", label: "제조사" },
  { key: "modelName", label: "모델명" },
  { key: "installedDate", label: "설치일", type: "date" },
  { key: "inspectionCycleDays", label: "점검 주기(일)", type: "number" },
  { key: "status", label: "상태" },
  { key: "notes", label: "비고", type: "textarea" },
];

export default function FacilitiesPage() {
  return <RelationCrudPage title="시설물 관리" description="시설물을 등록, 수정, 삭제합니다." endpoint="/facilities" fields={fields} columns={[fields[0], fields[1], fields[2], fields[3], fields[8]]} />;
}
