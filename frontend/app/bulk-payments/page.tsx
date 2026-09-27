"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FormattedNumberInput from "../components/FormattedNumberInput";

const API = "http://localhost:8080/api";
type Bill = {
  id: number;
  billingMonth: string;
  totalAmount: number;
  unpaidAmount: number;
  status?: string;
  contract?: { companyName?: string; building?: { name: string }; unit?: { unitNumber: string }; tenant?: { name: string } };
};
type Payment = { id: number; amount: number; paidDate: string; paymentMethod?: string; note?: string; bill: { id: number } };
type Line = { fullPayment: boolean; amount: string; paidDate: string; paymentMethod: string; note: string; partialLimit: number };
const currentMonth = () => { const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`; };
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

async function responseError(response: Response) {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { message?: string; detail?: string; error?: string };
    return parsed.message || parsed.detail || parsed.error || body;
  } catch {
    return body || `요청에 실패했습니다. (${response.status})`;
  }
}

export default function BulkPaymentsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [bills, setBills] = useState<Bill[]>([]);
  const [lines, setLines] = useState<Record<number, Line>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setMessage(""); setBills([]);
    Promise.all([fetch(`${API}/bills`), fetch(`${API}/payments`)]).then(async ([billResponse, paymentResponse]) => {
      if (!billResponse.ok || !paymentResponse.ok) throw new Error("청구 또는 납부 자료를 불러오지 못했습니다.");
      const allBills: Bill[] = await billResponse.json();
      const allPayments: Payment[] = await paymentResponse.json();
      if (!active) return;
      const monthlyBills = allBills.filter((bill) => bill.billingMonth === month && bill.status !== "취소");
      const paymentByBill = new Map<number, Payment>();
      allPayments.sort((a, b) => a.id - b.id).forEach((payment) => paymentByBill.set(payment.bill.id, payment));
      setBills(monthlyBills);
      setLines(Object.fromEntries(monthlyBills.map((bill) => {
        const payment = paymentByBill.get(bill.id);
        const fullPayment = payment
          ? Number(payment.amount) === Number(bill.totalAmount)
          : Number(bill.unpaidAmount) === Number(bill.totalAmount);
        return [bill.id, {
          fullPayment,
          amount: payment ? String(payment.amount) : (fullPayment ? String(bill.totalAmount) : ""),
          paidDate: payment?.paidDate || today(),
          paymentMethod: payment?.paymentMethod || "계좌이체",
          note: payment?.note || "",
          partialLimit: Number(bill.unpaidAmount) + Number(payment?.amount ?? 0),
        }];
      })));
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "자료 조회에 실패했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  const update = (id: number, key: keyof Line, value: string | boolean) => setLines((current) => ({
    ...current, [id]: { ...current[id], [key]: value },
  }));

  const setAllFullPayment = (checked: boolean) => setLines((current) => ({
    ...current,
    ...Object.fromEntries(bills.map((bill) => {
      const line = current[bill.id] ?? {
        fullPayment: true,
        amount: String(bill.totalAmount),
        paidDate: today(),
        paymentMethod: "계좌이체",
        note: "",
        partialLimit: Number(bill.unpaidAmount),
      };
      return [bill.id, {
        ...line,
        fullPayment: checked,
        amount: checked ? String(bill.totalAmount) : "",
      }];
    })),
  }));

  const register = async () => {
    setError(""); setMessage("");
    const entries = bills.map((bill) => ({ bill, line: lines[bill.id] })).filter(({ line }) => line && line.amount.trim() !== "");
    if (!entries.length) { setError("등록할 납부금액을 입력해 주세요."); return; }
    if (entries.some(({ line }) => !line.paidDate)) { setError("납부일을 입력해 주세요."); return; }
    const invalidFull = entries.some(({ bill, line }) => line.fullPayment && Number(line.amount) !== Number(bill.totalAmount));
    if (invalidFull) { setError("전액 납부 금액은 해당 청구금액과 같아야 합니다."); return; }
    const invalidPartial = entries.some(({ bill, line }) => !line.fullPayment && (
      !Number.isFinite(Number(line.amount)) || Number(line.amount) <= 0 || Number(line.amount) > line.partialLimit
    ));
    if (invalidPartial) { setError("부분 납부 금액은 0보다 크고 미납 잔액 이하여야 합니다."); return; }

    setSaving(true);
    try {
      const items = entries.map(({ bill, line }) => ({
        billId: bill.id,
        fullPayment: line.fullPayment,
        amount: Number(line.amount),
        paidDate: line.paidDate,
        paymentMethod: line.paymentMethod || "계좌이체",
        note: line.note,
      }));
      const response = await fetch(`${API}/payments/bulk`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMonth: month, items }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setMessage(`${items.length}건의 납부자료를 등록했습니다. 기존 납부자료는 수정하고 신규 자료는 추가했습니다.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "납부자료 등록에 실패했습니다."); }
    finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-white text-slate-900">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4"><div><h1 className="text-xl font-bold">일괄 납부 자료 생성</h1><p className="mt-1 text-sm text-slate-500">청구월별 납부금액과 방법을 입력해 등록합니다.</p></div><Link href="/" className="rounded-lg border px-4 py-2 text-sm">대시보드</Link></div></header>
    <section className="mx-auto max-w-[1500px] p-5 sm:p-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <label className="w-full max-w-sm text-sm font-semibold">청구 년월<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={`${input} mt-2`} /></label>
        <button disabled={saving || loading} onClick={() => void register()} className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">{saving ? "등록 중..." : "등록"}</button>
      </div>
      {message && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-4 whitespace-pre-wrap rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[1120px] table-fixed text-left text-sm">
        <colgroup><col className="w-[14%]" /><col className="w-[22%]" /><col className="w-[13%]" /><col className="w-[11%]" /><col className="w-[16%]" /><col className="w-[12%]" /><col className="w-[12%]" /></colgroup>
        <thead className="bg-slate-100 text-slate-700"><tr>
          <th className="px-5 py-3 font-semibold">업체명 / 건물·호실</th>
          <th className="px-5 py-3 font-semibold">청구액</th>
          <th className="px-5 py-3 text-center font-semibold"><label className="inline-flex cursor-pointer items-center justify-center gap-2"><span>전액납부</span><input type="checkbox" checked={bills.length > 0 && bills.every((bill) => lines[bill.id]?.fullPayment)} onChange={(event) => setAllFullPayment(event.target.checked)} aria-label="전체 전액납부 선택" className="h-4 w-4 accent-blue-600" /></label></th>
          <th className="px-5 py-3 font-semibold">납부금액</th>
          <th className="px-5 py-3 font-semibold">납부일</th>
          <th className="px-5 py-3 font-semibold">납부방법</th>
          <th className="px-5 py-3 font-semibold">메모</th>
          </tr>
          </thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? <tr><td colSpan={7} className="p-10 text-center text-slate-500">이번 달 청구자료를 불러오는 중입니다...</td></tr> : bills.map((bill) => {
            const line = lines[bill.id] ?? { fullPayment: true, amount: String(bill.totalAmount), paidDate: today(), paymentMethod: "계좌이체", note: "", partialLimit: Number(bill.unpaidAmount) };
            return <tr key={bill.id}>
              <td className="px-5 py-3"><span className="block text-base font-medium">{bill.contract?.companyName || bill.contract?.tenant?.name || "업체명 미등록"}</span><span className="mt-1 block text-xs text-slate-500">{bill.contract?.building?.name} · {bill.contract?.unit?.unitNumber}호</span></td>
              <td className="px-5 py-3 text-base">{Number(bill.totalAmount).toLocaleString()}원</td>
              <td className="px-5 py-3 text-center"><input type="checkbox" checked={line.fullPayment} onChange={(event) => { update(bill.id, "fullPayment", event.target.checked); update(bill.id, "amount", event.target.checked ? String(bill.totalAmount) : ""); }} aria-label={`${bill.contract?.tenant?.name ?? bill.contract?.companyName ?? "업체"} 전액 납부`} className="h-5 w-5 accent-blue-600" /></td>
              <td className="px-5 py-3"><FormattedNumberInput min="1" max={line.fullPayment ? bill.totalAmount : line.partialLimit} disabled={line.fullPayment} value={line.amount} onChange={(value) => update(bill.id, "amount", value)} className={`${input} disabled:bg-slate-100 disabled:text-slate-700`} /></td>
              <td className="px-5 py-3"><input type="date" value={line.paidDate} onChange={(event) => update(bill.id, "paidDate", event.target.value)} className={input} /></td>
              <td className="px-5 py-3"><select value={line.paymentMethod} onChange={(event) => update(bill.id, "paymentMethod", event.target.value)} className={input}><option>계좌이체</option><option>현금</option><option>카드</option><option>기타</option></select></td>
              <td className="px-5 py-3"><input value={line.note} onChange={(event) => update(bill.id, "note", event.target.value)} placeholder="필요한 경우 입력" className={input} /></td>
            </tr>;
          })}
          {!loading && bills.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">선택한 청구 년월의 청구자료가 없습니다.</td></tr>}
        </tbody>
      </table></div>
      <p className="mt-3 text-xs text-slate-500">이번 달 청구자료가 기본 조회됩니다. 전액납부를 선택하면 청구액이 납부금액으로 복사됩니다. 등록할 때 기존 납부자료는 수정하고, 없는 자료는 새로 추가합니다.</p>
    </section>
  </main>;
}
