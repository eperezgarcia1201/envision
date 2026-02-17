"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { enumLabel } from "@/lib/crm";
import { formatCurrencyFromCents } from "@/lib/format";

type SeriesItem = {
  label: string;
  amountCents: number;
};

type StatusBreakdownItem = {
  status: string;
  count: number;
};

type DashboardChartsProps = {
  revenueSeries: SeriesItem[];
  leadPipeline: StatusBreakdownItem[];
  workOrderStatusBreakdown: StatusBreakdownItem[];
  invoiceStatusBreakdown: StatusBreakdownItem[];
};

const chartPalette = ["#133775", "#1f4ea3", "#2a63c6", "#628ad7", "#96b2e6", "#c2d3f2"];

function tooltipCurrency(value: number | string | undefined) {
  if (value === undefined) {
    return "";
  }

  if (typeof value !== "number") {
    return value;
  }

  return formatCurrencyFromCents(Math.round(value * 100));
}

function tooltipValue(value: number | string | undefined) {
  if (value === undefined) {
    return "";
  }

  if (typeof value !== "number") {
    return value;
  }

  return value.toLocaleString();
}

export function DashboardCharts({
  revenueSeries,
  leadPipeline,
  workOrderStatusBreakdown,
  invoiceStatusBreakdown,
}: DashboardChartsProps) {
  const revenueData = revenueSeries.map((point) => ({
    label: point.label,
    value: point.amountCents / 100,
  }));

  const leadData = leadPipeline.map((entry) => ({
    label: enumLabel(entry.status),
    count: entry.count,
  }));

  const workOrderData = workOrderStatusBreakdown
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: enumLabel(item.status),
      value: item.count,
    }));

  const invoiceData = invoiceStatusBreakdown.map((entry) => ({
    label: enumLabel(entry.status),
    count: entry.count,
  }));

  return (
    <section className="crm-main-columns crm-main-columns-charts">
      <article className="crm-panel crm-chart-panel">
        <div className="crm-section-head compact">
          <h2>Revenue Trend</h2>
          <p>Paid invoices over the last 6 months.</p>
        </div>
        <div className="crm-chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2257b1" stopOpacity={0.38} />
                  <stop offset="100%" stopColor="#2257b1" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e4ebf8" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: "#435c87", fontSize: 12 }} />
              <YAxis tick={{ fill: "#435c87", fontSize: 12 }} tickFormatter={(value) => `$${value}k`} />
              <Tooltip formatter={tooltipCurrency} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#123b7f"
                strokeWidth={2.5}
                fill="url(#revenue-fill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="crm-panel crm-chart-panel">
        <div className="crm-section-head compact">
          <h2>Lead Funnel</h2>
          <p>Pipeline health by stage.</p>
        </div>
        <div className="crm-chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#e4ebf8" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: "#435c87", fontSize: 11 }} interval={0} angle={-10} dy={6} />
              <YAxis tick={{ fill: "#435c87", fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={tooltipValue} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {leadData.map((_, index) => (
                  <Cell key={index} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="crm-panel crm-chart-panel">
        <div className="crm-section-head compact">
          <h2>Work Order Mix</h2>
          <p>Distribution by execution status.</p>
        </div>
        <div className="crm-chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={workOrderData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
              >
                {workOrderData.map((_, index) => (
                  <Cell key={index} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipValue} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="crm-panel crm-chart-panel">
        <div className="crm-section-head compact">
          <h2>Invoice Aging</h2>
          <p>Status distribution for billing follow-up.</p>
        </div>
        <div className="crm-chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={invoiceData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid stroke="#e4ebf8" strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fill: "#435c87", fontSize: 12 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: "#435c87", fontSize: 11 }}
                width={90}
              />
              <Tooltip formatter={tooltipValue} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#1f4ea3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
