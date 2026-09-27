"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import FormattedNumberInput from "../components/FormattedNumberInput";

const API_URL = "http://localhost:8080/api";

type Building = { id: number; name: string };
type Unit = { id: number; unitNumber: string; floor: number };
type Tenant = { id: number; name: string };

type Contract = {
  id: number;
  companyName?: string | null;
  businessNumber?: string | null;
  contractStartDate: string;
  contractEndDate?: string | null;
  moveInDate?: string | null;
  depositAmount?: number | null;
  monthlyRent?: number | null;
  maintenanceFee?: number | null;
  paymentDay?: number | null;
  overdueRate?: number | null;
  specialNotes?: string | null;
  status: string;
  building: Building;
  unit: Unit;
  tenant: Tenant;
};

type ContractForm = {
  buildingId: string;
  unitId: string;
  tenantId: string;
  companyName: string;
  businessNumber: string;
  contractStartDate: string;
  contractEndDate: string;
  moveInDate: string;
  depositAmount: string;
  monthlyRent: string;
  maintenanceFee: string;
  paymentDay: string;
  overdueRate: string;
  specialNotes: string;
};

const emptyForm = (): ContractForm => ({
  buildingId: "", unitId: "", tenantId: "", companyName: "", businessNumber: "",
  contractStartDate: "", contractEndDate: "", moveInDate: "", depositAmount: "",
  monthlyRent: "", maintenanceFee: "", paymentDay: "10", overdueRate: "5.00", specialNotes: "",
});

function numberText(value?: number | null) {
  return value == null ? "" : String(value);
}

export default function ContractsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState({ tenant: "", unit: "" });

  const loadUnits = async (buildingId: string) => {
    if (!buildingId) {
      setUnits([]);
      return;
    }
    const response = await fetch(`${API_URL}/buildings/${buildingId}/units`);
    if (!response.ok) throw new Error("호실 목록을 불러오지 못했습니다.");
    setUnits(await response.json());
  };

  const loadContracts = async () => {
    const response = await fetch(`${API_URL}/contracts`);
    if (!response.ok) throw new Error("계약 목록을 불러오지 못했습니다.");
    setContracts(await response.json());
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [buildingResponse, tenantResponse] = await Promise.all([
          fetch(`${API_URL}/buildings`), fetch(`${API_URL}/tenants`),
        ]);
        if (!buildingResponse.ok || !tenantResponse.ok) {
          throw new Error("기본 정보를 불러오지 못했습니다.");
        }
        setBuildings(await buildingResponse.json());
        setTenants(await tenantResponse.json());
        await loadContracts();
      } catch (caughtError) {
        console.error(caughtError);
        setError("계약 관리 정보를 불러오지 못했습니다.");
      }
    };
    void loadInitialData();
  }, []);

  const updateForm = <K extends keyof ContractForm>(key: K, value: ContractForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setUnits([]);
    setError("");
    setNotice("");
    setIsFormOpen(true);
  };

  const openEditForm = async (contract: Contract) => {
    try {
      setError("");
      setNotice("");
      setEditingId(contract.id);
      setForm({
        buildingId: String(contract.building.id), unitId: String(contract.unit.id),
        tenantId: String(contract.tenant.id), companyName: contract.companyName ?? "",
        businessNumber: contract.businessNumber ?? "", contractStartDate: contract.contractStartDate ?? "",
        contractEndDate: contract.contractEndDate ?? "", moveInDate: contract.moveInDate ?? "",
        depositAmount: numberText(contract.depositAmount), monthlyRent: numberText(contract.monthlyRent),
        maintenanceFee: numberText(contract.maintenanceFee),
        paymentDay: numberText(contract.paymentDay) || "10",
        overdueRate: numberText(contract.overdueRate) || "5.00", specialNotes: contract.specialNotes ?? "",
      });
      await loadUnits(String(contract.building.id));
      setIsFormOpen(true);
    } catch (caughtError) {
      console.error(caughtError);
      setError("수정할 계약 정보를 준비하지 못했습니다.");
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setUnits([]);
  };

  const handleBuildingChange = async (buildingId: string) => {
    updateForm("buildingId", buildingId);
    updateForm("unitId", "");
    try {
      await loadUnits(buildingId);
    } catch (caughtError) {
      console.error(caughtError);
      setError("선택한 건물의 호실을 불러오지 못했습니다.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.buildingId || !form.unitId || !form.tenantId || !form.contractStartDate ||
        !form.contractEndDate || !form.depositAmount || !form.monthlyRent) {
      setError("건물, 호실, 임차인, 계약 기간, 보증금, 월 임대료는 필수입니다.");
      return;
    }
    const payload = {
      buildingId: Number(form.buildingId), unitId: Number(form.unitId), tenantId: Number(form.tenantId),
      companyName: form.companyName, businessNumber: form.businessNumber,
      contractStartDate: form.contractStartDate, contractEndDate: form.contractEndDate,
      moveInDate: form.moveInDate || null, depositAmount: Number(form.depositAmount),
      monthlyRent: Number(form.monthlyRent), maintenanceFee: Number(form.maintenanceFee || 0),
      paymentDay: Number(form.paymentDay || 10), overdueRate: Number(form.overdueRate || 5),
      specialNotes: form.specialNotes,
    };
    try {
      setIsSaving(true);
      setError("");
      const response = await fetch(editingId ? `${API_URL}/contracts/${editingId}` : `${API_URL}/contracts`, {
        method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("계약 저장에 실패했습니다.");
      await loadContracts();
      setNotice(editingId ? "계약 수정이 완료되었습니다." : "계약 등록이 완료되었습니다.");
      closeForm();
    } catch (caughtError) {
      console.error(caughtError);
      setError("계약 저장에 실패했습니다. 입력 내용을 확인해 주세요.");
      setNotice("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (!window.confirm(`${contract.unit.unitNumber} 호실의 계약을 삭제하시겠습니까?`)) return;
    try {
      setError("");
      const response = await fetch(`${API_URL}/contracts/${contract.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("계약 삭제에 실패했습니다.");
      setContracts((current) => current.filter((item) => item.id !== contract.id));
      setNotice("계약 삭제가 완료되었습니다.");
    } catch (caughtError) {
      console.error(caughtError);
      setError("청구 이력이 있는 계약은 삭제할 수 없습니다.");
      setNotice("");
    }
  };

  const filteredContracts = contracts.filter((contract) =>
    contract.tenant?.name?.toLocaleLowerCase().includes(search.tenant.trim().toLocaleLowerCase()) &&
    contract.unit?.unitNumber?.toLocaleLowerCase().includes(search.unit.trim().toLocaleLowerCase())
  ).sort((a, b) => b.contractStartDate.localeCompare(a.contractStartDate));

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><h1 className="text-2xl font-bold text-gray-900">건물관리 시스템</h1><p className="mt-1 text-sm text-gray-500">임대차 계약 관리</p></div><Link href="/" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">대시보드</Link></div></header>
      <section className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-semibold text-gray-900">임대차 계약 목록</h2><p className="mt-1 text-sm text-gray-500">계약을 등록, 수정, 삭제할 수 있습니다.</p></div><button onClick={openCreateForm} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">계약 등록</button></div>
        {notice && <p className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">{notice}</p>}
        {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}
        {isFormOpen && <div className="mb-6 rounded-xl bg-white p-6 shadow-sm"><h3 className="mb-5 text-lg font-semibold text-gray-900">{editingId ? "임대차 계약 수정" : "임대차 계약 등록"}</h3><form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="건물"><select required value={form.buildingId} onChange={(event) => void handleBuildingChange(event.target.value)} className="input"><option value="">건물을 선택하세요</option>{buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}</select></Field>
          <Field label="호실"><select required value={form.unitId} onChange={(event) => updateForm("unitId", event.target.value)} className="input"><option value="">호실을 선택하세요</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.floor}층 {unit.unitNumber}</option>)}</select></Field>
          <Field label="임차인"><select required value={form.tenantId} onChange={(event) => updateForm("tenantId", event.target.value)} className="input"><option value="">임차인을 선택하세요</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></Field>
          <Field label="회사명"><input value={form.companyName} onChange={(event) => updateForm("companyName", event.target.value)} className="input" /></Field>
          <Field label="사업자번호"><input value={form.businessNumber} onChange={(event) => updateForm("businessNumber", event.target.value)} className="input" /></Field>
          <Field label="납부일"><FormattedNumberInput required min="1" max="31" value={form.paymentDay} onChange={(value) => updateForm("paymentDay", value)} className="input" /></Field>
          <Field label="계약 시작일"><input required type="date" value={form.contractStartDate} onChange={(event) => updateForm("contractStartDate", event.target.value)} className="input" /></Field>
          <Field label="계약 종료일"><input required type="date" value={form.contractEndDate} onChange={(event) => updateForm("contractEndDate", event.target.value)} className="input" /></Field>
          <Field label="입주일"><input type="date" value={form.moveInDate} onChange={(event) => updateForm("moveInDate", event.target.value)} className="input" /></Field>
          <Field label="보증금"><FormattedNumberInput required min="0" value={form.depositAmount} onChange={(value) => updateForm("depositAmount", value)} className="input" /></Field>
          <Field label="월 임대료"><FormattedNumberInput required min="0" value={form.monthlyRent} onChange={(value) => updateForm("monthlyRent", value)} className="input" /></Field>
          <Field label="관리비"><FormattedNumberInput min="0" value={form.maintenanceFee} onChange={(value) => updateForm("maintenanceFee", value)} className="input" /></Field>
          <Field label="연체이율(%)"><FormattedNumberInput min="0" step="0.01" value={form.overdueRate} onChange={(value) => updateForm("overdueRate", value)} className="input" /></Field>
          <Field label="특약사항"><textarea value={form.specialNotes} onChange={(event) => updateForm("specialNotes", event.target.value)} className="input min-h-20" /></Field>
          <div className="flex gap-2 md:col-span-2"><button disabled={isSaving} type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-blue-300">{isSaving ? "저장 중..." : "저장"}</button><button type="button" onClick={closeForm} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">취소</button></div>
        </form></div>}
        <div className="mb-4 grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2"><label className="text-sm font-medium text-gray-700"><span className="mb-1 block">임차인</span><input value={search.tenant} onChange={(event) => setSearch((current) => ({ ...current, tenant: event.target.value }))} placeholder="임차인 이름 검색" className="w-full rounded-lg border border-gray-300 px-3 py-2" /></label><label className="text-sm font-medium text-gray-700"><span className="mb-1 block">호실</span><input value={search.unit} onChange={(event) => setSearch((current) => ({ ...current, unit: event.target.value }))} placeholder="호실 검색" className="w-full rounded-lg border border-gray-300 px-3 py-2" /></label></div><div className="overflow-hidden rounded-xl bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1000px]"><thead className="bg-gray-50"><tr className="text-left text-sm text-gray-600"><th className="px-6 py-3 font-medium">건물</th><th className="px-6 py-3 font-medium">호실</th><th className="px-6 py-3 font-medium">임차인</th><th className="px-6 py-3 font-medium">계약 기간</th><th className="px-6 py-3 font-medium">월 임대료</th><th className="px-6 py-3 font-medium">상태</th><th className="px-6 py-3 font-medium">관리</th></tr></thead><tbody className="divide-y">
          {filteredContracts.map((contract) => <tr key={contract.id} className="text-sm text-gray-700"><td className="px-6 py-4">{contract.building?.name || "-"}</td><td className="px-6 py-4"><Link href={`/contracts/${contract.id}`} className="font-medium text-blue-600 hover:underline">{contract.unit?.unitNumber || "-"}</Link></td><td className="px-6 py-4">{contract.tenant?.name || "-"}</td><td className="px-6 py-4">{contract.contractStartDate} ~ {contract.contractEndDate || "미정"}</td><td className="px-6 py-4">{(contract.monthlyRent ?? 0).toLocaleString()}원</td><td className="px-6 py-4"><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">{contract.status || "-"}</span></td><td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => void openEditForm(contract)} className="rounded border border-blue-300 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50">수정</button><button onClick={() => void handleDelete(contract)} className="rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50">삭제</button></div></td></tr>)}
          {contracts.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">등록된 계약이 없습니다.</td></tr>}
        </tbody></table></div></div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700"><span className="mb-1 block">{label}</span>{children}</label>;
}
