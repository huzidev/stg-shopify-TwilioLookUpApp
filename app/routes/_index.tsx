import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import twilio from "twilio";
import CsvUpload from "~/components/CsvUpload";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);
  const formData = await request.formData();
  const fileContent = formData.get("fileContent") as string;

  // Extract and store phone-numbers into array
  function getPhoneNumbers(content: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const phoneNumbers: string[] = [];
      Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          results.data.forEach((row: { [key: string]: any }) => {
            const number = row.PHONE;
            if (number) {
              phoneNumbers.push(number);
            }
          });
          // will return promise as array of string
          resolve(phoneNumbers);
        },
        error: (error: any) => {
          reject(error);
        },  
      });
    });
  }

  const phoneNumbers = await getPhoneNumbers(fileContent);

  // initiate delay to overcome (too many requests error in Twilio API)
  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const results = [];
  for (const number of phoneNumbers) {
    try {
      const response = await client.lookups.v2
        .phoneNumbers(number)
        .fetch({ fields: "line_type_intelligence" });
          console.log("SW response Object", response.lineTypeIntelligence);
          results.push({ number, ...response.lineTypeIntelligence });
          // const isMobile: boolean = response.lineTypeIntelligence.type === "mobile"
          // if (isMobile) {
          //   results.push({ 
          //     number, lineTypeIntelligence: 
          //     ...response.lineTypeIntelligence, 
          //   });
          // }
        } catch (error) {
          console.log("Error : ", error);
          // results.push({ number, error: (error as Error).message });
    }
    await delay(10);
  }
  const csv = Papa.unparse(results);
  return json({ 
    results, 
    csv,
  });
}

export default function Index() {
  const actionData: any = useActionData<typeof action>();
  const [results, setResults] = useState([]);
  const [csvData, setCsvData] = useState<string>('');
  const [isDetailsFetched, setIsDetailsFetched] = useState<boolean>(false);

  useEffect(() => {
    if (actionData?.results || actionData?.csv) {
      setResults(actionData.results);
      setCsvData(actionData.csv);
      setIsDetailsFetched(true);
    }
  }, [actionData]);

  console.log("SW Result", results);
  console.log("SW csvData", csvData);
  
  return (  
    <div className="h-screen flex justify-center items-center">
      <CsvUpload csvData={csvData} totalNumbers={results.length} isDetailsFetched={isDetailsFetched} />
    </div>
  );
}
