import React from "react";

export default function Upgrade() {
  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to start checkout.");
      }
    } catch (err) {
      console.error(err);
      alert("Checkout error");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Upgrade to EasyFinder Pro
      </h1>

      <p className="mb-6 text-gray-600">
        Unlock deal scoring, watchlists, AI broker insights, and premium listings.
      </p>

      <button
        onClick={handleUpgrade}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Upgrade Now
      </button>
    </div>
  );
}
