import { DragDropProvider } from "@dnd-kit/react";
import { generateId } from "../../lib/generate-id";
import { useAppContext } from "../Puck/context";
import { ReactNode, useState } from "react";
import { DragDropManager, Feedback } from "@dnd-kit/dom";
import { DropZoneProvider } from "../DropZone";
import type { Draggable } from "@dnd-kit/dom";
import { getItem } from "../../lib/get-item";

export const DragDropContext = ({ children }: { children: ReactNode }) => {
  const { state, config, dispatch } = useAppContext();
  const { data } = state;
  const [manager] = useState(new DragDropManager({ plugins: [Feedback] }));

  const [draggedItem, setDraggedItem] = useState<Draggable | null>();

  return (
    <DragDropProvider
      manager={manager}
      onDragEnd={(event) => {
        const { source, target } = event.operation;

        setDraggedItem(null);

        // TODO tidy up placeholder if aborted

        if (!target || !source) return;

        console.log("onDragEnd", source, target);

        const isOverZone = target.id.toString().indexOf("zone:") === 0;

        let zone = source.data.group;
        let index = source.data.index;

        if (isOverZone) {
          zone = target.id.toString().replace("zone:", "");
          index = 0; // TODO place at end
        }

        // Remove placeholder prop from component and sync to history

        const item = getItem({ zone, index }, data);

        if (!item) return;

        const propsWithoutPlaceholder = {
          ...item.props,
        };

        if (item.props.__placeholder) {
          propsWithoutPlaceholder.id = generateId(item.type);

          delete propsWithoutPlaceholder["__placeholder"];
        }

        dispatch({
          type: "replace",
          destinationIndex: source.data.index,
          destinationZone: source.data.group,
          data: { ...item, props: propsWithoutPlaceholder },
        });
      }}
      onDragOver={(event) => {
        // Prevent the optimistic re-ordering
        event.preventDefault();

        // Drag end can sometimes trigger after drag
        if (!draggedItem) return;

        const { source, target } = event.operation;

        if (!target || !source) return;

        console.log("onDragOver", source, target);

        const isNewComponent = source.data.type === "drawer";
        const isOverZone = target.id.toString().indexOf("zone:") === 0;

        let targetZone = target.data.group;
        let targetIndex = target.data.index;

        if (isOverZone) {
          targetZone = target.id.toString().replace("zone:", "");
          targetIndex = 0; // TODO place at end
        }

        if (isNewComponent) {
          dispatch({
            type: "insert",
            componentType: source.data.componentType,
            destinationIndex: targetIndex,
            destinationZone: targetZone,
            recordHistory: false,
            props: {
              id: source.id.toString(),
              __placeholder: true,
            },
          });
          // dispatch({
          //   type: "insert",
          //   componentType: source.id.toString(),
          //   destinationIndex: targetIndex,
          //   destinationZone: targetZone,
          //   id: source.id.toString(),
          //   recordHistory: false,
          // });
        } else if (source.data.group === targetZone) {
          dispatch({
            type: "reorder",
            sourceIndex: source.data.index,
            destinationIndex: targetIndex,
            destinationZone: targetZone,
            recordHistory: false,
          });
        } else {
          dispatch({
            type: "move",
            sourceZone: source.data.group,
            sourceIndex: source.data.index,
            destinationIndex: targetIndex,
            destinationZone: targetZone,
            recordHistory: false,
          });
        }
      }}
      onBeforeDragStart={(op) => {
        setDraggedItem(op.operation.source);

        dispatch({ type: "setUi", ui: { itemSelector: null } });
      }}
    >
      <DropZoneProvider
        value={{
          data,
          config,
          dispatch,
          draggedItem,
          mode: "edit",
          areaId: "root",
          collisionPriority: 1,
        }}
      >
        {children}
      </DropZoneProvider>
    </DragDropProvider>
  );
};
