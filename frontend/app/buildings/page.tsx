"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatNumber } from "../components/numberFormat";
import FormattedNumberInput from "../components/FormattedNumberInput";

type Landlord = {
  id: number;
  name: string;
};

type Building = {
  id: number;
  name: string;
  address: string;
  floors: number;
  units: number;
  status: string;
  landlord?: Landlord | null;
};

const initialBuildings: Building[] = [];

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [floors, setFloors] = useState("");
  const [units, setUnits] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [landlordId, setLandlordId] = useState("");
  const [editingBuildingId, setEditingBuildingId] =
  useState<number | null>(null);

  const handleDelete = async (id: number) => {
    const confirmed = confirm(
      "정말 이 건물을 삭제하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/buildings/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        alert(
          errorData?.message ||
            "삭제할 수 없습니다. 연결된 호실이나 계약을 확인하세요."
        );

        return;
      }

      setBuildings((currentBuildings) =>
        currentBuildings.filter(
          (building) => building.id !== id
        )
      );

      alert("건물이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      alert("건물 삭제 중 오류가 발생했습니다.");
    }
    const handleStatusChange = async (
      id: number,
      status: string
    ) => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/buildings/${id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({ status }),
          }
        );

        if (!response.ok) {
          throw new Error("건물 상태 변경 실패");
        }

        const updatedBuilding: Building =
          await response.json();

        setBuildings((currentBuildings) =>
          currentBuildings.map((building) =>
            building.id === updatedBuilding.id
              ? updatedBuilding
              : building
          )
        );

        alert("건물 상태가 변경되었습니다.");
      } catch (error) {
        console.error(error);
        alert("건물 상태 변경에 실패했습니다.");
      }
    };
    
  };  
  
useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const [buildingResponse, landlordResponse] =
        await Promise.all([
          fetch("http://localhost:8080/api/buildings"),
          fetch("http://localhost:8080/api/landlords"),
        ]);

      if (!buildingResponse.ok || !landlordResponse.ok) {
        throw new Error("기본 데이터 조회 실패");
      }

      const buildingData: Building[] =
        await buildingResponse.json();

      const landlordData: Landlord[] =
        await landlordResponse.json();

      setBuildings(buildingData);
      setLandlords(landlordData);
    } catch (error) {
      console.error(error);
      setError("건물 또는 임대인 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  fetchInitialData();
  }, []);

  const handleStatusChange = async (
    id: number,
    status: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/buildings/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("건물 상태 변경 실패");
      }

      const updatedBuilding: Building =
        await response.json();

      setBuildings((currentBuildings) =>
        currentBuildings.map((building) =>
          building.id === updatedBuilding.id
            ? updatedBuilding
            : building
        )
      );

      alert("건물 상태가 변경되었습니다.");
    } catch (error) {
      console.error(error);
      alert("건물 상태 변경에 실패했습니다.");
    }
  };
  const handleEdit = (building: Building) => {
    setEditingBuildingId(building.id);
    setName(building.name);
    setAddress(building.address);
    setFloors(String(building.floors));
    setUnits(String(building.units));
    setLandlordId(
      building.landlord?.id
        ? String(building.landlord.id)
        : ""
    );
    setIsFormOpen(true);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
    ) => {
    event.preventDefault();

    if (!name || !address || !floors || !units) {
        alert("모든 항목을 입력해 주세요.");
        return;
    }

  const newBuilding = {
    name,
    address,
    floors: Number(floors),
    units: Number(units),
    status: "관리 중",
    landlord: landlordId
      ? { id: Number(landlordId) }
      : null,
  };
  setLandlordId("");
  try {
      const isEditing = editingBuildingId !== null;

      const url = isEditing
        ? `http://localhost:8080/api/buildings/${editingBuildingId}`
        : "http://localhost:8080/api/buildings";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(newBuilding),
      });
      if (!response.ok) {
      throw new Error("건물 등록 실패");
      }

      const savedBuilding: Building = await response.json();

      if (isEditing) {
        setBuildings((currentBuildings) =>
          currentBuildings.map((building) =>
            building.id === savedBuilding.id
              ? savedBuilding
              : building
          )
        );
      } else {
        setBuildings((currentBuildings) => [
          ...currentBuildings,
          savedBuilding,
        ]);
      }
      setName("");
      setAddress("");
      setFloors("");
      setUnits("");
      setLandlordId("");
      setEditingBuildingId(null);
      setIsFormOpen(false);

      alert("건물이 등록되었습니다.");
    } catch (error) {
        console.error(error);
        alert("건물 등록 중 오류가 발생했습니다.");
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
              건물·호실 관리
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
              건물 목록
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              관리할 건물과 기본 정보를 등록합니다.
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            건물 등록
          </button>
        </div>

        {isFormOpen && (
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-gray-900">
              {editingBuildingId ? "건물 정보 수정" : "건물 등록"}
            </h3>

            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-2"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  건물명
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="예: 강남 오피스텔"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  임대인
                </label>

                <select
                  value={landlordId}
                  onChange={(event) =>
                    setLandlordId(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">임대인을 선택하세요</option>

                  {landlords.map((landlord) => (
                    <option
                      key={landlord.id}
                      value={landlord.id}
                    >
                      {landlord.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  주소
                </label>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="예: 서울시 강남구"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  층수
                </label>
                <FormattedNumberInput
                  min="1"
                  value={floors}
                  onChange={setFloors}
                  placeholder="예: 5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  전체 호실 수
                </label>
                <FormattedNumberInput
                  min="1"
                  value={units}
                  onChange={setUnits}
                  placeholder="예: 20"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 md:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingBuildingId ? "수정 저장" : "저장"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingBuildingId(null);
                    setName("");
                    setAddress("");
                    setFloors("");
                    setUnits("");
                    setLandlordId("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}
        {isLoading && (
            <p className="mb-4 text-sm text-gray-500">
                건물 목록을 불러오는 중입니다...
            </p>
            )}

            {error && (
            <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                {error}
            </p>
        )}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h3 className="font-semibold text-gray-900">
              등록된 건물
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-3 font-medium">건물명</th>
                  <th className="px-6 py-3 font-medium">임대인</th>
                  <th className="px-6 py-3 font-medium">주소</th>
                  <th className="px-6 py-3 font-medium">층수</th>
                  <th className="px-6 py-3 font-medium">호실 수</th>
                  <th className="px-6 py-3 font-medium">상태</th>
                  <th className="px-6 py-3 font-medium">호실</th>
                  <th className="px-6 py-3 font-medium">관리</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {buildings.map((building) => (
                  <tr key={building.id} className="text-sm text-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {building.name}
                    </td>
                    <td className="px-6 py-4">
                      {building.landlord?.name || "-"}
                    </td>
                    <td className="px-6 py-4">{building.address}</td>
                    <td className="px-6 py-4">{formatNumber(building.floors)}층</td>
                    <td className="px-6 py-4">{formatNumber(building.units)}개</td>
                    <td className="px-6 py-4">
                      <select
                        value={building.status}
                        onChange={(event) =>
                          handleStatusChange(
                            building.id,
                            event.target.value
                          )
                        }
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="관리 중">관리 중</option>
                        <option value="사용 중지">사용 중지</option>
                        <option value="폐쇄">폐쇄</option>
                        <option value="보관">보관</option>
                      </select>
                    </td>                    
                    <td className="px-6 py-4">
                      <a
                          href={`/units?buildingId=${building.id}`}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                          호실관리
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit(building)}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        수정
                      </button>
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
