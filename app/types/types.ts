export interface CsvStateHandler {
    loading: boolean;
    csvFields: string[];
    selectedField: string;
    setSelectedField: React.Dispatch<React.SetStateAction<string>>;
    isFieldsParsed: boolean;
    totalNumbers: number;
    csvData: string;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    apiCall: (type: string) => Promise<void>;
    isCSVGenerated: boolean;
    csvFile: File | null;
}