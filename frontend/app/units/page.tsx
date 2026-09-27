"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatNumber } from "../components/numberFormat";
import FormattedNumberInput from "../components/FormattedNumberInput";

type Unit = {
  id: number;
  floor: number;
  unitNumber: string;
  area: number;
  status: string;
  tenantName: string;
};

const initialUnits: Unit[] = [];

export default function UnitsPage() {
    const [units, setUnits] = useState<Unit[]>(initialUnits);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [floor, setFloor] = useState("");
    const [unitNumber, setUnitNumber] = useState("");
    const [area, setArea] = useState("");
    const [status, setStatus] = useState("공실");
    const [tenantName, setTenantName] = useState("-");

    const searchParams = useSearchParams();
    const buildingId = searchParams.get("buildingId");

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
    if (!buildingId) {
        setError("건물 정보가 없습니다.");
        setIsLoading(false);
        return;
    }

    const fetchUnits = async () => {
        try {
        const response = await fetch(
            `http://localhost:8080/api/buildings/${buildingId}/units`
        );

        if (!response.ok) {
            throw new Error("호실 목록 조회 실패");
        }

        const data: Unit[] = await response.json();
        setUnits(data);
        } catch (error) {
        console.error(error);
        setError("호실 목록을 불러오지 못했습니다.");
        } finally {
        setIsLoading(false);
        }
    };

    fetchUnits();
    }, [buildingId]);

    const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
    ) => {
    event.preventDefault();

    if (!buildingId) {
        alert("건물 정보가 없습니다.");
        return;
    }

    if (!floor || !unitNumber || !area) {
        alert("층수, 호실번호, 면적을 입력해 주세요.");
        return;
    }

    const newUnit = {
        floor: Number(floor),
        unitNumber,
        area: Number(area),
        status,
        tenantName,
    };

    try {
        const response = await fetch(
        `http://localhost:8080/api/buildings/${buildingId}/units`,
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(newUnit),
        }
        );

        if (!response.ok) {
        throw new Error("호실 등록 실패");
        }

        const savedUnit: Unit = await response.json();

        setUnits((currentUnits) => [
        ...currentUnits,
        savedUnit,
        ]);

        setFloor("");
        setUnitNumber("");
        setArea("");
        setStatus("공실");
        setTenantName("-");
        setIsFormOpen(false);

        alert("호실이 등록되었습니다.");
    } catch (error) {
        console.error(error);
        alert("호실 등록 중 오류가 발생했습니다.");
    }
    };

    return (
        <main className="min-h-screen bg-gray-100">
        <header className="border-b bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                건물관리 시스템
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                호실 관리
                </p>
            </div>

            <a
                href="/buildings"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
                건물 목록
            </a>
            </div>
        </header>

        <section className="mx-auto max-w-7xl p-6">
            <div className="mb-6 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">
                샘플 빌딩 호실 목록
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                층별 호실과 임대 상태를 관리합니다.
                </p>
            </div>

            <button
                onClick={() => setIsFormOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
                호실 등록
            </button>
            </div>

            {isFormOpen && (
            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-semibold text-gray-900">
                호실 등록
                </h3>

                <form
                onSubmit={handleSubmit}
                className="grid gap-4 md:grid-cols-2"
                >
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                    층수
                    </label>
                    <FormattedNumberInput
                    min="1"
                    value={floor}
                    onChange={setFloor}
                    placeholder="예: 2"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                    호실번호
                    </label>
                    <input
                        value={unitNumber}
                        onChange={(event) => setUnitNumber(event.target.value)}
                        placeholder="예: 201호"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                    면적
                    </label>
                    <FormattedNumberInput
                    min="0"
                    step="0.01"
                    value={area}
                    onChange={setArea}
                    placeholder="예: 33"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                    임차인명
                </label>

                <input
                    value={tenantName}
                    onChange={(event) => setTenantName(event.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                    임대 상태
                    </label>
                    <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    >
                    <option value="공실">공실</option>
                    <option value="임대 중">임대 중</option>
                    <option value="사용 불가">사용 불가</option>
                    </select>
                </div>

                <div className="flex gap-2 md:col-span-2">
                    <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                    저장
                    </button>

                    <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                    취소
                    </button>
                </div>
                </form>
            </div>
            )}

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b px-6 py-4">
                <h3 className="font-semibold text-gray-900">
                등록된 호실
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-600">
                    <th className="px-6 py-3 font-medium">층</th>
                    <th className="px-6 py-3 font-medium">호실</th>
                    <th className="px-6 py-3 font-medium">면적</th>
                    <th className="px-6 py-3 font-medium">임차인</th>
                    <th className="px-6 py-3 font-medium">상태</th>
                    </tr>
                </thead>

                <tbody className="divide-y">
                    {[...units].sort((a, b) => a.floor - b.floor || a.area - b.area).map((unit) => (
                    <tr key={unit.id} className="text-sm text-gray-700">
                        <td className="px-6 py-4">{formatNumber(unit.floor)}층</td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                        {unit.unitNumber}
                        </td>
                        <td className="px-6 py-4">{formatNumber(unit.area)}㎡</td>
                        <td className="px-6 py-4">{unit.tenantName}</td>
                        <td className="px-6 py-4">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                unit.status === "임대 중"
                                    ? "bg-blue-100 text-blue-700"
                                    : unit.status === "공실"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                            >
                                {unit.status}
                            </span>
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
