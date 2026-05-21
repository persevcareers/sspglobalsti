import { useState, useEffect, useCallback, useRef } from "react";
import { fetchSheetData, modifySheetData, SheetName } from "@/services/api";
import { toast } from "sonner";

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
      setError(err instanceof Error ? err.message : "Failed to load data");
      toast.error(`Failed to load ${sheetName}`);
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
    toast.success(`Adding to ${sheetName}...`);

    try {
      const response = await modifySheetData("create", sheetName, recordData);
      if (response.success) {
        toast.success(`Successfully added to ${sheetName}`);
        loadData();
        return true;
      } else {
        setData(previousData);
        toast.error(response.message || "Failed to create record");
        return false;
      }
    } catch {
      setData(previousData);
      toast.error("Network error occurred");
      return false;
    }
  };

  const updateRecord = async (recordData: Partial<T>): Promise<boolean> => {
    const recordId = getRecordId(recordData);
    const previousData = [...data];
    setData((prev) =>
      prev.map((item) => {
        const itemId = getRecordId(item);
        return itemId && recordId && itemId === recordId ? { ...item, ...recordData } : item;
      })
    );

    try {
      const response = await modifySheetData("update", sheetName, recordData);
      if (response.success) {
        toast.success(`Successfully updated in ${sheetName}`);
        loadData();
        return true;
      } else {
        setData(previousData);
        toast.error(response.message || "Failed to update record");
        return false;
      }
    } catch {
      setData(previousData);
      toast.error("Network error occurred");
      return false;
    }
  };

  const deleteRecord = async (recordData: Partial<T>): Promise<boolean> => {
    const recordId = getRecordId(recordData);
    const previousData = [...data];
    setData((prev) =>
      prev.filter((item) => {
        const itemId = getRecordId(item);
        return !(itemId && recordId && itemId === recordId);
      })
    );

    try {
      const response = await modifySheetData("delete", sheetName, recordData);
      if (response.success) {
        toast.success(`Successfully deleted from ${sheetName}`);
        loadData();
        return true;
      } else {
        setData(previousData);
        toast.error(response.message || "Failed to delete record");
        return false;
      }
    } catch {
      setData(previousData);
      toast.error("Network error occurred");
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
