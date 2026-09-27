"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

  contract?: {
    building?: {
      name: string;
      address: string;
    };
    unit?: {
      unitNumber: string;
      floor: number;
      area: number;
    };
    tenant?: {
      name: string;
      phone: string;
      email: string;
    };
  };
};

function money(value?: number) {
  return `${(value ?? 0).toLocaleString()}원`;
}

export default function BillDetailPage() {
  const params = useParams();
  const billId = params.id;

  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [electricityUsage, setElectricityUsage] = useState("");
  const [electricityTotalAmount, setElectricityTotalAmount] = useState("");

  const [waterUsage, setWaterUsage] = useState("");
  const [waterTotalAmount, setWaterTotalAmount] = useState("");

  useEffect(() => {
    if (!billId) {
      return;
    }

    const fetchBill = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/bills/${billId}`
        );

        if (!response.ok) {
          throw new Error("청구서 조회 실패");
        }

        const data: Bill = await response.json();
        setBill(data);
      } catch (error) {
        console.error(error);
        setError("청구 상세정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBill();
  }, [billId]);

  if (isLoading) {
    return (
      <main className="p-8">
        <p>청구 상세정보를 불러오는 중입니다...</p>
      </main>
    );
  }

  if (error || !bill) {
    return (
      <main className="p-8">
        <p className="text-red-600">
          {error || "청구서를 찾을 수 없습니다."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              청구 상세정보
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {bill.billingMonth} 청구서
            </p>
          </div>

          <a
            href="/bills"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            청구 목록
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">건물</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {bill.contract?.building?.name || "-"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {bill.contract?.building?.address || "-"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">호실</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {bill.contract?.unit?.floor}층{" "}
              {bill.contract?.unit?.unitNumber || "-"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              면적: {bill.contract?.unit?.area || 0}㎡
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">임차인</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {bill.contract?.tenant?.name || "-"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {bill.contract?.tenant?.phone || "-"}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              항목별 청구내역
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-3">항목</th>
                  <th className="px-6 py-3">사용량</th>
                  <th className="px-6 py-3">공급가액</th>
                  <th className="px-6 py-3">부가세</th>
                  <th className="px-6 py-3">합계</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4 font-medium">
                    임대료
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4">
                    {money(bill.rentAmount)}
                  </td>
                  <td className="px-6 py-4">
                    {money(bill.rentVat)}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {money(
                      bill.rentAmount + bill.rentVat
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium">
                    관리비
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4">
                    {money(bill.maintenanceFee)}
                  </td>
                  <td className="px-6 py-4">
                    {money(bill.maintenanceVat)}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {money(
                      bill.maintenanceFee +
                        bill.maintenanceVat
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">
                    전기료
                  </td>
                  <td className="px-6 py-4">
                    {(bill.electricityUsage ?? 0).toLocaleString("ko-KR")}Kw
                  </td>
                  <td className="px-6 py-4">
                    {money(bill.electricityAmount)}
                  </td>
                  <td className="px-6 py-4">
                    {money(bill.electricityVat ?? 0)}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {money(
                      bill.electricityAmount +
                        bill.electricityVat
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">
                    상。하수도
                 </td>
                  <td className="px-6 py-4">
                    {(bill.waterUsage ?? 0).toLocaleString("ko-KR")}Ton
                  </td>
                  <td className="px-6 py-4">
                    {money(bill.waterAmount)}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 font-medium">
                    {money(
                      bill.waterAmount
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              청구 요약
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  공급가액 합계
                </span>
                <span>{money(bill.originalAmount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  부가세 합계
                </span>
                <span>{money(bill.totalVat)}</span>
              </div>

              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <span>청구합계</span>
                <span>{money(bill.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              납부 정보
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  납부기한
                </span>
                <span>{bill.dueDate}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  납부금액
                </span>
                <span>{money(bill.paidAmount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  미납금액
                </span>
                <span className="text-red-600">
                  {money(bill.unpaidAmount)}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-500">
                  상태
                </span>
                <span className="font-semibold">
                  {bill.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
