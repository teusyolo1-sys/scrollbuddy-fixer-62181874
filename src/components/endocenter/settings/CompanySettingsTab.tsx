import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useEndocenter } from "@/store/endocenterStore";

export default function CompanySettingsTab() {
  const { company, setCompany } = useEndocenter();
  const [form, setForm] = useState(company);

  useEffect(() => {
    setForm(company);
  }, [company]);

  useEffect(() => {
    setCompany(form);
  }, [form, setCompany]);

  return (
    <div className="space-y-4">
      <div className="ios-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Cadastro da empresa</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome da empresa</label>
            <input
              className="ios-input w-full px-3 py-2 mt-1 text-sm"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Subtítulo</label>
            <input
              className="ios-input w-full px-3 py-2 mt-1 text-sm"
              value={form.subtitle}
              onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Mês / período</label>
            <input
              className="ios-input w-full px-3 py-2 mt-1 text-sm"
              value={form.month}
              onChange={(event) => setForm((prev) => ({ ...prev, month: event.target.value }))}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground px-1">
        O cabeçalho, o rodapé e todas as abas usam esses dados automaticamente.
      </p>
    </div>
  );
}
