"use client";

import { FormEvent, useMemo, useState } from "react";
import { enumLabel } from "@/lib/crm";
import { formatCurrencyFromCents, formatDate, formatDateTime } from "@/lib/format";

export type ResourceOption = {
  label: string;
  value: string;
};

export type ResourceFieldType =
  | "text"
  | "password"
  | "email"
  | "tel"
  | "number"
  | "textarea"
  | "select"
  | "date"
  | "datetime-local";

export type ResourceField = {
  name: string;
  label: string;
  type: ResourceFieldType;
  placeholder?: string;
  required?: boolean;
  requiredOnCreate?: boolean;
  step?: string;
  valueType?: "string" | "number" | "boolean";
  options?: ResourceOption[];
};

export type ResourceColumn = {
  key: string;
  label: string;
  format?: "text" | "date" | "datetime" | "currency" | "pill" | "boolean";
  empty?: string;
};

export type ResourceFilter = {
  name: string;
  label: string;
  options: ResourceOption[];
};

export type ResourceAction = {
  label: string;
  href: (item: Record<string, unknown>) => string;
  openInNewTab?: boolean;
};

type ResourceCrudProps = {
  title: string;
  description: string;
  endpoint: string;
  singularName: string;
  initialItems: Array<Record<string, unknown>>;
  columns: ResourceColumn[];
  fields: ResourceField[];
  searchKeys: string[];
  filters?: ResourceFilter[];
  defaultValues?: Record<string, string>;
  allowDelete?: boolean;
  extraActions?: ResourceAction[];
};

function resolvePath(data: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = data;

  for (const segment of segments) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function toInputDate(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toInputDateTime(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function coerceString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function createFormState(fields: ResourceField[], defaults?: Record<string, string>) {
  const state: Record<string, string> = {};

  for (const field of fields) {
    state[field.name] = defaults?.[field.name] ?? "";
  }

  return state;
}

function parseFieldValue(field: ResourceField, rawValue: string) {
  const trimmed = rawValue.trim();

  if (rawValue === "") {
    return null;
  }

  if (field.type === "number" || field.valueType === "number") {
    return Number(rawValue);
  }

  if (field.valueType === "boolean") {
    return rawValue === "true";
  }

  if (field.type === "datetime-local") {
    return new Date(rawValue).toISOString();
  }

  if (field.type === "date") {
    return new Date(`${rawValue}T00:00:00`).toISOString();
  }

  return trimmed;
}

function formatColumnValue(item: Record<string, unknown>, column: ResourceColumn) {
  const value = resolvePath(item, column.key);

  if (value === null || value === undefined || value === "") {
    return column.empty ?? "-";
  }

  if (column.format === "date") {
    return formatDate(String(value));
  }

  if (column.format === "datetime") {
    return formatDateTime(String(value));
  }

  if (column.format === "currency") {
    return typeof value === "number" ? formatCurrencyFromCents(value) : String(value);
  }

  if (column.format === "boolean") {
    return String(value) === "true" ? "Yes" : "No";
  }

  return String(value);
}

export function ResourceCrud({
  title,
  description,
  endpoint,
  singularName,
  initialItems,
  columns,
  fields,
  searchKeys,
  filters = [],
  defaultValues,
  allowDelete = true,
  extraActions = [],
}: ResourceCrudProps) {
  const [items, setItems] = useState(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    Object.fromEntries(filters.map((filter) => [filter.name, "ALL"])),
  );
  const [formValues, setFormValues] = useState<Record<string, string>>(
    createFormState(fields, defaultValues),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "idle" | "error" | "success"; message: string }>({
    type: "idle",
    message: "",
  });

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      for (const filter of filters) {
        const activeValue = filterValues[filter.name];

        if (!activeValue || activeValue === "ALL") {
          continue;
        }

        const recordValue = resolvePath(item, filter.name);

        if (String(recordValue ?? "") !== activeValue) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      return searchKeys.some((key) => {
        const value = resolvePath(item, key);
        return String(value ?? "")?.toLowerCase().includes(normalizedSearch);
      });
    });
  }, [filters, filterValues, items, searchKeys, searchTerm]);

  async function refreshData() {
    setIsRefreshing(true);
    setFeedback({ type: "idle", message: "" });

    try {
      const response = await fetch(`${endpoint}?take=100`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? `Unable to load ${title.toLowerCase()}.`);
      }

      setItems(Array.isArray(payload.data) ? payload.data : []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : `Unable to load ${title.toLowerCase()}.`,
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setFormValues(createFormState(fields, defaultValues));
  }

  function startEdit(item: Record<string, unknown>) {
    const editValues: Record<string, string> = {};

    for (const field of fields) {
      const value = resolvePath(item, field.name);

      if (field.type === "datetime-local") {
        editValues[field.name] = toInputDateTime(value);
      } else if (field.type === "date") {
        editValues[field.name] = toInputDate(value);
      } else {
        editValues[field.name] = coerceString(value);
      }
    }

    setFeedback({ type: "idle", message: "" });
    setMode("edit");
    setEditingId(String(item.id));
    setFormValues(editValues);
  }

  async function handleDelete(id: string) {
    if (!allowDelete) {
      return;
    }

    const confirmed = window.confirm(`Delete this ${singularName.toLowerCase()}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setFeedback({ type: "idle", message: "" });

    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? `Unable to delete ${singularName.toLowerCase()}.`);
      }

      await refreshData();
      setFeedback({ type: "success", message: `${singularName} deleted successfully.` });

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : `Unable to delete ${singularName.toLowerCase()}.`,
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: "idle", message: "" });

    const missingRequired = fields.find((field) => {
      const isRequired = field.required || (mode === "create" && field.requiredOnCreate);

      if (!isRequired) {
        return false;
      }

      return !formValues[field.name] || formValues[field.name].trim() === "";
    });

    if (missingRequired) {
      setIsSubmitting(false);
      setFeedback({ type: "error", message: `${missingRequired.label} is required.` });
      return;
    }

    const payload: Record<string, unknown> = {};

    for (const field of fields) {
      if (
        mode === "edit" &&
        field.requiredOnCreate &&
        (!formValues[field.name] || formValues[field.name].trim() === "")
      ) {
        continue;
      }

      payload[field.name] = parseFieldValue(field, formValues[field.name] ?? "");
    }

    try {
      const url = mode === "edit" && editingId ? `${endpoint}/${editingId}` : endpoint;
      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error ?? `Unable to save ${singularName.toLowerCase()}.`);
      }

      await refreshData();
      setFeedback({
        type: "success",
        message: mode === "edit" ? `${singularName} updated successfully.` : `${singularName} created successfully.`,
      });
      resetForm();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : `Unable to save ${singularName.toLowerCase()}.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="crm-module-toolbar">
          <label className="crm-search-wrap" htmlFor={`${endpoint}-search`}>
            <span className="crm-search-icon">⌕</span>
            <input
              id={`${endpoint}-search`}
              type="search"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          {filters.map((filter) => (
            <label key={filter.name} className="crm-inline-field">
              <span>{filter.label}</span>
              <select
                value={filterValues[filter.name] ?? "ALL"}
                onChange={(event) =>
                  setFilterValues((current) => ({
                    ...current,
                    [filter.name]: event.target.value,
                  }))
                }
              >
                <option value="ALL">All</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <button
            type="button"
            className="btn btn-outline crm-refresh-btn"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {feedback.type === "error" ? <p className="status-message error">{feedback.message}</p> : null}
        {feedback.type === "success" ? <p className="status-message success">{feedback.message}</p> : null}
      </section>

      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h2>{mode === "edit" ? `Edit ${singularName}` : `Create ${singularName}`}</h2>
          <p>
            {mode === "edit"
              ? "Update fields and save changes."
              : `Add a new ${singularName.toLowerCase()} record to the CRM.`}
          </p>
        </div>

        <form className="crm-form-grid" onSubmit={handleSubmit}>
          {fields.map((field) => {
            const isRequired = field.required || (mode === "create" && field.requiredOnCreate);
            const currentValue = formValues[field.name] ?? "";

            return (
              <label key={field.name} className="crm-form-field">
                <span>
                  {field.label}
                  {isRequired ? " *" : ""}
                </span>

                {field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={currentValue}
                    required={isRequired}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                  />
                ) : field.type === "select" ? (
                  <select
                    value={currentValue}
                    required={isRequired}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select...</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={currentValue}
                    required={isRequired}
                    step={field.step}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                  />
                )}
              </label>
            );
          })}

          <div className="crm-form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "edit" ? `Update ${singularName}` : `Create ${singularName}`}
            </button>
            {mode === "edit" ? (
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="crm-panel">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const id = String(item.id);

                return (
                  <tr key={id}>
                    {columns.map((column) => {
                      const rawValue = resolvePath(item, column.key);
                      return (
                        <td key={`${id}-${column.key}`}>
                          {column.format === "pill" && rawValue ? (
                            <span className="pill">{enumLabel(String(rawValue))}</span>
                          ) : (
                            formatColumnValue(item, column)
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <div className="crm-table-actions">
                        {extraActions.map((action) => (
                          <a
                            key={`${id}-${action.label}`}
                            className="btn btn-outline"
                            href={action.href(item)}
                            target={action.openInNewTab ? "_blank" : undefined}
                            rel={action.openInNewTab ? "noreferrer" : undefined}
                          >
                            {action.label}
                          </a>
                        ))}
                        <button type="button" className="btn btn-outline" onClick={() => startEdit(item)}>
                          Edit
                        </button>
                        {allowDelete ? (
                          <button
                            type="button"
                            className="btn btn-outline crm-danger-btn"
                            onClick={() => handleDelete(id)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
