import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../lib/auth";
import {
  getMe,
  importSellerListings,
  ApiError,
  validateSellerZipBundle,
  uploadSellerZipBundle,
} from "../../lib/api";
import { canUseSellerCsvUpload } from "../../lib/billing";

const REQUIRED_HEADERS = ["title", "description", "location", "condition", "contactName", "contactEmail"] as const;
const OPTIONAL_HEADERS = [
  "price",
  "hours",
  "year",
  "make",
  "model",
  "category",
  "imageUrl",
  "imageUrl2",
  "imageUrl3",
  "imageUrl4",
  "imageUrl5",
  "contactPhone",
  "state",
] as const;
const ALLOWED_HEADERS = new Set([...REQUIRED_HEADERS, ...OPTIONAL_HEADERS]);

const REQUIRED_HEADERS_DISPLAY = REQUIRED_HEADERS.join(",");

type UploadValidationResult = {
  rowsDetected: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
};

type UploadResult = {
  created: number;
  failed: number;
  errors: Array<{ row: number; field?: string; code: string; message: string }>;
};

const isValidUrlLike = (value: string) => /^https?:\/\//i.test(value);

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const parseCsv = (csvText: string) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { header: [] as string[], rows: [] as Record<string, string>[] };
  }

  const header = parseCsvLine(lines[0]);
  if (header.length > 0) {
    header[0] = header[0].replace(/^\uFEFF/, "");
  }
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return header.reduce<Record<string, string>>((row, key, index) => {
      row[key] = values[index] ?? "";
      return row;
    }, {});
  });

  return { header, rows };
};

const quoteCsvValue = (value: string) => `"${String(value).replace(/"/g, '""')}"`;

const ValidationPanel = ({ validation }: { validation: UploadValidationResult }) => {
  const validationErrors = validation.errors ?? [];
  return (
    <div className="mt-4 rounded-md border border-slate-700 p-4 text-sm text-slate-200">
      <p>rows detected: {validation.rowsDetected}</p>
      <p>valid rows: {validation.validRows}</p>
      <p>invalid rows: {validation.invalidRows}</p>
      <p>total validation errors: {validationErrors.length}</p>
      <div className="mt-2">
        <p className="font-medium">Top validation errors</p>
        {validationErrors.length === 0 ? (
          <p className="mt-1 text-emerald-300">No validation errors.</p>
        ) : (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-rose-300">
            {validationErrors.slice(0, 12).map((error, index) => (
              <li key={`${error}-${index}`}>{error}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const SellerUpload = () => {
  const { token, user, isUserLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [csvValidation, setCsvValidation] = useState<UploadValidationResult | null>(null);
  const [zipValidation, setZipValidation] = useState<UploadValidationResult | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [csvUploadResult, setCsvUploadResult] = useState<UploadResult | null>(null);
  const [zipUploadResult, setZipUploadResult] = useState<UploadResult | null>(null);
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);
  const [zipUploadError, setZipUploadError] = useState<string | null>(null);

  const rows = Array.isArray(parsedRows) ? parsedRows : [];
  const csvUploadErrors = csvUploadResult?.errors ?? [];
  const zipUploadErrors = zipUploadResult?.errors ?? [];

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    enabled: Boolean(token && user && user.role === "seller"),
  });

  if (!token) return null;

  if (isUserLoading || !user || meQuery.isLoading) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading…</p>
      </Card>
    );
  }

  const plan = meQuery.data?.billing?.plan ?? "free";
  const role = user?.role ?? null;
  const canUseCsvUpload = canUseSellerCsvUpload(role, plan, meQuery.data?.billing?.entitlements?.csvUpload);

  if (!canUseCsvUpload) {
    return <Navigate to="/app/upgrade" replace />;
  }

  const downloadTemplate = () => {
    const BOM = "\uFEFF";
    const header = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS].map(quoteCsvValue).join(",");

    const sample = [
      "2020 Caterpillar D6T",
      "Well-maintained dozer with service records",
      "Sacramento, CA",
      "used",
      "Alex Seller",
      "alex@example.com",
      "178000",
      "1800",
      "2020",
      "Caterpillar",
      "D6T",
      "Dozer",
      "https://example.com/img1.jpg",
      "",
      "",
      "",
      "",
      "555-555-0101",
      "CA",
    ]
      .map(quoteCsvValue)
      .join(",");

    const csv = BOM + header + "\r\n" + sample + "\r\n";
    const blob = new Blob([csv], { type: "text/csv; charset=utf-8" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "easyfinder_seller_template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const validateCsv = async () => {
    setCsvUploadResult(null);
    setCsvUploadError(null);

    if (!csvFile) {
      setParsedRows([]);
      setCsvValidation({ rowsDetected: 0, validRows: 0, invalidRows: 0, errors: ["Please choose a CSV file before validation."] });
      return;
    }

    if (!csvFile.name.toLowerCase().endsWith(".csv")) {
      setParsedRows([]);
      setCsvValidation({ rowsDetected: 0, validRows: 0, invalidRows: 0, errors: ["Only .csv files are allowed in CSV upload. Use ZIP bundle upload for .zip files."] });
      return;
    }

    const raw = await csvFile.text();
    const parsed = parseCsv(raw);
    const errors: string[] = [];

    const missingHeaders = REQUIRED_HEADERS.filter((header) => !parsed.header.includes(header));
    const unknownHeaders = parsed.header.filter((header) => !ALLOWED_HEADERS.has(header as (typeof REQUIRED_HEADERS)[number]));

    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
    }
    if (unknownHeaders.length > 0) {
      errors.push(`Unsupported columns found: ${unknownHeaders.join(", ")}`);
    }

    let validRows = 0;
    let invalidRows = 0;

    parsed.rows.forEach((row, rowIndex) => {
      const rowErrors: string[] = [];
      REQUIRED_HEADERS.forEach((field) => {
        if (!String(row[field] ?? "").trim()) {
          rowErrors.push(`Row ${rowIndex + 2} • ${field}: required.`);
        }
      });

      if (row.contactEmail && !/^\S+@\S+\.\S+$/.test(String(row.contactEmail).trim())) {
        rowErrors.push(`Row ${rowIndex + 2} • contactEmail: must be a valid email.`);
      }

      if (row.hours && Number.isNaN(Number(String(row.hours).replace(/[$,]/g, "").trim()))) {
        rowErrors.push(`Row ${rowIndex + 2} • hours: must be numeric when provided.`);
      }

      if (row.price && Number.isNaN(Number(String(row.price).replace(/[$,]/g, "").trim()))) {
        rowErrors.push(`Row ${rowIndex + 2} • price: must be numeric when provided.`);
      }

      if (row.year && !Number.isInteger(Number(row.year))) {
        rowErrors.push(`Row ${rowIndex + 2} • year: must be an integer when provided.`);
      }

      ["imageUrl", "imageUrl2", "imageUrl3", "imageUrl4", "imageUrl5"].forEach((imageField) => {
        const value = String(row[imageField] ?? "").trim();
        if (value && !isValidUrlLike(value)) {
          rowErrors.push(`Row ${rowIndex + 2} • ${imageField}: must start with http(s).`);
        }
      });

      if (rowErrors.length > 0 || missingHeaders.length > 0 || unknownHeaders.length > 0) {
        invalidRows += 1;
        errors.push(...rowErrors);
      } else {
        validRows += 1;
      }
    });

    setParsedRows(missingHeaders.length === 0 && unknownHeaders.length === 0 ? parsed.rows : []);
    setCsvValidation({ rowsDetected: parsed.rows.length, validRows, invalidRows, errors });
  };

  const validateZip = async () => {
    setZipUploadResult(null);
    setZipUploadError(null);

    if (!zipFile) {
      setZipValidation({ rowsDetected: 0, validRows: 0, invalidRows: 0, errors: ["Please choose a ZIP file before validation."] });
      return;
    }

    if (!zipFile.name.toLowerCase().endsWith(".zip")) {
      setZipValidation({ rowsDetected: 0, validRows: 0, invalidRows: 0, errors: ["Only .zip files are allowed in ZIP bundle upload."] });
      return;
    }

    try {
      const result = await validateSellerZipBundle(zipFile);
      setZipValidation({
        rowsDetected: result.rowsDetected,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        errors: result.topErrors,
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : String(error);
      setZipValidation({ rowsDetected: 0, validRows: 0, invalidRows: 0, errors: [message] });
    }
  };

  const canUploadCsv = Boolean(csvValidation && csvValidation.validRows > 0 && csvValidation.invalidRows === 0 && rows.length > 0);
  const canUploadZip = Boolean(zipValidation && zipValidation.validRows > 0 && zipValidation.invalidRows === 0 && zipFile);

  const onUploadCsv = async () => {
    if (!canUploadCsv) return;

    setUploadingCsv(true);
    setCsvUploadResult(null);
    setCsvUploadError(null);

    try {
      const result = await importSellerListings(rows);
      setCsvUploadResult(result);
      await queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      if (result.created > 0 && result.failed === 0) {
        navigate("/app/seller/listings");
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : error instanceof Error ? error.message : String(error);
      setCsvUploadError(message);
    } finally {
      setUploadingCsv(false);
    }
  };

  const onUploadZip = async () => {
    if (!canUploadZip || !zipFile) return;

    setUploadingZip(true);
    setZipUploadResult(null);
    setZipUploadError(null);

    try {
      const result = await uploadSellerZipBundle(zipFile);
      setZipUploadResult(result);
      await queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      if (result.created > 0 && result.failed === 0) {
        navigate("/app/seller/listings");
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : error instanceof Error ? error.message : String(error);
      setZipUploadError(message);
    } finally {
      setUploadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold">Upload inventory</h2>
        <p className="mt-2 text-sm text-slate-400">Bulk upload listings using a CSV template or a ZIP bundle (CSV + images).</p>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Instructions</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Download the template.</li>
          <li>Each row is one listing.</li>
          <li>Required columns: {REQUIRED_HEADERS_DISPLAY}</li>
          <li>Optional image columns: imageUrl..imageUrl5</li>
          <li>ZIP bundle must contain exactly one .csv and image files named 2A..2E, 3A..3E, etc.</li>
        </ul>
        <Button className="mt-4" onClick={downloadTemplate}>
          Download CSV template
        </Button>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">CSV upload</h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setCsvFile(nextFile);
              setCsvValidation(null);
              setParsedRows([]);
              setCsvUploadResult(null);
              setCsvUploadError(null);
            }}
          />
          <Button onClick={validateCsv}>Validate CSV</Button>
        </div>

        {csvValidation ? <ValidationPanel validation={csvValidation} /> : null}

        {csvValidation ? (
          <Button className="mt-4" onClick={onUploadCsv} disabled={!canUploadCsv || uploadingCsv}>
            {uploadingCsv ? "Uploading..." : "Upload CSV"}
          </Button>
        ) : null}

        {csvUploadResult ? (
          <div className="mt-4 rounded-md border border-emerald-700/40 bg-emerald-950/30 p-4 text-sm text-emerald-200">
            <p>created: {csvUploadResult.created}</p>
            <p>failed: {csvUploadResult.failed}</p>
            <p>error rows returned: {csvUploadErrors.length}</p>
            {csvUploadErrors.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-rose-300">
                {csvUploadErrors.slice(0, 12).map((error, index) => (
                  <li key={`${error.row}-${error.field ?? "none"}-${index}`}>
                    Row {error.row}{error.field ? ` • ${error.field}` : ""}: {error.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {csvUploadError ? (
          <div className="mt-4 rounded-md border border-rose-700/50 bg-rose-950/30 p-4 text-sm text-rose-200">{csvUploadError}</div>
        ) : null}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">ZIP bundle upload</h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setZipFile(nextFile);
              setZipValidation(null);
              setZipUploadResult(null);
              setZipUploadError(null);
            }}
          />
          <Button onClick={validateZip}>Validate ZIP</Button>
        </div>

        {zipValidation ? <ValidationPanel validation={zipValidation} /> : null}

        {zipValidation ? (
          <Button className="mt-4" onClick={onUploadZip} disabled={!canUploadZip || uploadingZip}>
            {uploadingZip ? "Uploading..." : "Upload ZIP"}
          </Button>
        ) : null}

        {zipUploadResult ? (
          <div className="mt-4 rounded-md border border-emerald-700/40 bg-emerald-950/30 p-4 text-sm text-emerald-200">
            <p>created: {zipUploadResult.created}</p>
            <p>failed: {zipUploadResult.failed}</p>
            <p>error rows returned: {zipUploadErrors.length}</p>
            {zipUploadErrors.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-rose-300">
                {zipUploadErrors.slice(0, 12).map((error, index) => (
                  <li key={`${error.row}-${error.field ?? "none"}-${index}`}>
                    Row {error.row}{error.field ? ` • ${error.field}` : ""}: {error.message}
                  </li>
                ))}
              </ul>
            ) : null}
            {zipUploadResult.created > 0 ? (
              <Button className="mt-3" onClick={() => navigate("/app/seller/listings")}>
                View listings
              </Button>
            ) : null}
          </div>
        ) : null}

        {zipUploadError ? (
          <div className="mt-4 rounded-md border border-rose-700/50 bg-rose-950/30 p-4 text-sm text-rose-200">{zipUploadError}</div>
        ) : null}
      </Card>
    </div>
  );
};
