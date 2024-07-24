import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import Papa from "papaparse";
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
  const type = formData.get("type") as string;

  if (type === "parse-fields") {
    function getCsvFields(content: string): Promise<string[]> {
      return new Promise((resolve, reject) => {
        const csvFields: any[] = [];
        Papa.parse(content, {
          header: true,
          dynamicTyping: true,
          complete: (results: any) => {
            const fields = Object.keys(results.data[0]);
            csvFields.push(...fields);
            resolve(csvFields);
          },
          error: (error: any) => {
            reject(error);
          },
        });
      });
    }
    const parsedCsvFields = await getCsvFields(fileContent);
    return json({
      parsedCsvFields,
    });
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

    function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const results = [];
    for (let i = 0; i < phoneNumbers.length; i += 99) {
      const chunk = phoneNumbers.slice(i, i + 99);
      const chunkResults = await Promise.all(
        chunk.map(async (number) => {
          try {
            const response = await client.lookups.v2
              .phoneNumbers(number)
              .fetch({ fields: "line_type_intelligence" });
            return { number, ...response.lineTypeIntelligence };
          } catch (error) {
            console.log("Error : ", error);
          }
        })
      );
      results.push(...chunkResults);
      await delay(100);
    }

    const csv = Papa.unparse(results);
    return json({
      results,
      csv,
    });
  }
}

export default function Index() {
  return (
    <div className="h-screen flex justify-center items-center">
      <CsvUpload />
    </div>
  );
}
