import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { ApiError, getSellerListing, SellerListingPayload, updateSellerListing, uploadSellerImages } from "../../lib/api";

type FormState = {
  title: string;
  description: string;
  location: string;
  price: string;
  hours: string;
  year: string;
  make: string;
  model: string;
  category: string;
  condition: string;
};

const MAX_IMAGES = 5;

export default function SellerEdit() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>({ title: "", description: "", location: "", price: "", hours: "", year: "", make: "", model: "", category: "", condition: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const listing = await getSellerListing(id);
        setForm({
          title: String(listing.title ?? ""),
          description: String(listing.description ?? ""),
          location: String((listing.location ?? listing.state ?? "")),
          price: listing.price != null ? String(listing.price) : "",
          hours: listing.hours != null ? String(listing.hours) : "",
          year: listing.year != null ? String(listing.year) : "",
          make: String(listing.make ?? ""),
          model: String(listing.model ?? ""),
          category: String(listing.category ?? ""),
          condition: "",
        });
        setExistingImages(Array.isArray(listing.images) ? (listing.images as string[]).filter(Boolean).slice(0, MAX_IMAGES) : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load listing.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) {
      return;
    }

    setFiles((prev) => {
      const availableSlots = Math.max(MAX_IMAGES - existingImages.length, 0);
      const merged = [...prev, ...selected];
      return merged.slice(0, availableSlots);
    });
    event.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setDetails([]);
    setSuccessMessage(null);
    try {
      const availableSlots = Math.max(MAX_IMAGES - existingImages.length, 0);
      const uploadedUrls = await uploadSellerImages(files.slice(0, availableSlots));
      const mergedImages = [...existingImages, ...uploadedUrls].slice(0, MAX_IMAGES);

      const payload: Partial<SellerListingPayload> = {
        title: form.title,
        description: form.description,
        location: form.location,
        price: form.price ? Number(form.price) : null,
        hours: form.hours ? Number(form.hours) : null,
        year: form.year ? Number(form.year) : undefined,
        make: form.make || undefined,
        model: form.model || undefined,
        category: form.category || undefined,
        condition: form.condition || undefined,
        images: mergedImages,
      };

      await updateSellerListing(id, payload);
      setSuccessMessage("Upload successful. Listing updated.");
      navigate("/app/seller/listings");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (Array.isArray(e.details)) {
          setDetails((e.details as { path?: string; message?: string }[]).map((item) => `${item.path || "field"}: ${item.message || "invalid"}`));
        }
      } else {
        setError(e instanceof Error ? e.message : "Failed to save listing.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card>Loading listing…</Card>;

  return (
    <Card>
      <h2 className="text-xl font-semibold">Edit listing</h2>
      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" />
          <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location" />
          <Input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="Price" />
          <Input value={form.hours} onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))} placeholder="Hours" />
          <Input value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} placeholder="Year" />
          <Input value={form.make} onChange={(e) => setForm((p) => ({ ...p, make: e.target.value }))} placeholder="Make" />
          <Input value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} placeholder="Model" />
          <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" />
        </div>
        <textarea className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm" rows={5} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />

        <div>
          <label className="text-sm text-slate-300">Images (up to {MAX_IMAGES})</label>
          <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="mt-2 block w-full text-sm" />
          <p className="mt-2 text-xs text-slate-400">Selected {existingImages.length + files.length}/{MAX_IMAGES} images.</p>

          {existingImages.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-xs text-slate-400">Existing images</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {existingImages.map((url, index) => (
                  <div key={`${url}-${index}`} className="rounded-lg border border-slate-700 bg-slate-900 p-2">
                    <img src={url} alt={`Existing image ${index + 1}`} className="h-24 w-full rounded object-cover" />
                    <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => removeExistingImage(index)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {files.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-xs text-slate-400">New images</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {filePreviews.map(({ file, url }, index) => (
                  <div key={`${file.name}-${index}`} className="rounded-lg border border-slate-700 bg-slate-900 p-2">
                    <img src={url} alt={file.name} className="h-24 w-full rounded object-cover" />
                    <p className="mt-2 truncate text-xs text-slate-300" title={file.name}>{file.name}</p>
                    <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => removeNewFile(index)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {error ? <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">{error}{details.length ? <ul className="mt-2 list-disc pl-5">{details.map((d) => <li key={d}>{d}</li>)}</ul> : null}</div> : null}
        {successMessage ? <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{successMessage}</div> : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          <Button type="button" variant="outline"><Link to="/app/seller/listings">Cancel</Link></Button>
        </div>
      </form>
    </Card>
  );
}
