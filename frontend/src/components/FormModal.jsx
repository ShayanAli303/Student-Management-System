import { useEffect, useState } from "react";

const toFormState = (fields, initialData) =>
  fields.reduce((accumulator, field) => {
    accumulator[field.name] = initialData?.[field.name] ?? field.defaultValue ?? "";
    return accumulator;
  }, {});

const preparePayload = (fields, formState) =>
  fields.reduce((accumulator, field) => {
    const value = formState[field.name];
    if (field.type === "number") {
      accumulator[field.name] = value === "" ? null : Number(value);
      return accumulator;
    }
    if (field.type === "select") {
      accumulator[field.name] = value === "" ? null : Number.isNaN(Number(value)) ? value : Number(value);
      return accumulator;
    }
    if (field.type === "date") {
      accumulator[field.name] = value || null;
      return accumulator;
    }
    accumulator[field.name] = value;
    return accumulator;
  }, {});

export default function FormModal({ title, fields, initialData, onClose, onSubmit, submitLabel = "Save" }) {
  const [formState, setFormState] = useState(() => toFormState(fields, initialData));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormState(toFormState(fields, initialData));
    setError("");
    setSubmitting(false);
  }, [fields, initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const getOptions = (field) => {
    if (typeof field.filterOptions === "function") {
      return field.filterOptions(formState);
    }
    return field.options || [];
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(preparePayload(fields, formState));
    } catch (submissionError) {
      setError(submissionError.message || "Unable to save record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Manage Record</p>
            <h3>{title}</h3>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-scroll">
            <div className="form-grid">
            {fields.map((field) => (
              <label key={field.name} className={field.type === "textarea" ? "full-span" : ""}>
                <span>{field.label}</span>
                {field.type === "select" ? (
                  <select name={field.name} value={formState[field.name]} onChange={handleChange} required={field.required}>
                    <option value="">Select</option>
                    {getOptions(field).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea name={field.name} value={formState[field.name]} onChange={handleChange} rows="3" />
                ) : (
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    value={formState[field.name]}
                    onChange={handleChange}
                    required={field.required}
                  />
                )}
              </label>
            ))}
            </div>
          </div>
          {error ? <p className="feedback error">{error}</p> : null}
          <div className="form-actions">
            <button className="secondary-button" onClick={onClose} type="button" disabled={submitting}>
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
