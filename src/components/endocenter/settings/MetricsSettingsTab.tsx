import { BarChart3, Plus, Trash2 } from "lucide-react";
import { useEndocenter, type MetricPeriod } from "@/store/endocenterStore";

const periods: MetricPeriod[] = ["Diária", "Semanal", "Mensal", "Anual"];

export default function MetricsSettingsTab() {
  const { metricEntries, addMetric, updateMetric, removeMetric } = useEndocenter();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Registro de métricas</h3>
        </div>

        <button
          onClick={addMetric}
          className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova métrica
        </button>
      </div>

      <div className="space-y-2">
        {metricEntries.map((metric) => (
          <div key={metric.id} className="ios-card p-3 space-y-2">
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                className="ios-input px-3 py-2 text-sm"
                value={metric.name}
                onChange={(event) => updateMetric(metric.id, { name: event.target.value })}
                placeholder="Nome da métrica"
              />

              <select
                className="ios-input px-3 py-2 text-sm"
                value={metric.period}
                onChange={(event) => updateMetric(metric.id, { period: event.target.value as MetricPeriod })}
              >
                {periods.map((period) => (
                  <option key={period}>{period}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="ios-input px-3 py-2 text-sm"
                value={metric.value}
                onChange={(event) => updateMetric(metric.id, { value: Number(event.target.value) })}
                placeholder="Valor atual"
              />

              <input
                type="number"
                className="ios-input px-3 py-2 text-sm"
                value={metric.target}
                onChange={(event) => updateMetric(metric.id, { target: Number(event.target.value) })}
                placeholder="Meta"
              />
            </div>

            <textarea
              className="ios-input w-full px-3 py-2 text-sm min-h-16"
              value={metric.notes}
              onChange={(event) => updateMetric(metric.id, { notes: event.target.value })}
              placeholder="Observações"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Atualizada em {new Date(metric.updatedAt).toLocaleDateString("pt-BR")}
              </span>
              <button
                onClick={() => removeMetric(metric.id)}
                className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                title="Remover métrica"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
