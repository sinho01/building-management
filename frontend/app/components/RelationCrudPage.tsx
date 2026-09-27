"use client";

import Link from "next/link";
import { formatNumber } from "./numberFormat";
import FormattedNumberInput from "./FormattedNumberInput";
import { FormEvent, useEffect, useRef, useState } from "react";

type Item = Record<string, unknown> & { id: number };
export type RelationField = { key: string; label: string; type?: "text" | "date" | "number" | "textarea" | "select"; required?: boolean; endpoint?: string; recordPath?: string; displayGroups?: string[][]; optionLabel?: string[]; align?: "left" | "center" | "right" };
type SearchField = { key: string; label: string; path: string; paths?: string[]; type?: "text" | "month" | "select" | "combobox"; endpoint?: string; optionLabel?: string[] };
type Props = { title: string; description: string; endpoint: string; fields: RelationField[]; columns: RelationField[]; searchFields?: SearchField[]; initialSearch?: Record<string, string>; sortBy?: { path: string; direction: "asc" | "desc" }[]; createLabel?: string };
const API_URL = "http://localhost:8080/api";
const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2";

function getValue(value: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, key) => current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined, value);
}

function getColumnDisplayValue(item: Item, column: RelationField) {
  if (column.displayGroups) {
    const values = column.displayGroups
      .map((group) => group.map((path) => getValue(item, path)).find((value) => value !== null && value !== undefined && value !== ""))
      .filter((value) => value !== null && value !== undefined && value !== "");
    return values.length ? values.join(" / ") : "-";
  }
  const value = getValue(item, column.recordPath ?? column.key);
  return column.type === "number"
    ? formatNumber(value as number | string | null | undefined)
    : String(value ?? "-");
}

export default function RelationCrudPage({ title, description, endpoint, fields, columns, searchFields = [], initialSearch = {}, sortBy = [], createLabel = "등록" }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [options, setOptions] = useState<Record<string, Item[]>>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState<Record<string, string>>(initialSearch);
  const [activeCombo, setActiveCombo] = useState<string | null>(null);
  const comboRef = useRef<HTMLDivElement | null>(null);
  const blank = () => Object.fromEntries(fields.map((field) => [field.key, ""]));
  const filteredItems = items.filter((item) => searchFields.every((field) => {
    const term = (search[field.key] ?? "").trim().toLocaleLowerCase();
    if (!term) return true;
    if (field.type === "select") return String(getValue(item, field.path) ?? "") === term;
    return [field.path, ...(field.paths ?? [])].some((path) => String(getValue(item, path) ?? "").toLocaleLowerCase().includes(term));
  })).sort((a, b) => {
    for (const { path, direction } of sortBy) {
      const left = getValue(a, path);
      const right = getValue(b, path);
      const comparison = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left ?? "").localeCompare(String(right ?? ""), "ko", { numeric: true });
      if (comparison !== 0) return direction === "asc" ? comparison : -comparison;
    }
    return 0;
  });
  const loadItems = async () => { const response = await fetch(`${API_URL}${endpoint}`); if (!response.ok) throw new Error(); setItems(await response.json()); };
  useEffect(() => {
    const initialLoad = async () => {
      try {
        await loadItems();
        const optionFields = [...fields, ...searchFields].filter((field) => field.endpoint);
        const loaded = await Promise.all(optionFields.map(async (field) => {
          const response = await fetch(`${API_URL}${field.endpoint}`);
          if (!response.ok) throw new Error();
          return [field.key, await response.json()] as const;
        }));
        setOptions(Object.fromEntries(loaded));
      } catch { setError("관리 정보를 불러오지 못했습니다."); }
    };
    void initialLoad();
  }, []);
  useEffect(() => {
    const closeComboOnOutsideClick = (event: PointerEvent) => {
      if (!comboRef.current?.contains(event.target as Node)) setActiveCombo(null);
    };
    document.addEventListener("pointerdown", closeComboOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeComboOnOutsideClick);
  }, []);
  const close = () => { setOpen(false); setEditingId(null); setForm(blank()); };
  const edit = (item: Item) => { setNotice(""); setEditingId(item.id); setForm(Object.fromEntries(fields.map((field) => [field.key, String(getValue(item, field.recordPath ?? field.key) ?? "")]))); setOpen(true); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = Object.fromEntries(fields.map((field) => [field.key, field.type === "number" && form[field.key] ? Number(form[field.key]) : form[field.key] || null]));
    try {
      const response = await fetch(`${API_URL}${endpoint}${editingId ? `/${editingId}` : ""}`, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error();
      await loadItems();
      setNotice(editingId ? "수정이 완료되었습니다." : `${createLabel}이 완료되었습니다.`);
      close();
    } catch { setNotice(""); setError("저장에 실패했습니다."); }
  };
  const remove = async (item: Item) => {
    if (!window.confirm("이 항목을 삭제하시겠습니까?")) return;
    try { const response = await fetch(`${API_URL}${endpoint}/${item.id}`, { method: "DELETE" }); if (!response.ok) throw new Error(); setItems((current) => current.filter((value) => value.id !== item.id)); setNotice("삭제가 완료되었습니다."); } catch { setNotice(""); setError("연결된 이력이 있어 삭제할 수 없습니다."); }
  };
  return <main className="min-h-screen bg-gray-100"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><h1 className="text-2xl font-bold">건물관리 시스템</h1><p className="mt-1 text-sm text-gray-500">{title}</p></div><Link href="/" className="rounded-lg border px-4 py-2 text-sm">대시보드</Link></div></header><section className="mx-auto max-w-7xl p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-gray-500">{description}</p></div><button onClick={() => { setNotice(""); setForm(blank()); setEditingId(null); setOpen(true); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">{createLabel}</button></div>{notice && <p className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">{notice}</p>}{error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}{searchFields.length > 0 && <div className="mb-4 grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2">{searchFields.map((field) => <label key={field.key} className="text-sm font-medium text-gray-700"><span className="mb-1 block">{field.label}</span>{field.type === "combobox" ? <div ref={comboRef} className="relative"><input type="text" role="combobox" aria-controls={`${field.key}-options`} aria-expanded={activeCombo === field.key} aria-autocomplete="list" value={search[field.key] ?? ""} onFocus={() => setActiveCombo(field.key)} onChange={(event) => { setSearch((current) => ({ ...current, [field.key]: event.target.value })); setActiveCombo(field.key); }} placeholder="업체명 입력" className={inputClass} />{activeCombo === field.key && <div id={`${field.key}-options`} role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">{Array.from(new Set((options[field.key] ?? []).map((option) => String(field.optionLabel?.map((path) => getValue(option, path)).find((value) => value !== null && value !== undefined && value !== "") ?? "").trim()).filter(Boolean))).filter((name) => name.toLocaleLowerCase().includes((search[field.key] ?? "").trim().toLocaleLowerCase())).map((name) => <button key={name} type="button" role="option" aria-selected={search[field.key] === name} onClick={() => { setSearch((current) => ({ ...current, [field.key]: name })); setActiveCombo(null); }} className="block w-full px-3 py-2 text-left hover:bg-gray-100">{name}</button>)}</div>}</div> : field.type === "select" ? <select value={search[field.key] ?? ""} onChange={(event) => setSearch((current) => ({ ...current, [field.key]: event.target.value }))} className={inputClass}><option value="">전체 업체</option>{(options[field.key] ?? []).map((option) => <option key={option.id} value={String(option.id)}>{(field.optionLabel ?? ["name"]).map((path) => String(getValue(option, path) ?? "")).filter(Boolean).join(" / ")}</option>)}</select> : <input type={field.type ?? "text"} value={search[field.key] ?? ""} onChange={(event) => setSearch((current) => ({ ...current, [field.key]: event.target.value }))} placeholder="검색" className={inputClass} />}</label>)}</div>}{open && <div className="mb-6 rounded-xl bg-white p-6 shadow-sm"><h3 className="mb-5 text-lg font-semibold">{editingId ? "수정" : createLabel}</h3><form onSubmit={submit} className="grid gap-4 md:grid-cols-2">{fields.map((field) => <label key={field.key} className="text-sm font-medium"><span className="mb-1 block">{field.label}</span>{field.type === "select" ? <select required={field.required} value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} className={inputClass}><option value="">선택하세요</option>{(options[field.key] ?? []).map((option) => <option key={option.id} value={option.id}>{(field.optionLabel ?? ["name"]).map((path) => String(getValue(option, path) ?? "")).filter(Boolean).join(" / ")}</option>)}</select> : field.type === "textarea" ? <textarea value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} className={`${inputClass} min-h-24`} /> : field.type === "number" ? <FormattedNumberInput required={field.required} min="0" value={form[field.key] ?? ""} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} className={inputClass} /> : <input required={field.required} type={field.type ?? "text"} value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} className={inputClass} />}</label>)}<div className="flex gap-2 md:col-span-2"><button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">{editingId ? "수정 저장" : createLabel}</button><button type="button" onClick={close} className="rounded-lg border px-4 py-2 text-sm">취소</button></div></form></div>}<div className="overflow-x-auto rounded-xl bg-white shadow-sm"><table className="w-full min-w-[800px]"><thead className="bg-gray-50"><tr className="text-left text-sm text-gray-600">{columns.map((column) => <th key={column.key} className={`px-6 py-3 ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : "text-left"}`}>{column.label}</th>)}<th className="px-6 py-3">관리</th></tr></thead><tbody className="divide-y">{filteredItems.map((item) => <tr key={item.id} className="text-sm">{columns.map((column) => <td key={column.key} className={`px-6 py-4 ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : "text-left"}`}>{getColumnDisplayValue(item, column)}</td>)}<td className="px-3 py-2"><div className="flex w-fit items-center gap-1"><button onClick={() => edit(item)} className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700">수정</button><button onClick={() => void remove(item)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700">삭제</button></div></td></tr>)}</tbody></table></div></section></main>;
}
