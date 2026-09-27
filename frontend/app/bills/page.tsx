"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import FormattedNumberInput from "../components/FormattedNumberInput";

type Contract = {
  id: number;
  monthlyRent: number;
  maintenanceFee: number;
  status: string;
  building: {
    name: string;
  };
  unit: {
    floor: number;
    unitNumber: string;
    area?: number;
  };
  tenant: {
    name: string;
  };
};

type Bill = {
  id: number;
  billingMonth: string;
  dueDate: string;

  rentAmount: number;
  rentVat: number;

  maintenanceFee: number;
  maintenanceVat: number;

  electricityUsage: number;
  electricityAmount: number;
  electricityVat: number;

  waterUsage: number;
  waterAmount: number;

  originalAmount: number;
  totalVat: number;
  overdueInterest: number;
  totalAmount: number;

  paidAmount: number;
  unpaidAmount: number;
  status: string;
  createdAt: string;

  contract: {
    id: number;
    building?: {
      name: string;
    };
  unit?: {
    floor?: number;
    unitNumber: string;
    area?: number;
  };
    tenant?: {
      name: string;
    };
  };
};

export default function BillsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const [contractId, setContractId] = useState("");
  const [billingMonth, setBillingMonth] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [electricityUsage, setElectricityUsage] = useState("");
  const [electricityTotalAmount, setElectricityTotalAmount] = useState("");
  const [waterUsage, setWaterUsage] = useState("");
  const [waterTotalAmount, setWaterTotalAmount] = useState("");  
  const [editingBillId, setEditingBillId] = useState<number | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");
  const [billingMonthSearch, setBillingMonthSearch] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractResponse, billResponse] =
          await Promise.all([
            fetch("http://localhost:8080/api/contracts"),
            fetch("http://localhost:8080/api/bills"),
          ]);

        if (!contractResponse.ok || !billResponse.ok) {
          throw new Error("청구 관련 데이터 조회 실패");
        }

        const contractData: Contract[] =
          await contractResponse.json();

        const billData: Bill[] = await billResponse.json();

        setContracts(contractData);
        setBills(billData);
      } catch (error) {
        console.error(error);
        setError("청구 데이터를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !contractId ||
      !billingMonth ||
      !dueDate
    ) {
      alert("계약, 청구월, 납부기한을 입력해 주세요.");
      return;
    }

    const newBill = {
      contractId: Number(contractId),
      billingMonth,
      dueDate,

      electricityUsage: Number(electricityUsage || 0),
      electricityTotalAmount: Number(electricityTotalAmount || 0),

      waterUsage: Number(waterUsage || 0),
      waterTotalAmount: Number(waterTotalAmount || 0),
    };
    try {
      const response = await fetch(
        `http://localhost:8080/api/bills${editingBillId ? `/${editingBillId}` : ""}`,
        {
          method: editingBillId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newBill),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        let message = body;
        try {
          const parsed = JSON.parse(body) as { message?: string; detail?: string; title?: string };
          message = parsed.message || parsed.detail || parsed.title || body;
        } catch {
          // Keep the raw response when the server does not return JSON.
        }
        throw new Error(message || `청구서 ${editingBillId ? "수정" : "등록"}에 실패했습니다. (HTTP ${response.status})`);
      }

      const savedBill: Bill = await response.json();

      setBills((currentBills) => editingBillId
        ? currentBills.map((bill) => bill.id === editingBillId ? savedBill : bill)
        : [...currentBills, savedBill]);

      setContractId("");
      setBillingMonth("");
      setDueDate("");
      setElectricityTotalAmount("");
      setWaterTotalAmount("");
      setEditingBillId(null);
      setIsFormOpen(false);

      alert(editingBillId ? "청구서를 수정했습니다." : "청구서를 등록했습니다.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "청구서 처리 중 오류가 발생했습니다.");
    }
  };

  const openCreateForm = () => {
    setEditingBillId(null);
    setContractId(""); setBillingMonth(""); setDueDate("");
    setElectricityUsage(""); setElectricityTotalAmount("");
    setWaterUsage(""); setWaterTotalAmount("");
    setIsFormOpen(true);
  };

  const openEditForm = (bill: Bill) => {
    setEditingBillId(bill.id);
    setContractId(String(bill.contract.id));
    setBillingMonth(bill.billingMonth);
    setDueDate(bill.dueDate);
    setElectricityUsage(String(bill.electricityUsage ?? 0));
    setElectricityTotalAmount(String((bill.electricityAmount ?? 0) + (bill.electricityVat ?? 0)));
    setWaterUsage(String(bill.waterUsage ?? 0));
    setWaterTotalAmount(String(bill.waterAmount ?? 0));
    setIsFormOpen(true);
  };

  const deleteBill = async (bill: Bill) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    const response = await fetch(`http://localhost:8080/api/bills/${bill.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.text();
      let message = body;
      try {
        const parsed = JSON.parse(body) as { message?: string; detail?: string };
        message = parsed.message || parsed.detail || body;
      } catch {
        // Keep the raw response when the server does not return JSON.
      }
      alert(message || "청구서를 삭제하지 못했습니다.");
      return;
    }
    setBills((current) => current.filter((item) => item.id !== bill.id));
  };

  const filteredBills = bills.filter((bill) => bill.status !== "취소" &&
    (bill.contract?.tenant?.name ?? "").toLocaleLowerCase().includes(tenantSearch.trim().toLocaleLowerCase()) &&
    (bill.billingMonth ?? "").toLocaleLowerCase().includes(billingMonthSearch.trim().toLocaleLowerCase())
  ).sort((a, b) => b.billingMonth.localeCompare(a.billingMonth) ||
    (a.contract?.unit?.floor ?? 0) - (b.contract?.unit?.floor ?? 0) ||
    (a.contract?.unit?.area ?? 0) - (b.contract?.unit?.area ?? 0));

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              건물관리 시스템
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              임대료 청구관리
            </p>
          </div>

          <a
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            대시보드
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              청구서 목록
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              계약 기준으로 임대료와 공과금을 청구합니다.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            청구서 등록
          </button>
        </div>

        {isLoading && (
          <p className="mb-4 text-sm text-gray-500">
            청구 데이터를 불러오는 중입니다...
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {isFormOpen && (
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-gray-900">
              {editingBillId ? "청구서 수정" : "청구서 등록"}
            </h3>

            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  계약
                </label>

                <select
                  value={contractId}
                  disabled={editingBillId !== null}
                  onChange={(event) =>
                    setContractId(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">계약을 선택하세요</option>

                  {contracts.map((contract) => (
                    <option
                      key={contract.id}
                      value={contract.id}
                    >
                      {contract.building?.name} /{" "}
                      {contract.unit?.unitNumber} /{" "}
                      {contract.tenant?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  청구월
                </label>

                <input
                  type="month"
                  value={billingMonth}
                  onChange={(event) =>
                    setBillingMonth(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  납부기한
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  전기 사용량
                </label>
                <FormattedNumberInput
                  step="0.01"
                  min="0"
                  value={electricityUsage}
                  onChange={setElectricityUsage}
                  placeholder="예: 1250.5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  전기료 합계
                </label>
                <FormattedNumberInput
                  min="0"
                  value={electricityTotalAmount}
                  onChange={setElectricityTotalAmount}
                  placeholder="부가세 포함 금액"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  수도 사용량
                </label>
                <FormattedNumberInput
                  step="0.01"
                  min="0"
                  value={waterUsage}
                  onChange={setWaterUsage}
                  placeholder="예: 320.5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  수도료
                </label>
                <FormattedNumberInput
                  min="0"
                  value={waterTotalAmount}
                  onChange={setWaterTotalAmount}
                  placeholder="수도료 금액"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex items-end">
                <p className="text-sm text-gray-500">
                  임대료와 관리비는 계약정보에서 자동으로 계산됩니다.
                </p>
              </div>

              <div className="flex gap-2 md:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingBillId ? "청구서 수정" : "청구서 등록"}
                </button>

                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingBillId(null); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-4 grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2"><label className="text-sm font-medium text-gray-700"><span className="mb-1 block">임차인</span><input value={tenantSearch} onChange={(event) => setTenantSearch(event.target.value)} placeholder="임차인 이름 검색" className="w-full rounded-lg border border-gray-300 px-3 py-2" /></label><label className="text-sm font-medium text-gray-700"><span className="mb-1 block">청구월</span><input type="month" value={billingMonthSearch} onChange={(event) => setBillingMonthSearch(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" /></label></div><div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h3 className="font-semibold text-gray-900">
              등록된 청구서
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-3 font-medium">청구월</th>
                  <th className="px-6 py-3 font-medium">건물</th>
                  <th className="px-6 py-3 font-medium">임차인</th>
                  <th className="px-6 py-3 font-medium">임대료</th>
                  <th className="px-6 py-3 font-medium">관리비</th>
                  <th className="px-6 py-3 font-medium">전기사용량</th>
                  <th className="px-6 py-3 font-medium">전기료</th>
                  <th className="px-6 py-3 font-medium">수도사용량</th>
                  <th className="px-6 py-3 font-medium">수도료</th>
                  <th className="px-6 py-3 font-medium">청구액</th>
                  <th className="px-6 py-3 font-medium">관리</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="text-sm text-gray-700">
                    <td className="px-6 py-4">
                      {bill.billingMonth}
                    </td>

                    <td className="px-6 py-4">
                        {bill.contract?.building?.name}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/bills/${bill.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {bill.contract?.tenant?.name || "-"}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      {bill.rentAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {bill.maintenanceFee?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {(bill.electricityUsage ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {bill.electricityAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                       {(bill.waterUsage ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {bill.waterAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {bill.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEditForm(bill)} className="rounded border border-blue-300 px-2 py-1 text-[11px] leading-4 text-blue-700 hover:bg-blue-50">수정</button>
                        <button onClick={() => void deleteBill(bill)} className="rounded border border-red-300 px-2 py-1 text-[11px] leading-4 text-red-700 hover:bg-red-50">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
