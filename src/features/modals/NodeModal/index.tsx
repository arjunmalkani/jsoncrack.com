/* eslint-disable prettier/prettier */
import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button, Group, TextInput } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";
// InlineEditor removed in favor of two-field editor
import type { NodeData } from "../../../types/graph";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const editingNodeId = useGraph(state => state.editingNodeId);
  const setEditingNode = useGraph(state => state.setEditingNode);
  // setEditingValue unused for the two-field editor
  const cancelEditing = useGraph(state => state.cancelEditing);
  const setSelectedNode = useGraph(state => state.setSelectedNode);

  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("");

  const isEditing = editingNodeId === nodeData?.id;
  const normalizedData = normalizeNodeData(nodeData?.text ?? []);

  const handleEditClick = () => {
    // populate local fields from node data
    if (!nodeData?.text) {
      setName("");
      setColor("");
      setEditingNode(nodeData?.id ?? null, "");
      return;
    }

    // Find name and color in the text array
    let foundName = "";
    let foundColor = "";

    for (const row of nodeData.text) {
      if (row.key === "name" || row.key === "Name") {
        foundName = String(row.value ?? "");
      }
      if (row.key === "color" || row.key === "Color") {
        foundColor = String(row.value ?? "");
      }
    }

    // If no "name" key found and this is a single value node, use the value as name
    if (!foundName && nodeData.text.length === 1 && nodeData.text[0].key === null) {
      foundName = String(nodeData.text[0].value ?? "");
    }

    setName(foundName);
    setColor(foundColor);
    setEditingNode(nodeData?.id ?? null, "");
  };

  const handleSave = () => {
    const originalJson = useJson.getState().json;
    try {
      const doc = JSON.parse(originalJson);

      if (!nodeData?.path || nodeData.path.length === 0) {
        // replacing whole document
        const updatedJson = JSON.stringify(name, null, 2);
        useJson.getState().setJson(updatedJson);
        useFile.getState().setContents({ contents: updatedJson });
      } else {
        const path = nodeData.path as Array<string | number>;
        const parentPath = path.slice(0, -1);
        const lastSeg = path[path.length - 1];
        const parent = parentPath.length
          ? parentPath.reduce((acc: any, seg: any) => acc && acc[seg], doc)
          : doc;

        if (parent && lastSeg !== undefined) {
          const currentValue = parent[lastSeg as any];
          const isPlainObject = (v: any) => v && typeof v === "object" && !Array.isArray(v);

          if (isPlainObject(currentValue)) {
            // merge: update/add name and color keys but keep other keys
            if (name !== "") currentValue["name"] = name;
            if (color !== "") currentValue["color"] = color;
            const updatedJson = JSON.stringify(doc, null, 2);
            useJson.getState().setJson(updatedJson);
            useFile.getState().setContents({ contents: updatedJson });
          } else {
            // current value is primitive - replace with an object containing name and color
            const newObj: any = {};
            if (name !== "") newObj["name"] = name;
            if (color !== "") newObj["color"] = color;
            parent[lastSeg as any] = newObj;
            const updatedJson = JSON.stringify(doc, null, 2);
            useJson.getState().setJson(updatedJson);
            useFile.getState().setContents({ contents: updatedJson });
          }

          // Refresh selected node after a brief delay to allow graph re-parse
          setTimeout(() => {
            try {
              const newNodes = useGraph.getState().nodes;
              const targetPath = nodeData?.path ?? [];
              const match = newNodes.find(
                n => JSON.stringify(n.path ?? []) === JSON.stringify(targetPath)
              );
              if (match) {
                setSelectedNode(match);
              }
            } catch (e) {
              // ignore
            }
          }, 50);
        } else {
          // fallback: replace root
          const updatedJson = JSON.stringify(name, null, 2);
          useJson.getState().setJson(updatedJson);
          useFile.getState().setContents({ contents: updatedJson });
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to save node edit:", err);
      return;
    }

    cancelEditing();
  };

  const handleCancel = () => {
    cancelEditing();
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Flex justify="space-between" align="center">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <Group>
            {!isEditing && (
              <Button
                size="xs"
                variant="default"
                onClick={handleEditClick}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "1px solid #3b82f6",
                }}
              >
                Edit
              </Button>
            )}
            <CloseButton onClick={onClose} />
          </Group>
        </Flex>

        <Stack gap="xs">
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <div style={{ display: "grid", gap: 8 }}>
                <TextInput label="Name" size="xs" value={name} onChange={e => setName(e.target.value)} />
                <TextInput label="Color" size="xs" value={color} onChange={e => setColor(e.target.value)} />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <Button
                    size="xs"
                    onClick={handleSave}
                    style={{ background: "#2ea043", color: "white", border: "1px solid #2ea043" }}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    onClick={handleCancel}
                    style={{ background: "#f85149", color: "white", border: "1px solid #f85149" }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <CodeHighlight
                code={normalizedData}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
        </Stack>

        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
