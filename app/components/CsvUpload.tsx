import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
} from "@nextui-org/react";
import { useCsvHooks } from "~/hooks/useCsvHooks";

export default function CsvUpload(): JSX.Element {
  const {
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
    csvFile,
  } = useCsvHooks();

  return (
    <div className="p-2 font-sans">
      <div className="flex flex-row gap-3 ">
        <Card className="max-w-[400px]">
          <CardHeader className="text-2xl uppercase text-slate-600">
            Twilio API Lookup
          </CardHeader>
          {loading ? (
            <Spinner />
          ) : isFieldsParsed && !isCSVGenerated ? (
            <CardBody>
              <p className="text-xs mb-2">
                Please select the field which contains <b>phone numbers</b>
              </p>
            </CardBody>
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
              <input type="file" onChange={handleFileChange} />
            </CardBody>
          )}
          <CardFooter>
            {isCSVGenerated ? (
              <Button color="primary">
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                    csvData
                  )}`}
                  download="phone_details.csv"
                >
                  Download CSV
                </a>
              </Button>
            ) : (
              <div className="flex gap-3 justify-between w-full">
                <Button
                  color="primary"
                  // className={(isFieldsParsed && !selectedField) || !csvFile ? 'cursor-not-allowed' : ''}
                  isDisabled={
                    (isFieldsParsed && !selectedField) || !csvFile
                      ? true
                      : false
                  }
                  onClick={() =>
                    isFieldsParsed
                      ? apiCall("get-details")
                      : apiCall("parse-fields")
                  }
                  type="submit"
                >
                  {loading
                    ? "Processing..."
                    : isFieldsParsed
                    ? "Lookup"
                    : "Upload CSV"}
                </Button>
                {isFieldsParsed && !loading && (
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant="bordered">
                        {selectedField ? selectedField : "Select Field"}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Static Actions">
                      {csvFields.map((field, i) => (
                        <DropdownItem
                          onClick={() => setSelectedField(field)}
                          key={i}
                        >
                          {field}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
