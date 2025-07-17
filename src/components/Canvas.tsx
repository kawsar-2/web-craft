import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBuilderStore } from '../store';
import { DraggableComponent } from './DraggableComponent';

export const Canvas = () => {
  const components = useBuilderStore((state) => state.components);
  const { setNodeRef } = useDroppable({
    id: 'canvas',
  });

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div
        ref={setNodeRef}
        className="max-w-4xl mx-auto bg-white min-h-[calc(100vh-4rem)] p-8 rounded-lg shadow-sm"
      >
        <SortableContext
          items={components.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {components.map((component) => (
            <DraggableComponent key={component.id} {...component} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};