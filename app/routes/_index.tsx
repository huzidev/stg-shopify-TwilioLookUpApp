import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import Papa from "papaparse";
import twilio from "twilio";
import CsvUpload from "~/components/CsvUpload";

export const maxDuration = 20;
export const dynamic = 'force-dynamic';

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
  const type = formData.get("type") as string;

  if (type === "parse-fields") {
    function getCsvFields(content: string): Promise<string[]> {
      return new Promise((resolve, reject) => {
        Papa.parse(content, {
          header: true,
          complete: (results: any) => {
            const fields = Object.keys(results.data[0]);
            resolve(fields);
          },
          error: (error: any) => {
            reject(error);
          },
        });
      });
    }
    const parsedCsvFields = await getCsvFields(fileContent);
    return json({ parsedCsvFields });
  } else {
    const selectedField = formData.get("selectedField") as string;

    const phoneNumbers: string[] = [];
    Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        results.data.forEach((row: { [key: string]: any }) => {
          const number = row[selectedField];
          if (number) {
            phoneNumbers.push(number);
          }
        });
      },
    });

    async function processPhoneNumbers(numbers: string[]) {
      const results = [];
      for (const number of numbers) {
        try {
          const response = await client.lookups.v2.phoneNumbers(number).fetch({ fields: "line_type_intelligence" });
          results.push({ number, ...response.lineTypeIntelligence });
        } catch (error) {
          console.log("Error: ", error);
        }
        await delay(100); // Ensure this is outside the try-catch to avoid blocking on errors
      }
      return results;
    }

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const chunkSize = 50;
    let results = [];

    for (let i = 0; i < phoneNumbers.length; i += chunkSize) {
      const chunk = phoneNumbers.slice(i, i + chunkSize);
      const chunkResults = await processPhoneNumbers(chunk);
      results = results.concat(chunkResults);

      // Check if the total execution time is approaching the limit
      if (Date.now() - startTime > (maxDuration - 1) * 1000) {
        break;
      }
    }

    const csv = Papa.unparse(results);
    return json({ results, csv });
  }
}

export default function Index() {
  return (
    <div className="h-screen flex justify-center items-center">
      <CsvUpload />
    </div>
  );
}
