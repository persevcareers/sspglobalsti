import { useState, useEffect, useCallback, useRef } from "react";
import { fetchSheetData, modifySheetData, SheetName } from "@/services/api";
import { showToast } from "@/lib/toast-utils";

function getRecordId(record: Record<string, unknown>): string | undefined {
  const idKey = Object.keys(record).find((k) => k.includes("ID") || k.includes("Id") || k.includes("id"));
  return idKey ? (record[idKey] as string) : undefined;
}

function getIdField(record: Record<string, unknown>): string | undefined {
  return Object.keys(record).find((k) => k.includes("ID") || k.includes("Id") || k.includes("id"));
}

function tempId(): string {
  return "tmp_" + Math.random().toString(36).substring(2, 11);
}

export function useSheetsData<T>(sheetName: SheetName) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const snapshotRef = useRef<T[]>([]);
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchSheetData<T>(sheetName);
      setData(result);
      snapshotRef.current = result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
      showToast("error", `Could not load ${sheetName}`, "SheetsData", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }, [sheetName]);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    loadData();
  }, [loadData]);

  const createRecord = async (recordData: Partial<T>): Promise<boolean> => {
    const idField = getIdField(recordData as Record<string, unknown>);
    const optimisticRecord = { ...recordData } as Record<string, unknown>;
    if (idField && !optimisticRecord[idField]) {
      optimisticRecord[idField] = tempId();
    }
    const previousData = [...data];
    setData((prev) => [...prev, optimisticRecord as T]);

    try {
      const response = await modifySheetData("create", sheetName, recordData);
      if (response.success) {
        showToast("success", `Created in ${sheetName}`, "SheetsData");
        loadData();
        return true;
      } else {
        setData(previousData);
        showToast("error", `Failed to create in ${sheetName}`, "SheetsData", { description: response.message });
        return false;
      }
    } catch {
      setData(previousData);
      showToast("error", `Network error saving to ${sheetName}`, "SheetsData");
      return false;
    }
  };

  const updateRecord = async (recordData: Partial<T>): Promise<boolean> => {
    const recordId = getRecordId(recordData as Record<string, unknown>);
    const previousData = [...data];
    setData((prev) =>
      prev.map((item) => {
        const itemId = getRecordId(item as Record<string, unknown>);
        return itemId && recordId && itemId === recordId ? { ...item, ...recordData } : item;
      })
    );

    try {
      const response = await modifySheetData("update", sheetName, recordData);
      if (response.success) {
        showToast("success", `Updated in ${sheetName}`, "SheetsData");
        loadData();
        return true;
      } else {
        setData(previousData);
        showToast("error", `Failed to update in ${sheetName}`, "SheetsData", { description: response.message });
        return false;
      }
    } catch {
      setData(previousData);
      showToast("error", `Network error updating ${sheetName}`, "SheetsData");
      return false;
    }
  };

  const deleteRecord = async (recordData: Partial<T>): Promise<boolean> => {
    const recordId = getRecordId(recordData as Record<string, unknown>);
    const previousData = [...data];
    setData((prev) =>
      prev.filter((item) => {
        const itemId = getRecordId(item as Record<string, unknown>);
        return !(itemId && recordId && itemId === recordId);
      })
    );

    try {
      const response = await modifySheetData("delete", sheetName, recordData);
      if (response.success) {
        showToast("success", `Deleted from ${sheetName}`, "SheetsData");
        loadData();
        return true;
      } else {
        setData(previousData);
        showToast("error", `Failed to delete from ${sheetName}`, "SheetsData", { description: response.message });
        return false;
      }
    } catch {
      setData(previousData);
      showToast("error", `Network error deleting from ${sheetName}`, "SheetsData");
      return false;
    }
  };

  return {
    data,
    isLoading,
    error,
    refresh: loadData,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
