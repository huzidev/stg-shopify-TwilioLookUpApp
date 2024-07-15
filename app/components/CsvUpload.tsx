import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Spinner
} from "@nextui-org/react";
import { useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";

interface CsvUploadProps {
  csvData: string;
  totalNumbers: number;
  isDetailsFetched: boolean;
}

export default function CsvUpload({
  csvData,
  totalNumbers,
  isDetailsFetched,
}: CsvUploadProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const submit = useSubmit();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files?.[0]);
    }
  }

  async function handleFileUpload() {
    if (csvFile) {
      setLoading(true);
      const fileContent = await csvFile.text();
      const data = new FormData();
      data.append("fileContent", fileContent);
      submit(data, { method: "post" });
    }
  }

  useEffect(() => {
    if (loading && isDetailsFetched) {
      setLoading(false);
    }
  }, [isDetailsFetched]);

  const isCSVGenerated: boolean = !loading && isDetailsFetched;
  console.log("SW isCSVGenerated", isCSVGenerated);

  return (
    <div className="p-2 font-sans">
      <div className="flex flex-row gap-3 ">
        <Card className="max-w-[400px]">
          <CardHeader className="text-2xl uppercase text-slate-600">
            Twilio API Lookup
          </CardHeader>
          {loading ? (
            <Spinner />
          ) : isCSVGenerated ? (
            <CardBody>
              <p className="text-xs mb-2">
                {totalNumbers} Numbers Details Fetched Successfully
              </p>  
            </CardBody>
          ) : (
            <CardBody>
              <p className="text-xs mb-2">
                Upload a formatted CSV to lookup in bulk via twilio api.
              </p>
              <Input type="file" onChange={handleFileChange} />
            </CardBody>
          )}
          <CardFooter>
            {isCSVGenerated ? (
              <Button color="primary">
                <a 
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`}
                  download="phone_details.csv"
                >
                  Download CSV
                </a>
              </Button>
            ) : (
              <Button color="primary" onClick={handleFileUpload} type="submit">
                {loading ? "Processing" : "Upload CSV"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
