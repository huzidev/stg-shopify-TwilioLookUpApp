import { useActionData, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import { CsvStateHandler } from "~/types/types";

export function useCsvHooks(): CsvStateHandler {
  const [loading, setLoading] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFields, setCsvFields] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string>("");
  const [isFieldsParsed, setIsFieldsParsed] = useState<boolean>(false);
  const [results, setResults] = useState([]);
  const [csvData, setCsvData] = useState<string>("");
  const submit = useSubmit();
  const actionData: any = useActionData();
  const [isDetailsFetched, setIsDetailsFetched] = useState<boolean>(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files?.[0]);
    }
  }

  async function apiCall(type: string) {
    if (csvFile) {
      setLoading(true);
      const fileContent = await csvFile.text();
      const data = new FormData();
      data.append("fileContent", fileContent);
      data.append("type", type);
      type === "get-details" ? data.append("selectedField", selectedField) : "";
      submit(data, { method: "post" });
    }
  }

  useEffect(() => {
    if (actionData?.parsedCsvFields) {
      setCsvFields(actionData.parsedCsvFields);
      setLoading(false);
      setIsFieldsParsed(true);
    }
    if (actionData?.results || actionData?.csv) {
      setResults(actionData.results);
      setCsvData(actionData.csv);
      setIsDetailsFetched(true);
    }
  }, [actionData]);

  useEffect(() => {
    if (loading && isDetailsFetched) {
      setLoading(false);
    }
  }, [isDetailsFetched]);

  const isCSVGenerated: boolean = !loading && isDetailsFetched;
  const totalNumbers: number = results?.length;

  return {
    loading,
    csvFields,
    selectedField,
    setSelectedField,
    isFieldsParsed,
    totalNumbers,
    csvData,
    handleFileChange,
    apiCall,
    isCSVGenerated,
    csvFile
  };
}
