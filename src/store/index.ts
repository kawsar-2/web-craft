import create from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export const useBuilderStore = create((set) => ({
  components: [], // Assuming you have an initial state for components
  selectedComponent: null,

  updateComponent: (id: string, updatedComponent: any) =>
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id ? updatedComponent : component
      ),
    })),

  setSelectedComponent: (id: string | null) => set({ selectedComponent: id }),

  removeComponent: (id: string) =>
    set((state) => ({
      components: state.components.filter((component) => component.id !== id),
    })),
}));
