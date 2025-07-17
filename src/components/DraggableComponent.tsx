import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Settings, ArrowUpDown as ArrowsUpDown, Type } from 'lucide-react';
import { useBuilderStore } from '../store';
import { ComponentData } from '../types';

export const DraggableComponent = (props: ComponentData) => {
  const { id, type, content, props: componentProps } = props;
  const removeComponent = useBuilderStore((state) => state.removeComponent);
  const updateComponent = useBuilderStore((state) => state.updateComponent);
  const pages = useBuilderStore((state) => state.pages);
  const [isResizing, setIsResizing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: componentProps?.width || '100%',
    minHeight: componentProps?.height,
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('.component-container');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const width = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 20), 100);
      const height = Math.max(e.clientY - rect.top, 50);
      
      updateComponent(id, {
        props: {
          ...componentProps,
          width: `${width}%`,
          height: `${height}px`,
        },
      });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderTextSizeControl = () => {
    if (!['heading', 'paragraph', 'button', 'link'].includes(type)) return null;

    return (
      <div className="flex items-center gap-2 mt-2">
        <Type className="w-4 h-4 text-gray-400" />
        <input
          type="range"
          min="12"
          max="72"
          value={componentProps?.fontSize || 16}
          onChange={(e) =>
            updateComponent(id, {
              props: { ...componentProps, fontSize: parseInt(e.target.value) },
            })
          }
          className="w-full"
        />
        <span className="text-sm text-gray-500">{componentProps?.fontSize || 16}px</span>
      </div>
    );
  };

  const getTextStyle = () => {
    if (!['heading', 'paragraph', 'button', 'link'].includes(type)) return {};
    return {
      fontSize: `${componentProps?.fontSize || 16}px`,
    };
  };

  const renderComponent = () => {
    switch (type) {
      case 'navbar':
        return (
          <div className="space-y-4">
            <input
              type="text"
              value={content}
              onChange={(e) =>
                updateComponent(id, { content: e.target.value })
              }
              className="w-full bg-transparent outline-none border rounded px-2 py-1"
              placeholder="Brand name..."
            />
            <div className="space-y-2">
              {componentProps?.items?.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const newItems = [...(componentProps?.items || [])];
                      newItems[index] = {
                        ...newItems[index],
                        label: e.target.value,
                      };
                      updateComponent(id, {
                        props: { ...componentProps, items: newItems },
                      });
                    }}
                    className="flex-1 bg-transparent outline-none border rounded px-2 py-1"
                    placeholder="Menu item label..."
                  />
                  <select
                    value={item.href}
                    onChange={(e) => {
                      const newItems = [...(componentProps?.items || [])];
                      newItems[index] = {
                        ...newItems[index],
                        href: e.target.value,
                      };
                      updateComponent(id, {
                        props: { ...componentProps, items: newItems },
                      });
                    }}
                    className="bg-white border rounded px-2 py-1"
                  >
                    {pages.map((page) => (
                      <option key={page.id} value={page.slug}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const newItems = componentProps?.items?.filter(
                        (_, i) => i !== index
                      );
                      updateComponent(id, {
                        props: { ...componentProps, items: newItems },
                      });
                    }}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newItems = [
                    ...(componentProps?.items || []),
                    { label: '', href: pages[0]?.slug || '/' },
                  ];
                  updateComponent(id, {
                    props: { ...componentProps, items: newItems },
                  });
                }}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                + Add menu item
              </button>
            </div>
          </div>
        );
      case 'dropdown':
        return (
          <div className="space-y-4">
            <input
              type="text"
              value={content}
              onChange={(e) =>
                updateComponent(id, { content: e.target.value })
              }
              className="w-full bg-transparent outline-none border rounded px-2 py-1"
              placeholder="Dropdown label..."
            />
            <div className="space-y-2">
              {componentProps?.items?.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const newItems = [...(componentProps?.items || [])];
                      newItems[index] = {
                        ...newItems[index],
                        label: e.target.value,
                      };
                      updateComponent(id, {
                        props: { ...componentProps, items: newItems },
                      });
                    }}
                    className="flex-1 bg-transparent outline-none border rounded px-2 py-1"
                    placeholder="Dropdown item label..."
                  />
                  <select
                    value={item.href}
                    onChange={(e) => {
                      const newItems = [...(componentProps?.items || [])];
                      newItems[index] = {
                        ...newItems[index],
                        href: e.target.value,
                      };
                      updateComponent(id, {
                        props: { ...componentProps, items: newItems },
                      });
                    }}
                    className="bg-white border rounded px-2 py-1"
                  >
                    {pages.map((page) => (
                      <option key={page.id} value={page.slug}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const newItems = componentProps?.items?.filter(
                        (_, i) => i !== index
                      );
                      updateComponent(id, {
                        props: { ...componentProps, items: newItems },
                      });
                    }}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newItems = [
                    ...(componentProps?.items || []),
                    { label: '', href: pages[0]?.slug || '/' },
                  ];
                  updateComponent(id, {
                    props: { ...componentProps, items: newItems },
                  });
                }}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                + Add dropdown item
              </button>
            </div>
          </div>
        );
      case 'button':
        return (
          <div className="space-y-4">
            <input
              type="text"
              value={content}
              onChange={(e) =>
                updateComponent(id, { content: e.target.value })
              }
              className="w-full bg-transparent outline-none border rounded px-2 py-1"
              style={getTextStyle()}
              placeholder="Button text..."
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={componentProps?.variant || 'primary'}
                onChange={(e) =>
                  updateComponent(id, {
                    props: { ...componentProps, variant: e.target.value as any },
                  })
                }
                className="bg-white border rounded px-2 py-1"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="ghost">Ghost</option>
              </select>
              <select
                value={componentProps?.alignment || 'left'}
                onChange={(e) =>
                  updateComponent(id, {
                    props: { ...componentProps, alignment: e.target.value as any },
                  })
                }
                className="bg-white border rounded px-2 py-1"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <select
              value={componentProps?.href || '/'}
              onChange={(e) =>
                updateComponent(id, {
                  props: { ...componentProps, href: e.target.value },
                })
              }
              className="w-full bg-white border rounded px-2 py-1"
            >
              {pages.map((page) => (
                <option key={page.id} value={page.slug}>
                  {page.title}
                </option>
              ))}
            </select>
            {renderTextSizeControl()}
          </div>
        );
      case 'link':
        return (
          <div className="space-y-4">
            <input
              type="text"
              value={content}
              onChange={(e) =>
                updateComponent(id, { content: e.target.value })
              }
              className="w-full bg-transparent outline-none border rounded px-2 py-1"
              style={getTextStyle()}
              placeholder="Link text..."
            />
            <select
              value={componentProps?.href || '/'}
              onChange={(e) =>
                updateComponent(id, {
                  props: { ...componentProps, href: e.target.value },
                })
              }
              className="w-full bg-white border rounded px-2 py-1"
            >
              {pages.map((page) => (
                <option key={page.id} value={page.slug}>
                  {page.title}
                </option>
              ))}
            </select>
            {renderTextSizeControl()}
          </div>
        );
      case 'container':
        return (
          <div className="space-y-4">
            <input
              type="text"
              value={componentProps?.backgroundColor || ''}
              onChange={(e) =>
                updateComponent(id, {
                  props: { ...componentProps, backgroundColor: e.target.value },
                })
              }
              className="w-full bg-transparent outline-none border rounded px-2 py-1"
              placeholder="Background color (e.g., #f0f0f0)"
            />
            <input
              type="text"
              value={componentProps?.padding || ''}
              onChange={(e) =>
                updateComponent(id, {
                  props: { ...componentProps, padding: e.target.value },
                })
              }
              className="w-full bg-transparent outline-none border rounded px-2 py-1"
              placeholder="Padding (e.g., 2rem)"
            />
          </div>
        );
      case 'heading':
        return (
          <div>
            <input
              type="text"
              value={content}
              onChange={(e) =>
                updateComponent(id, { content: e.target.value })
              }
              className="text-2xl font-bold w-full bg-transparent outline-none"
              style={getTextStyle()}
              placeholder="Enter heading..."
            />
            {renderTextSizeControl()}
          </div>
        );
      case 'paragraph':
        return (
          <div>
            <textarea
              value={content}
              onChange={(e) =>
                updateComponent(id, { content: e.target.value })
              }
              className="w-full bg-transparent outline-none resize-none"
              style={getTextStyle()}
              placeholder="Enter text..."
              rows={3}
            />
            {renderTextSizeControl()}
          </div>
        );
      case 'image':
        return (
          <div className="relative">
            <input
              type="text"
              value={content}
              onChange={(e) =>
                updateComponent(id, { content: e.target.value })
              }
              className="w-full bg-transparent outline-none mb-2"
              placeholder="Enter image URL..."
            />
            {content && (
              <img
                src={content}
                alt="Content"
                className="max-w-full h-auto rounded"
              />
            )}
          </div>
        );
      case 'youtube':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={content}
              onChange={(e) =>
                updateComponent(id, { content: e.target.value })
              }
              className="w-full bg-transparent outline-none border rounded px-2 py-1"
              placeholder="Enter YouTube embed URL (e.g., https://www.youtube.com/embed/VIDEO_ID)"
            />
            {content && (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={content}
                  className="absolute top-0 left-0 w-full h-full rounded"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        );
      case 'grid':
        return (
          <div className="space-y-2">
            <input
              type="number"
              value={componentProps?.columns || 2}
              onChange={(e) =>
                updateComponent(id, {
                  props: { ...componentProps, columns: parseInt(e.target.value) },
                })
              }
              className="w-full bg-transparent outline-none border rounded px-2 py-1"
              placeholder="Number of columns..."
              min="1"
              max="4"
            />
            <input
              type="number"
              value={componentProps?.spacing || 4}
              onChange={(e) =>
                updateComponent(id, {
                  props: { ...componentProps, spacing: parseInt(e.target.value) },
                })
              }
              className="w-full bg-transparent outline-none border rounded px-2 py-1"
              placeholder="Grid spacing..."
              min="0"
              max="8"
            />
          </div>
        );
      case 'footer':
        return (
          <textarea
            value={content}
            onChange={(e) =>
              updateComponent(id, { content: e.target.value })
            }
            className="w-full bg-transparent outline-none resize-none"
            placeholder="Footer content..."
            rows={3}
          />
        );
      case 'spacer':
        return (
          <input
            type="number"
            value={componentProps?.spacing || 4}
            onChange={(e) =>
              updateComponent(id, {
                props: { ...componentProps, spacing: parseInt(e.target.value) },
              })
            }
            className="w-full bg-transparent outline-none border rounded px-2 py-1"
            placeholder="Spacing size..."
            min="1"
            max="32"
          />
        );
      case 'social':
        return (
          <textarea
            value={content}
            onChange={(e) =>
              updateComponent(id, { content: e.target.value })
            }
            className="w-full bg-transparent outline-none resize-none"
            placeholder="Enter social links (one per line)..."
            rows={3}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative border border-gray-200 rounded-lg p-4 mb-4 bg-white component-container"
    >
      <div className="absolute right-2 top-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 hover:bg-gray-100 rounded"
          onClick={() => removeComponent(id)}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
        <div
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-100 rounded cursor-move"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      {renderComponent()}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleResizeStart}
      >
        <ArrowsUpDown className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
};