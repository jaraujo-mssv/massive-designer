import { Upload } from "lucide-react";
import Papa from "papaparse";
import { Category, Company } from "../App";
import { toast } from "sonner";

interface CSVUploadPanelProps {
  onUpload: (categories: Category[]) => void;
}

export function CSVUploadPanel({ onUpload }: CSVUploadPanelProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("CSV file selected in panel:", file.name);

    Papa.parse<{ category: string; company: string; logo: string; url?: string }>(
      file,
      {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log("CSV parsed in panel:", results);

          if (results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            toast.error("Error parsing CSV file");
            return;
          }

          if (results.data.length === 0) {
            toast.error("CSV file is empty");
            return;
          }

          // Group companies by category
          const categoryMap = new Map<string, Company[]>();

          results.data.forEach((row, index) => {
            console.log(`Row ${index}:`, row);
            if (!row.category || !row.company || !row.logo) {
              console.warn(`Skipping row ${index} - missing required fields:`, row);
              return;
            }

            const company: Company = {
              id: `company-${Date.now()}-${Math.random()}`,
              name: row.company,
              logoUrl: row.logo,
              url: row.url,
            };

            if (!categoryMap.has(row.category)) {
              categoryMap.set(row.category, []);
            }
            categoryMap.get(row.category)!.push(company);
          });

          if (categoryMap.size === 0) {
            toast.error("No valid data found in CSV. Make sure columns are: category, company, logo");
            return;
          }

          // Create categories
          const categories: Category[] = Array.from(categoryMap.entries()).map(
            ([name, companies]) => ({
              id: `cat-${Date.now()}-${Math.random()}`,
              name,
              companies,
            })
          );

          console.log("Created categories in panel:", categories);
          onUpload(categories);
          toast.success(`Loaded ${categories.length} categories with ${results.data.length} companies`);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          toast.error(`Failed to parse CSV: ${error.message}`);
        },
      }
    );

    // Reset input
    event.target.value = "";
  };

  return (
    <label className="flex flex-col items-center justify-center min-h-[200px] bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
      <Upload className="w-8 h-8 text-gray-400 mb-2" />
      <p className="text-sm font-medium text-gray-700 mb-1">Upload CSV</p>
      <p className="text-xs text-gray-500 mb-4 px-4 text-center">
        Columns: category, company, logo, url (optional)
      </p>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
    </label>
  );
}