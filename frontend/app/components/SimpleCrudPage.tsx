"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Item = Record<string, unknown> & { id: number };

export type CrudField = {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  required?: boolean;
  secret?: boolean;
};

type Props = { title: string; description: string; endpoint: string; fields: CrudField[]; columns: CrudField[]; searchFields?: { key: string; label: string; placeholder?: string }[]; sortBy?: string };
const API_URL = "http://localhost:8080/api";
const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2";

export default function SimpleCrudPage({ title, description, endpoint, fields, columns, searchFields = [], sortBy }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState<Record<string, string>>({});
  const emptyValues = () => Object.fromEntries(fields.map((field) => [field.key, ""]));
  const loadItems = async () => {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error("목록 조회에 실패했습니다.");
    setItems(await response.json());
  };

  useEffect(() => {
    const initialLoad = async () => {
      try {
        await loadItems();
      } catch (caughtError) {
        console.error(caughtError);
        setError("목록을 불러오지 못했습니다.");
      }
    };
    void initialLoad();
  }, []);
  const closeForm = () => { setIsFormOpen(false); setEditingId(null); setValues(emptyValues()); };
  const openCreate = () => { setError(""); setNotice(""); setValues(emptyValues()); setEditingId(null); setIsFormOpen(true); };
  const openEdit = (item: Item) => {
    setError(""); setNotice(""); setEditingId(item.id);
    setValues(Object.fromEntries(fields.map((field) => [field.key, field.secret ? "" : String(item[field.key] ?? "")])));
    setIsFormOpen(true);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = Object.fromEntries(fields.filter((field) => !field.secret || values[field.key]).map((field) => [field.key, values[field.key] ?? ""]));
    try {
      const response = await fetch(`${API_URL}${endpoint}${editingId ? `/${editingId}` : ""}`, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("저장에 실패했습니다.");
      await loadItems();
      setNotice(editingId ? "수정이 완료되었습니다." : "등록이 완료되었습니다.");
      closeForm();
    } catch (caughtError) { console.error(caughtError); setNotice(""); setError("저장에 실패했습니다. 필수 정보를 확인해 주세요."); }
  };
  const remove = async (item: Item) => {
    if (!window.confirm("이 항목을 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`${API_URL}${endpoint}/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("삭제에 실패했습니다.");
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setNotice("삭제가 완료되었습니다.");
    } catch (caughtError) { console.error(caughtError); setNotice(""); setError("연결된 계약 또는 관리 이력이 있어 삭제할 수 없습니다."); }
  };

  const filteredItems = items.filter((item) => searchFields.every(({ key }) => {
    const term = (search[key] ?? "").trim().toLocaleLowerCase();
    return !term || String(item[key] ?? "").toLocaleLowerCase().includes(term);
  })).sort((a, b) => sortBy ? String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""), "ko") : 0);

  return <main className="min-h-screen bg-gray-100"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><h1 className="text-2xl font-bold text-gray-900">건물관리 시스템</h1><p className="mt-1 text-sm text-gray-500">{title}</p></div><Link href="/" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">대시보드</Link></div></header><section className="mx-auto max-w-7xl p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-semibold text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-500">{description}</p></div><button onClick={openCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">등록</button></div>{notice && <p className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">{notice}</p>}{error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}{searchFields.length > 0 && <div className="mb-4 grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2">{searchFields.map((field) => <label key={field.key} className="text-sm font-medium text-gray-700"><span className="mb-1 block">{field.label}</span><input value={search[field.key] ?? ""} onChange={(event) => setSearch((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={`${field.label} 검색`} className="w-full rounded-lg border border-gray-300 px-3 py-2" /></label>)}</div>}{isFormOpen && <div className="mb-6 rounded-xl bg-white p-6 shadow-sm"><h3 className="mb-5 text-lg font-semibold">{editingId ? "수정" : "등록"}</h3><form onSubmit={submit} className="grid gap-4 md:grid-cols-2">{fields.map((field) => <label key={field.key} className="block text-sm font-medium text-gray-700"><span className="mb-1 block">{field.label}</span>{field.type === "textarea" ? <textarea required={field.required} value={values[field.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} className={`${inputClass} min-h-24`} /> : <input required={field.required} type={field.secret ? "password" : field.type ?? "text"} value={values[field.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} className={inputClass} />}</label>)}<div className="flex gap-2 md:col-span-2"><button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">저장</button><button type="button" onClick={closeForm} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">취소</button></div></form></div>}<div className="overflow-x-auto rounded-xl bg-white shadow-sm"><table className="w-full min-w-[800px]"><thead className="bg-gray-50"><tr className="text-left text-sm text-gray-600">{columns.map((column) => <th key={column.key} className="px-6 py-3 font-medium">{column.label}</th>)}<th className="px-6 py-3 font-medium">관리</th></tr></thead><tbody className="divide-y">{filteredItems.map((item) => <tr key={item.id} className="text-sm text-gray-700">{columns.map((column) => <td key={column.key} className="px-6 py-4">{String(item[column.key] ?? "-")}</td>)}<td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => openEdit(item)} className="rounded border border-blue-300 px-3 py-1 text-xs text-blue-700">수정</button><button onClick={() => void remove(item)} className="rounded border border-red-300 px-3 py-1 text-xs text-red-700">삭제</button></div></td></tr>)}{filteredItems.length === 0 && <tr><td colSpan={columns.length + 1} className="px-6 py-10 text-center text-sm text-gray-500">{items.length === 0 ? "등록된 항목이 없습니다." : "검색 결과가 없습니다."}</td></tr>}</tbody></table></div></section></main>;
}
