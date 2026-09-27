"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FormattedNumberInput from "../components/FormattedNumberInput";

const API = "http://localhost:8080/api";
type Meter = { id: number; meterPosition: string; meterName: string; meterType: string; meterModel?: string | null; createdAt?: string };
type ApiReading = { id: number; meter?: Meter | null; billingMonth: string; readingDate: string; previousReading: number; currentReading: number; usageAmount: number; note?: string | null; createdAt?: string };
type Entry = { id?: number; meterId: number; previousReading: string; currentReading: string; note: string; createdAt?: string };
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const monthNow = () => today().slice(0, 7);
const previousMonth = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};
const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function ElectricMeterReadingsPage() {
  const [month, setMonth] = useState(monthNow());
  const [readingDate, setReadingDate] = useState(today());
  const [meters, setMeters] = useState<Meter[]>([]);
  const [entries, setEntries] = useState<Record<number, Entry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`${API}/electric-meters`),
      fetch(`${API}/electric-meter-readings/month/${month}`),
      fetch(`${API}/electric-meter-readings/month/${previousMonth(month)}`),
    ])
      .then(async ([meterResponse, readingResponse, previousReadingResponse]) => {
        if (!meterResponse.ok || !readingResponse.ok || !previousReadingResponse.ok) throw new Error("계량기 위치정보 또는 검침 자료를 불러오지 못했습니다.");
        const meterData: Meter[] = await meterResponse.json();
        const readingData: ApiReading[] = await readingResponse.json();
        const previousReadingData: ApiReading[] = await previousReadingResponse.json();
        if (!active) return;
        setMeters(meterData);
        setEntries(Object.fromEntries(meterData.map((meter) => {
          const reading = readingData.find((item) => item.meter?.id === meter.id);
          const previousMonthReading = previousReadingData.find((item) => item.meter?.id === meter.id);
          return [meter.id, reading ? {
            id: reading.id,
            meterId: meter.id,
            previousReading: String(previousMonthReading?.currentReading ?? reading.previousReading),
            currentReading: String(reading.currentReading),
            note: reading.note ?? "",
            createdAt: reading.createdAt,
          } : {
            meterId: meter.id,
            previousReading: previousMonthReading ? String(previousMonthReading.currentReading) : "",
            currentReading: "",
            note: "",
          }];
        })));
        const firstExistingDate = readingData.find((item) => item.meter)?.readingDate;
        if (firstExistingDate) setReadingDate(firstExistingDate);
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "자료 조회에 실패했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  const update = (meterId: number, key: keyof Entry, value: string) => setEntries((current) => ({
    ...current,
    [meterId]: { ...current[meterId], [key]: value },
  }));

  const removeReading = async (meterId: number) => {
    const entry = entries[meterId];
    if (!entry?.id) return;
    setError(""); setMessage("");
    const response = await fetch(`${API}/electric-meter-readings/${entry.id}`, { method: "DELETE" });
    if (!response.ok) { setError("검침 자료를 삭제하지 못했습니다."); return; }
    setEntries((current) => ({ ...current, [meterId]: { meterId, previousReading: entry.previousReading, currentReading: "", note: "" } }));
    setMessage("검침 자료를 삭제했습니다.");
  };

  const save = async () => {
    setError(""); setMessage("");
    if (!readingDate) { setError("검침일을 입력해 주세요."); return; }
    const changed = meters.map((meter) => entries[meter.id]).filter((entry): entry is Entry => !!entry && (
      entry.id != null || entry.currentReading !== "" || entry.note.trim() !== ""
    ));
    if (changed.length === 0) { setError("검침값을 입력해 주세요."); return; }
    if (changed.some((entry) => entry.previousReading === "" || entry.currentReading === ""
      || Number(entry.previousReading) < 0 || Number(entry.currentReading) < Number(entry.previousReading))) {
      setError("전월·금월 검침값을 입력해 주세요. 금월 검침값은 전월 검침값보다 작을 수 없습니다."); return;
    }

    setSaving(true);
    try {
      const body = {
        billingMonth: month,
        readingDate,
        readings: changed.map((entry) => ({
          id: entry.id ?? null,
          meterId: entry.meterId,
          previousReading: Number(entry.previousReading),
          currentReading: Number(entry.currentReading),
          note: entry.note,
        })),
      };
      const response = await fetch(`${API}/electric-meter-readings/bulk`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await response.text());
      const saved: ApiReading[] = await response.json();
      setEntries((current) => {
        const next = { ...current };
        saved.forEach((reading) => {
          if (!reading.meter) return;
          next[reading.meter.id] = {
            id: reading.id, meterId: reading.meter.id,
            previousReading: String(reading.previousReading), currentReading: String(reading.currentReading),
            note: reading.note ?? "", createdAt: reading.createdAt,
          };
        });
        return next;
      });
      setMessage(`${saved.length}건의 전기 검침 자료를 저장했습니다.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "검침 자료 저장에 실패했습니다."); }
    finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div><h1 className="text-xl font-bold">전기 검침 입력</h1><p className="mt-1 text-sm text-slate-500">등록된 계량기 위치정보를 조회해 월별 검침값을 입력합니다.</p></div><Link href="/" className="rounded-lg border px-4 py-2 text-sm">대시보드</Link></div></header>
    <section className="mx-auto max-w-7xl p-5 sm:p-8">
      <div className="mb-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">전월 검침 자료의 금월 검침값을 이번 달 전월 검침 칸에 자동으로 불러옵니다.</div>
      <div className="mb-5 grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-3">
        <label className="text-sm font-medium">검침일<input type="date" value={readingDate} onChange={(event) => setReadingDate(event.target.value)} className={`${input} mt-1`} /></label>
        <label className="text-sm font-medium">검침 년월<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={`${input} mt-1`} /></label>
        <div className="flex items-end"><button disabled={saving || loading} onClick={() => void save()} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "저장 중..." : "검침 자료 저장"}</button></div>
      </div>
      {message && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-4 whitespace-pre-wrap rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[1250px] text-left text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="px-4 py-3">순번</th>
          <th className="px-4 py-3">계량기 위치</th>
          <th className="px-4 py-3">계량기명</th>
          <th className="px-4 py-3">전월 검침</th>
          <th className="px-4 py-3">금월 검침</th>
          <th className="px-4 py-3">사용량</th>
          <th className="px-4 py-3">메모</th><th className="px-4 py-3">생성일자</th>
          <th className="px-4 py-3">관리</th></tr></thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan={11} className="p-8 text-center text-slate-500">계량기 위치정보를 불러오는 중입니다...</td></tr> : [...meters].sort((a, b) => a.id - b.id).map((meter) => {
              const entry = entries[meter.id] ?? { meterId: meter.id, previousReading: "", currentReading: "", note: "" };
              const usage = Number(entry.currentReading || 0) - Number(entry.previousReading || 0);
              return <tr key={meter.id}>
                <td className="px-4 py-3">{meter.id}</td><td className="px-4 py-3">{meter.meterPosition}</td>
                <td className="px-4 py-3 font-medium">{meter.meterName}</td>
                <td className="px-4 py-3"><FormattedNumberInput min="0" step="0.001" value={entry.previousReading} onChange={(value) => update(meter.id, "previousReading", value)} className={`${input} min-w-28`} /></td>
                <td className="px-4 py-3"><FormattedNumberInput min="0" step="0.001" value={entry.currentReading} onChange={(value) => update(meter.id, "currentReading", value)} className={`${input} min-w-28`} /></td>
                <td className="px-4 py-3 font-medium">{entry.currentReading && entry.previousReading && usage >= 0 ? usage.toLocaleString() : "-"}</td>
                <td className="px-4 py-3"><input value={entry.note} onChange={(event) => update(meter.id, "note", event.target.value)} placeholder="메모" className={`${input} min-w-36`} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{meter.createdAt ? new Date(meter.createdAt).toLocaleDateString("ko-KR") : "-"}</td>
                <td className="px-4 py-3">{entry.id && <button onClick={() => void removeReading(meter.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs text-rose-700">검침 삭제</button>}</td>
              </tr>;
            })}
            {!loading && meters.length === 0 && <tr><td colSpan={11} className="p-8 text-center text-slate-500">계량기 위치정보가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </main>;
}
