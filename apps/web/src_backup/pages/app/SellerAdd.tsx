import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { ApiError, createSellerListing, getMe, SellerListingPayload, uploadSellerImages } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useQuery } from "@tanstack/react-query";

type ListingFormState = Omit<SellerListingPayload, "price" | "hours" | "year" | "images"> & {
  price: string;
  hours: string;
  year: string;
};

const INITIAL_FORM: ListingFormState = {
  title: "",
  description: "",
  location: "",
  condition: "",
  price: "",
  hours: "",
  year: "",
  make: "",
  model: "",
  category: "",
};

const MAX_IMAGES = 5;

export const SellerAdd = () => {
  const { token, user } = useAuth();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: () => getMe(), enabled: Boolean(token && user) });

  const [form, setForm] = useState<ListingFormState>(INITIAL_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const plan = meQuery.data?.billing?.plan ?? "free";
  const listingLimitLabel = typeof meQuery.data?.billing?.entitlements?.maxActiveListings === "number"
    ? String(meQuery.data.billing.entitlements.maxActiveListings)
    : plan === "enterprise" ? "Unlimited" : plan === "pro" ? "200" : "25";

  const planNotice = useMemo(() => {
    if (plan === "enterprise") return "Your Enterprise plan supports Unlimited active listings.";
    if (plan === "pro") return "Your Pro plan supports 200 active listings.";
    return "Your Free plan supports 25 active listings.";
  }, [plan]);

  const updateField = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) {
      return;
    }

    setFiles((prev) => {
      const merged = [...prev, ...selected];
      return merged.slice(0, MAX_IMAGES);
    });
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const filePreviews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => {
    return () => {
      for (const preview of filePreviews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [filePreviews]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      setError({ message: "Please complete all required fields.", details: [] });
      return;
    }

    if (files.length > MAX_IMAGES) {
      setError({ message: "You can upload up to 5 images.", details: [] });
      return;
    }

    setSubmitting(true);
    try {
      const parsedPrice = form.price ? Number(form.price.replace(/[$,]/g, "").trim()) : null;
      const parsedHours = form.hours ? Number(form.hours.replace(/[$,]/g, "").trim()) : null;
      const parsedYear = form.year ? Number(form.year.trim()) : undefined;

      if (parsedPrice !== null && !Number.isFinite(parsedPrice)) throw new Error("Price must be a valid number.");
      if (parsedHours !== null && !Number.isFinite(parsedHours)) throw new Error("Hours must be a valid number.");
      if (parsedYear !== undefined && !Number.isInteger(parsedYear)) throw new Error("Year must be a whole number.");

      const uploadedUrls = await uploadSellerImages(files.slice(0, MAX_IMAGES));

      const payload: SellerListingPayload = {
        title: form.title,
        description: form.description,
        location: form.location,
        condition: form.condition || undefined,
        price: parsedPrice,
        hours: parsedHours,
        year: parsedYear,
        make: form.make || undefined,
        model: form.model || undefined,
        category: form.category || undefined,
        images: uploadedUrls.length ? uploadedUrls : undefined,
      };

      const result = await createSellerListing(payload);
      setSuccessMessage(`Upload successful. Listing created (ID: ${result.id}).`);
      setForm(INITIAL_FORM);
      setFiles([]);
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        const details: string[] = [];
        if (Array.isArray(submitError.details)) {
          details.push(...(submitError.details as { path?: string; message?: string }[]).map((detail) => `${detail.path || "field"}: ${detail.message || "invalid"}`));
        }
        setError({ message: submitError.message, details });
      } else if (submitError instanceof Error) {
        setError({ message: submitError.message, details: [] });
      } else {
        setError({ message: "Failed to create listing.", details: [] });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold">Add listing</h2>
      <p className="mt-2 text-sm text-slate-400">Create a manual listing with up to {listingLimitLabel} active entries. {planNotice}</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Title *" value={form.title} onChange={(e) => updateField("title", e.target.value)} />
          <Input placeholder="Location *" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
          <Input placeholder="Condition" value={form.condition ?? ""} onChange={(e) => updateField("condition", e.target.value)} />
          <Input placeholder="Category" value={form.category ?? ""} onChange={(e) => updateField("category", e.target.value)} />
          <Input placeholder="Make" value={form.make ?? ""} onChange={(e) => updateField("make", e.target.value)} />
          <Input placeholder="Model" value={form.model ?? ""} onChange={(e) => updateField("model", e.target.value)} />
          <Input placeholder="Price" value={form.price} onChange={(e) => updateField("price", e.target.value)} />
          <Input placeholder="Hours" value={form.hours} onChange={(e) => updateField("hours", e.target.value)} />
          <Input placeholder="Year" value={form.year} onChange={(e) => updateField("year", e.target.value)} />
        </div>
        <textarea className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm" rows={5} placeholder="Description *" value={form.description} onChange={(e) => updateField("description", e.target.value)} />

        <div>
          <label className="mb-2 block text-sm text-slate-300">Images (up to {MAX_IMAGES})</label>
          <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="block w-full text-sm" />
          <p className="mt-2 text-xs text-slate-400">Selected {files.length}/{MAX_IMAGES} images.</p>
          {files.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {filePreviews.map(({ file, url }, index) => (
                <div key={`${file.name}-${index}`} className="rounded-lg border border-slate-700 bg-slate-900 p-2">
                  <img src={url} alt={file.name} className="h-24 w-full rounded object-cover" />
                  <p className="mt-2 truncate text-xs text-slate-300" title={file.name}>{file.name}</p>
                  <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => removeFile(index)}>Remove</Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">
            <p>{error.message}</p>
            {error.details.length > 0 ? <ul className="mt-2 list-disc pl-5">{error.details.map((d) => <li key={d}>{d}</li>)}</ul> : null}
          </div>
        ) : null}

        {successMessage ? <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{successMessage}</div> : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Create listing"}</Button>
          <Button type="button" variant="outline">
            <Link to="/app/seller/listings">Back to listings</Link>
          </Button>
        </div>
      </form>
    </Card>
  );
};
