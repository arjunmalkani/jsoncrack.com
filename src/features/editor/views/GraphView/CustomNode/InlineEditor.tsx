import React from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  canSave?: boolean;
};

export default function InlineEditor({ value, onChange, onSave, onCancel, canSave = true }: Props) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #d0d7de",
          background: "#0d1117",
          color: "#e6edf3",
        }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #2ea043",
            background: "#2ea043",
            color: "white",
            opacity: canSave ? 1 : 0.6,
            cursor: canSave ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #f85149",
            background: "#f85149",
            color: "white",
            fontWeight: 600,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
