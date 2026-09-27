"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FormattedNumberInput from "../components/FormattedNumberInput";

const API = "http://localhost:8080/api";
type Contract = { id: number; companyName?: string | null; monthlyRent: number; contractStartDate: string; contractEndDate?: string | null; building?: { name: string }; unit?: { unitNumber: string }; tenant?: { name: string } };
type Bill = { id: number; contract: { id: number }; billingMonth: string; status?: string; electricityUsage?: number; electricityAmount?: number; electricityVat?: number; waterUsage?: number; waterAmount?: number };
type Line = { selected: boolean; waterUsage: string; waterTotalAmount: string; electricityUsage: string; electricityTotalAmount: string };
const monthNow = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; };
const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function BulkBillsPage() {
  const [month, setMonth] = useState(monthNow());
  const [dueDate, setDueDate] = useState(`${monthNow()}-10`);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [billedIds, setBilledIds] = useState<Set<number>>(new Set());
  const [billsByContract, setBillsByContract] = useState<Record<number, Bill>>({});
  const [lines, setLines] = useState<Record<number, Line>>({});
  const [loadedMonth, setLoadedMonth] = useState("");
  const loading = loadedMonth !== month;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetch(`${API}/contracts`), fetch(`${API}/bills`)]).then(async ([contractResponse, billResponse]) => {
      if (!contractResponse.ok || !billResponse.ok) throw new Error("계약 또는 청구서 자료를 불러오지 못했습니다.");
      const nextContracts: Contract[] = await contractResponse.json();
      const bills: Bill[] = await billResponse.json();
      const monthlyBills = bills.filter((bill) => bill.billingMonth === month && bill.status !== "취소");
      if (!active) return;
      setContracts(nextContracts);
      setBilledIds(new Set(monthlyBills.map((bill) => bill.contract.id)));
      setBillsByContract(Object.fromEntries(monthlyBills.map((bill) => [bill.contract.id, bill])));
      setLines(Object.fromEntries(monthlyBills.map((bill) => [bill.contract.id, {
        selected: false,
        waterUsage: String(bill.waterUsage ?? 0),
        waterTotalAmount: String(bill.waterAmount ?? 0),
        electricityUsage: String(bill.electricityUsage ?? 0),
        electricityTotalAmount: String((bill.electricityAmount ?? 0) + (bill.electricityVat ?? 0)),
      }])));
      setError("");
      setMessage("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "자료 조회에 실패했습니다.");
    }).finally(() => {
      if (active) setLoadedMonth(month);
    });
    return () => { active = false; };
  }, [month]);

  const availableContracts = useMemo(() => contracts.filter((contract) =>
    contract.contractStartDate <= `${month}-99` && (!contract.contractEndDate || contract.contractEndDate >= `${month}-01`)
  ), [contracts, month]);

  const update = (id: number, key: keyof Line, value: string | boolean) => setLines((current) => ({
    ...current,
    [id]: { selected: false, waterUsage: "0", waterTotalAmount: "0", electricityUsage: "0", electricityTotalAmount: "0", ...current[id], [key]: value },
  }));

  const setAllSelected = (selected: boolean) => setLines((current) => {
    const next = { ...current };
    availableContracts.forEach((contract) => {
      next[contract.id] = {
        waterUsage: "0",
        waterTotalAmount: "0",
        electricityUsage: "0",
        electricityTotalAmount: "0",
        ...current[contract.id],
        selected,
      };
    });
    return next;
  });

  const submit = async () => {
    setError(""); setMessage("");
    const selectedContracts = availableContracts.filter((contract) => lines[contract.id]?.selected);
    const items = selectedContracts.filter((contract) => !billsByContract[contract.id]).map((contract) => ({
      contractId: contract.id,
      waterUsage: Number(lines[contract.id].waterUsage || 0),
      waterTotalAmount: Number(lines[contract.id].waterTotalAmount || 0),
      electricityUsage: Number(lines[contract.id].electricityUsage || 0),
      electricityTotalAmount: Number(lines[contract.id].electricityTotalAmount || 0),
    }));
    const updates = selectedContracts.filter((contract) => billsByContract[contract.id]);
    if (!items.length && !updates.length) { setError("등록하거나 수정할 업체를 하나 이상 선택해 주세요."); return; }
    setSaving(true);
    try {
      for (const contract of updates) {
        const bill = billsByContract[contract.id];
        const line = lines[contract.id];
        const response = await fetch(`${API}/bills/${bill.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billingMonth: month, dueDate,
            waterUsage: Number(line.waterUsage || 0),
            waterTotalAmount: Number(line.waterTotalAmount || 0),
            electricityUsage: Number(line.electricityUsage || 0),
            electricityTotalAmount: Number(line.electricityTotalAmount || 0),
          }),
        });
        if (!response.ok) throw new Error(await response.text());
      }
      if (items.length) {
        const response = await fetch(`${API}/bills/bulk`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billingMonth: month, dueDate, items }) });
        if (!response.ok) throw new Error(await response.text());
      }
      setBilledIds((current) => new Set([...current, ...items.map((item) => item.contractId)]));
      setMessage(`${updates.length}건 수정, ${items.length}건 등록했습니다.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "일괄 청구서 생성에 실패했습니다."); }
    finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-xl font-bold">일괄 청구서 생성</h1>
            <p className="mt-1 text-sm text-slate-500">업체별 수도·전기 요금을 입력해 선택한 계약의 청구서를 생성합니다.</p>
          </div>
          <Link href="/" className="rounded-lg border px-4 py-2 text-sm">대시보드</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-5 sm:p-8">
        <div className="mb-5 grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-3">
          <label className="text-sm font-medium">
            청구 년월
            <input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setDueDate(`${event.target.value}-10`); }} className={`${input} mt-1`} />
          </label>
          <label className="text-sm font-medium">
            납부 기한
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={`${input} mt-1`} />
          </label>
          <div className="flex items-end">
            <button disabled={saving || loading} onClick={() => void submit()} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "생성 중..." : "선택 항목 청구서 생성"}
            </button>
          </div>
        </div>

        {message && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mb-4 whitespace-pre-wrap rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[1250px] table-fixed text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="w-[6%] whitespace-nowrap px-2 py-3">
                  <div className="flex items-center gap-2">
                    선택
                    <input
                      type="checkbox"
                      checked={availableContracts.length > 0 && availableContracts.every((contract) => lines[contract.id]?.selected)}
                      disabled={loading || availableContracts.length === 0}
                      onChange={(event) => setAllSelected(event.target.checked)}
                      aria-label="전체 선택"
                    />
                  </div>
                </th>
                <th className="w-[30%] whitespace-nowrap px-2 py-3">업체명 / 건물·호실</th>
                <th className="w-[16%] whitespace-nowrap px-2 py-3">수도사용량 (Ton)</th>
                <th className="w-[16%] whitespace-nowrap px-2 py-3">수도 사용료</th>
                <th className="w-[16%] whitespace-nowrap px-2 py-3">전기사용량 (kW)</th>
                <th className="w-[16%] whitespace-nowrap px-2 py-3">전기사용료 (부가세 포함)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">계약 자료를 불러오는 중입니다...</td></tr>
              ) : availableContracts.map((contract) => {
                const line = lines[contract.id] ?? {
                  selected: false,
                  waterUsage: "0",
                  waterTotalAmount: "0",
                  electricityUsage: "0",
                  electricityTotalAmount: "0",
                };

                return (
                  <tr key={contract.id} className={billedIds.has(contract.id) ? "bg-slate-50 text-slate-400" : ""}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={line.selected}
                        onChange={(event) => update(contract.id, "selected", event.target.checked)}
                        aria-label={`${contract.tenant?.name ?? contract.companyName ?? "업체"} 선택`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{contract.companyName || contract.tenant?.name || "업체명 미등록"}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {contract.building?.name} · {contract.unit?.unitNumber}호
                      </span>
                    </td>
                    {(["waterUsage", "waterTotalAmount", "electricityUsage", "electricityTotalAmount"] as const).map((key) => (
                      <td key={key} className="w-[16%] px-4 py-3">
                        <FormattedNumberInput
                          min="0"
                          step={key.endsWith("Usage") ? "0.01" : "1"}
                          value={line[key]}
                          onChange={(value) => update(contract.id, key, value)}
                          className={`${input} ${key.endsWith("Amount") ? "!w-3/4 text-right" : "!w-1/2 text-center"} min-w-0`}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
              {!loading && availableContracts.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">선택한 월에 계약 중인 업체가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
