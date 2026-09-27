"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Contract = {
  id: number;
  contractStartDate: string;
  contractEndDate: string | null;
  moveInDate: string | null;
  contractArea: number | null;
  contractPyeong: number | null;
  depositAmount: number | null;
  monthlyRent: number | null;
  maintenanceFee: number | null;
  paymentDay: number | null;
  overdueRate: number | null;
  rentVatApplicable: boolean;
  rentVatRate: number | null;
  maintenanceVatApplicable: boolean;
  maintenanceVatRate: number | null;
  specialNotes: string | null;
  status: string;
  building?: {
    name: string;
    address: string;
  };
  unit?: {
    floor: number;
    unitNumber: string;
    area: number;
  };
  tenant?: {
    name: string;
    sangho: string;
    phone: string;
  };
};

function money(value?: number | null) {
  return `${(value ?? 0).toLocaleString()}원`;
}

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params.id;

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!contractId) {
      return;
    }

    const fetchContract = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/contracts/${contractId}`
        );

        if (!response.ok) {
          throw new Error("계약 조회 실패");
        }

        const data: Contract = await response.json();
        setContract(data);
      } catch (error) {
        console.error(error);
        setError("계약 상세정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContract();
  }, [contractId]);

  if (isLoading) {
    return (
      <main className="p-8">
        계약정보를 불러오는 중입니다...
      </main>
    );
  }

  if (error || !contract) {
    return (
      <main className="p-8 text-red-600">
        {error || "계약을 찾을 수 없습니다."}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              계약 상세정보
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              임대차 계약 상세내용
            </p>
          </div>

          <a
            href="/contracts"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            계약 목록
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              건물·호실
            </h2>

            <div className="space-y-3 text-sm">
              <p>
                <span className="text-gray-500">건물명: </span>
                {contract.building?.name || "-"}
              </p>

              <p>
                <span className="text-gray-500">주소: </span>
                {contract.building?.address || "-"}
              </p>

              <p>
                <span className="text-gray-500">호실: </span>
                {contract.unit?.floor}층{" "}
                {contract.unit?.unitNumber || "-"}
              </p>

              <p>
                <span className="text-gray-500">면적: </span>
                {contract.unit?.area || 0}㎡
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              임차인
            </h2>

            <div className="space-y-3 text-sm">
              <p>
                <span className="text-gray-500">계약자: </span>
                {contract.tenant?.name || "-"}
              </p>

              <p>
                <span className="text-gray-500">업체명: </span>
                {contract.tenant?.sangho || "-"}
              </p>

              <p>
                <span className="text-gray-500">연락처: </span>
                {contract.tenant?.phone || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              계약상태
            </h2>

            <p className="mb-3">
              <span className="text-gray-500">상태: </span>
              <span className="font-semibold text-blue-600">
                {contract.status}
              </span>
            </p>

            <p className="text-sm">
              <span className="text-gray-500">납부일: </span>
              매월 {contract.paymentDay || "-"}일
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            계약기간
          </h2>

          <div className="grid gap-4 text-sm md:grid-cols-3">
            <p>
              <span className="text-gray-500">계약 시작일: </span>
              {contract.contractStartDate || "-"}
            </p>

            <p>
              <span className="text-gray-500">계약 종료일: </span>
              {contract.contractEndDate || "미정"}
            </p>

            <p>
              <span className="text-gray-500">입주일: </span>
              {contract.moveInDate || "-"}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">
              계약금액 및 부가세
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-3">항목</th>
                  <th className="px-6 py-3">금액</th>
                  <th className="px-6 py-3">부가세 적용</th>
                  <th className="px-6 py-3">부가세율</th>
                </tr>
              </thead>

              <tbody className="divide-y text-sm">
                <tr>
                  <td className="px-6 py-4">보증금</td>
                  <td className="px-6 py-4">
                    {money(contract.depositAmount)}
                  </td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4">-</td>
                </tr>

                <tr>
                  <td className="px-6 py-4">월 임대료</td>
                  <td className="px-6 py-4">
                    {money(contract.monthlyRent)}
                  </td>
                  <td className="px-6 py-4">
                    {contract.rentVatApplicable ? "예" : "아니오"}
                  </td>
                  <td className="px-6 py-4">
                    {contract.rentVatRate || 0}%
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-4">관리비</td>
                  <td className="px-6 py-4">
                    {money(contract.maintenanceFee)}
                  </td>
                  <td className="px-6 py-4">
                    {contract.maintenanceVatApplicable ? "예" : "아니오"}
                  </td>
                  <td className="px-6 py-4">
                    {contract.maintenanceVatRate || 0}%
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-4">연체이율</td>
                  <td className="px-6 py-4">
                    연 {contract.overdueRate || 0}%
                  </td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">
            계약 특이사항
          </h2>

          <p className="whitespace-pre-wrap text-sm text-gray-700">
            {contract.specialNotes || "등록된 특이사항이 없습니다."}
          </p>
        </div>
      </section>
    </main>
  );
}