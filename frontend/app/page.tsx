"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8080/api";

type Building = { id: number; name: string; address?: string; units?: number };
type Unit = { id: number; unitNumber: string; building?: { id: number; name: string } };
type Contract = {
  id: number;
  status?: string;
  contractEndDate?: string | null;
  monthlyRent?: number | null;
  building?: { name: string };
  unit?: { unitNumber: string; floor?: number };
  tenant?: { name: string };
};
type Bill = {
  id: number;
  billingMonth?: string;
  dueDate?: string;
  totalAmount?: number;
  unpaidAmount?: number;
  status?: string;
  contract?: Contract;
};

const navGroups = [
  { title: "건물관리", links: [["건물·호실 관리", "/buildings"], ["임대인 관리", "/landlords"]] },
  { title: "계약관리", links: [["임차인 관리", "/tenants"], ["계약 이력", "/contracts"]] },
  { title: "임대료 청구/납부", links: [["전기검침 관리", "/electric-meter-readings"], ["청구관리", "/bills"], ["납부관리", "/payments"]] },
  { title: "일괄처리", links: [["청구 일괄처리", "/bulk-bills"], ["납부 일괄처리", "/bulk-payments"]] },
  { title: "유지관리", links: [["관련업체관리", "/vendors"], ["시설물관리", "/facilities"], ["점검·정비이력", "/maintenance-history"], ["정기점검관리", "/maintenance-plans"]] },
] as const;

const money = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const formatMoney = (amount: number) => `${money.format(amount)}원`;

async function getList<T,>(path: string): Promise<T[]> {
  const response = await fetch(`${API_URL}/${path}`);
  if (!response.ok) throw new Error(`${path} 정보를 불러오지 못했습니다.`);
  return response.json();
}

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getList<Building>("buildings"),
      getList<Contract>("contracts"),
      getList<Bill>("bills"),
    ]).then(async ([buildingData, contractData, billData]) => {
      const unitLists = await Promise.all(buildingData.map((building) => getList<Unit>(`buildings/${building.id}/units`)));
      const unitData = unitLists.flat();
      if (!active) return;
      setBuildings(buildingData);
      setUnits(unitData);
      setContracts(contractData);
      setBills(billData);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "현황 정보를 불러오지 못했습니다.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentBills = bills.filter((bill) => bill.billingMonth?.startsWith(month));
    const unpaid = currentBills.reduce((sum, bill) => sum + (Number(bill.unpaidAmount) || 0), 0);
    const activeContracts = contracts.filter((contract) => !contract.contractEndDate || contract.contractEndDate >= now.toISOString().slice(0, 10)).length;
    return { activeContracts, currentBillTotal: currentBills.reduce((sum, bill) => sum + (Number(bill.totalAmount) || 0), 0), unpaid };
  }, [bills, contracts]);

  const recentBills = [...bills].sort((a, b) => (b.billingMonth ?? "").localeCompare(a.billingMonth ?? "") || b.id - a.id).slice(0, 5);
  const expiringContracts = contracts
    .filter((contract) => contract.contractEndDate)
    .map((contract) => ({ ...contract, daysLeft: Math.ceil((new Date(`${contract.contractEndDate}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000) }))
    .filter((contract) => contract.daysLeft >= 0 && contract.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const cards = [
    { label: "등록 건물", value: `${buildings.length.toLocaleString("ko-KR")}동`, note: "관리 중인 건물", tone: "bg-blue-50 text-blue-600", icon: "▦" },
    { label: "등록 호실", value: `${units.length.toLocaleString("ko-KR")}실`, note: "전체 건물 호실", tone: "bg-violet-50 text-violet-600", icon: "⌂" },
    { label: "진행 중 계약", value: `${metrics.activeContracts}건`, note: "만료일 기준 유효 계약", tone: "bg-teal-50 text-teal-600", icon: "▤" },
    { label: "이번 달 미수금", value: formatMoney(metrics.unpaid), note: `이번 달 청구 ${formatMoney(metrics.currentBillTotal)}`, tone: "bg-rose-50 text-rose-600", icon: "₩" },
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white">B</span>
            <span><span className="block text-lg font-bold tracking-tight">빌딩케어</span><span className="text-xs text-slate-500">건물 관리 시스템</span></span>
          </Link>
          <div className="flex items-center gap-3 text-sm"><span className="hidden text-slate-500 sm:inline">관리자님, 안녕하세요</span><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 font-semibold text-blue-700">관</span></div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200/80 bg-white px-4 py-6 md:block">
          <p className="mb-3 px-3 text-[11px] font-bold tracking-[.14em] text-slate-400">WORKSPACE</p>
          <Link href="/" className="mb-5 flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white"><span>▦</span> 대시보드</Link>
          <nav className="space-y-2">
            {navGroups.map((group) => <div key={group.title}><p className="mb-1 rounded-lg bg-blue-50/80 px-3 py-1.5 text-sm font-bold text-slate-800">{group.title}</p><div className="space-y-0">{group.links.map(([label, href]) => <Link key={href} href={href} className="block rounded-lg px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">{label}</Link>)}</div></div>)}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-8 sm:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-blue-600">Overview</p><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">대시보드</h1><p className="mt-2 text-sm text-slate-500">건물 운영 현황과 주요 일정을 한눈에 확인하세요.</p></div>
            <Link href="/bills" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">청구 내역 보기 <span aria-hidden="true">→</span></Link>
          </div>

          {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} 백엔드 서버가 실행 중인지 확인해 주세요.</div>}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => <article key={card.label} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,.03)]"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{card.label}</p><span className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${card.tone}`}>{card.icon}</span></div><p className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{loading ? "—" : card.value}</p><p className="mt-1 text-xs text-slate-500">{card.note}</p></article>)}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_12px_rgba(15,23,42,.03)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-semibold text-slate-900">최근 청구 내역</h2><p className="mt-1 text-xs text-slate-500">최근 등록된 청구서</p></div><Link href="/bills" className="text-sm font-medium text-blue-600 hover:text-blue-700">전체 보기 →</Link></div>
              {loading ? <p className="p-8 text-center text-sm text-slate-500">현황을 불러오는 중입니다...</p> : recentBills.length === 0 ? <div className="p-10 text-center"><p className="text-sm font-medium text-slate-700">등록된 청구 내역이 없습니다.</p><p className="mt-1 text-xs text-slate-500">청구서를 등록하면 이곳에서 확인할 수 있습니다.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3 font-medium sm:px-6">청구월 / 건물</th><th className="px-5 py-3 font-medium">임차인</th><th className="px-5 py-3 font-medium">청구 금액</th><th className="px-5 py-3 font-medium">상태</th></tr></thead><tbody className="divide-y divide-slate-100">{recentBills.map((bill) => <tr key={bill.id} className="text-sm"><td className="px-5 py-4 sm:px-6"><Link href={`/bills/${bill.id}`} className="font-medium text-slate-800 hover:text-blue-600">{bill.billingMonth ?? "-"}</Link><span className="mt-1 block text-xs text-slate-500">{bill.contract?.building?.name ?? "건물 미지정"} · {bill.contract?.unit?.unitNumber ?? "-"}호</span></td><td className="px-5 py-4 text-slate-600">{bill.contract?.tenant?.name ?? "-"}</td><td className="px-5 py-4"><span className="font-medium">{formatMoney(Number(bill.totalAmount) || 0)}</span><span className="mt-1 block text-xs text-slate-500">미수 {formatMoney(Number(bill.unpaidAmount) || 0)}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${(Number(bill.unpaidAmount) || 0) <= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{bill.status || ((Number(bill.unpaidAmount) || 0) <= 0 ? "완납" : "미납")}</span></td></tr>)}</tbody></table></div>}
            </section>

            <section className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_12px_rgba(15,23,42,.03)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">계약 만료 예정</h2><p className="mt-1 text-xs text-slate-500">앞으로 60일 이내 만료</p></div><Link href="/contracts" className="text-sm font-medium text-blue-600 hover:text-blue-700">계약 관리 →</Link></div>
              {loading ? <p className="p-8 text-center text-sm text-slate-500">일정을 불러오는 중입니다...</p> : expiringContracts.length === 0 ? <div className="p-10 text-center"><p className="text-sm font-medium text-slate-700">예정된 계약 만료가 없습니다.</p><p className="mt-1 text-xs text-slate-500">만료일이 가까워지면 여기에 표시됩니다.</p></div> : <ul className="divide-y divide-slate-100">{expiringContracts.map((contract) => <li key={contract.id} className="flex items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{contract.tenant?.name ?? "임차인 미지정"}</p><p className="mt-1 truncate text-xs text-slate-500">{contract.building?.name ?? "건물 미지정"} · {contract.unit?.unitNumber ?? "-"}호</p></div><div className="shrink-0 text-right"><p className="text-xs font-semibold text-amber-700">{contract.daysLeft === 0 ? "오늘 만료" : `${contract.daysLeft}일 남음`}</p><p className="mt-1 text-xs text-slate-400">{contract.contractEndDate}</p></div></li>)}</ul>}
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,.03)] sm:p-6"><div className="mb-4"><h2 className="font-semibold text-slate-900">빠른 메뉴</h2><p className="mt-1 text-xs text-slate-500">자주 사용하는 관리 화면으로 이동합니다.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["건물 등록 및 관리", "/buildings", "건물과 호실 정보를 관리합니다."], ["임대 계약 관리", "/contracts", "임차인 계약과 만료일을 확인합니다."], ["이번 달 청구", "/bills", "월별 임대료와 관리비를 확인합니다."], ["수납 내역", "/payments", "납부 내역을 조회하고 등록합니다."], ["일괄 청구서 생성", "/bulk-bills", "월별 공과금을 입력해 청구서를 만듭니다."], ["일괄 납부 생성", "/bulk-payments", "납부 자료를 한 번에 등록합니다."], ["전기 검침 입력", "/electric-meter-readings", "계량기별 전기 사용량을 기록합니다."]].map(([title, href, description]) => <Link key={href} href={href} className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"><span className="text-sm font-semibold text-slate-800">{title} <span className="text-blue-600">↗</span></span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></Link>)}</div></section>
          <p className="mt-6 text-center text-xs text-slate-400">총 {buildings.length.toLocaleString("ko-KR")}개 건물 · {units.length.toLocaleString("ko-KR")}개 호실 · {contracts.length.toLocaleString("ko-KR")}개 계약</p>
        </section>
      </div>
    </main>
  );
}
