import { NODE_DEFINITION_LIST } from "@/lib/nodes";
import type { NodeCategory, NodeDefinition, NodeType } from "@/lib/nodes/types";

export const NODE_DEFINITIONS: Record<NodeType, NodeDefinition> =
  NODE_DEFINITION_LIST.reduce(
    (definitions, nodeDefinition) => {
      definitions[nodeDefinition.type] = nodeDefinition;
      return definitions;
    },
    {} as Record<NodeType, NodeDefinition>
  );

export const ALL_NODE_TYPES = Object.keys(NODE_DEFINITIONS) as NodeType[];

export function getNodeDefinition(type: NodeType): NodeDefinition {
  return NODE_DEFINITIONS[type];
}

export function getNodesByCategory(category: NodeCategory): NodeDefinition[] {
  return NODE_DEFINITION_LIST.filter(
    (nodeDefinition) => nodeDefinition.category === category
  );
}
