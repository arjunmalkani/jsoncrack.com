import React from "react";
import styled from "styled-components";
import useGraph from "../stores/useGraph";
import InlineEditor from "./InlineEditor";

const EditButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 8px;
  gap: 8px;
`;

const EditButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
`;

type Props = {
  nodeId: string;
  value: string;
  onSave: (newValue: string) => void;
};

export const NodeEditUI = ({ nodeId, value, onSave }: Props) => {
  const editingNodeId = useGraph(state => state.editingNodeId);
  const editingValue = useGraph(state => state.editingValue);
  const setEditingNode = useGraph(state => state.setEditingNode);
  const setEditingValue = useGraph(state => state.setEditingValue);
  const cancelEditing = useGraph(state => state.cancelEditing);

  const isEditing = editingNodeId === nodeId;

  const handleEditClick = () => {
    setEditingNode(nodeId, value);
  };

  const handleSave = () => {
    onSave(editingValue);
    cancelEditing();
  };

  const handleCancel = () => {
    cancelEditing();
  };

  if (isEditing) {
    return (
      <InlineEditor
        value={editingValue}
        onChange={setEditingValue}
        onSave={handleSave}
        onCancel={handleCancel}
        canSave={editingValue.trim() !== ""}
      />
    );
  }

  return (
    <EditButtonContainer>
      <EditButton type="button" onClick={handleEditClick}>
        Edit
      </EditButton>
    </EditButtonContainer>
  );
};
