"use client";

import { useMemo, useState, type FormEvent } from "react";

type FormState = {
  companyName: string;
  companyAddress: string;
  representativeFirstName: string;
  representativeLastName: string;
  representativeRole: string;
  trainingName: string;
  duration: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  instructor: string;
  participants: string;
  amountHt: string;
  conventionDate: string;
};

const today = new Date().toISOString().slice(0, 10);

export default function Home() {
  const [form, setForm] = useState<FormState>({
    companyName: "",
    companyAddress: "",
    representativeFirstName: "",
    representativeLastName: "",
    representativeRole: "",
    trainingName: "",
    duration: "",
    dateStart: today,
    dateEnd: today,
    location: "Montpellier",
    instructor: "Laurent Serre",
    participants: "",
    amountHt: "",
    conventionDate: today,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const amountHtNumber = Number(
    form.amountHt.replace(",", ".").replace(/\s+/g, "")
  );
  const amountTva = useMemo(() => {
    if (Number.isNaN(amountHtNumber)) {
      return 0;
    }
    return Number((amountHtNumber * 0.2).toFixed(2));
  }, [amountHtNumber]);
  const amountTtc = useMemo(() => {
    if (Number.isNaN(amountHtNumber)) {
      return 0;
    }
    return Number((amountHtNumber + amountTva).toFixed(2));
  }, [amountHtNumber, amountTva]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amountHt: Number(
            form.amountHt.replace(",", ".").replace(/\s+/g, "")
          ),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Erreur lors de la generation.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `convention-${form.companyName
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur inattendue."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Convention de formation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Generateur SLS
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Saisissez les informations clients et formation pour generer la
            convention PDF. Les participants sont enregistres pour completion
            ultérieure (email et telephone).
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold">Entreprise cliente</h2>
            </div>
            <label className="grid gap-2 text-sm">
              Nom de l&apos;entreprise
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.companyName}
                onChange={(event) =>
                  updateField("companyName", event.target.value)
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Adresse de l&apos;entreprise
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.companyAddress}
                onChange={(event) =>
                  updateField("companyAddress", event.target.value)
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Prenom du representant
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.representativeFirstName}
                onChange={(event) =>
                  updateField("representativeFirstName", event.target.value)
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Nom du representant
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.representativeLastName}
                onChange={(event) =>
                  updateField("representativeLastName", event.target.value)
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              Qualite du representant
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.representativeRole}
                onChange={(event) =>
                  updateField("representativeRole", event.target.value)
                }
                required
              />
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold">Formation</h2>
            </div>
            <label className="grid gap-2 text-sm md:col-span-2">
              Nom de la formation
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.trainingName}
                onChange={(event) =>
                  updateField("trainingName", event.target.value)
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              Duree de la formation
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.duration}
                onChange={(event) => updateField("duration", event.target.value)}
                placeholder="Ex : 40 heures de formation par personne soit 200 heures au total"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Date de debut
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.dateStart}
                onChange={(event) => updateField("dateStart", event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Date de fin
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.dateEnd}
                onChange={(event) => updateField("dateEnd", event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Lieu de formation
              <select
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
              >
                <option value="Montpellier">Montpellier</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Intervenant
              <select
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.instructor}
                onChange={(event) =>
                  updateField("instructor", event.target.value)
                }
              >
                <option value="Laurent Serre">Laurent Serre</option>
              </select>
            </label>
          </section>

          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">Participants</h2>
            <label className="grid gap-2 text-sm">
              Liste des participants (prenom nom, prenom nom, ...)
              <textarea
                className="min-h-[100px] rounded-lg border border-slate-200 px-3 py-2"
                value={form.participants}
                onChange={(event) =>
                  updateField("participants", event.target.value)
                }
                placeholder="Aurélia Spinosi, Sandra Cuny, Eva Thierry"
                required
              />
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <h2 className="text-lg font-semibold">Conditions financieres</h2>
            </div>
            <label className="grid gap-2 text-sm">
              Montant HT
              <input
                type="text"
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.amountHt}
                onChange={(event) => updateField("amountHt", event.target.value)}
                placeholder="6950"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              TVA (20%)
              <input
                type="text"
                className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50"
                value={amountTva.toFixed(2)}
                readOnly
              />
            </label>
            <label className="grid gap-2 text-sm">
              Montant TTC
              <input
                type="text"
                className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50"
                value={amountTtc.toFixed(2)}
                readOnly
              />
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold">Convention</h2>
            </div>
            <label className="grid gap-2 text-sm">
              Date de la convention
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.conventionDate}
                onChange={(event) =>
                  updateField("conventionDate", event.target.value)
                }
                required
              />
            </label>
          </section>

          {status === "error" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          {status === "done" ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Convention generee et telechargee.
            </div>
          ) : null}

          <button
            type="submit"
            className="flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Generation..." : "Generer la convention"}
          </button>
        </form>
      </main>
    </div>
  );
}
