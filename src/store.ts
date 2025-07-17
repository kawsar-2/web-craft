import { create } from "zustand";
import { BuilderStore, AuthStore } from "./types";
import { supabase } from "./lib/supabase";

export const useBuilderStore = create<BuilderStore>((set) => ({
  pages: [
    {
      id: "home",
      title: "Home",
      slug: "/",
      components: [],
    },
  ],
  currentPageId: "home",
  components: [],
  isPreviewMode: false,
  addPage: (page) =>
    set((state) => ({
      pages: [...state.pages, page],
    })),
  removePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      currentPageId:
        state.currentPageId === id
          ? state.pages[0]?.id || null
          : state.currentPageId,
    })),
  setCurrentPage: (id) =>
    set((state) => {
      const page = state.pages.find((p) => p.id === id);
      return {
        currentPageId: id,
        components: page?.components || [],
      };
    }),
  updatePage: (id, updates) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updates,
              components:
                state.currentPageId === id ? state.components : p.components,
            }
          : p
      ),
    })),
  addComponent: (component) =>
    set((state) => {
      const newComponents = [...state.components, component];
      return {
        components: newComponents,
        pages: state.pages.map((p) =>
          p.id === state.currentPageId ? { ...p, components: newComponents } : p
        ),
      };
    }),
  removeComponent: (id) =>
    set((state) => {
      const newComponents = state.components.filter((c) => c.id !== id);
      return {
        components: newComponents,
        pages: state.pages.map((p) =>
          p.id === state.currentPageId ? { ...p, components: newComponents } : p
        ),
      };
    }),
  reorderComponents: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.components.findIndex((c) => c.id === activeId);
      const newIndex = state.components.findIndex((c) => c.id === overId);
      const newComponents = [...state.components];
      const [removed] = newComponents.splice(oldIndex, 1);
      newComponents.splice(newIndex, 0, removed);
      return {
        components: newComponents,
        pages: state.pages.map((p) =>
          p.id === state.currentPageId ? { ...p, components: newComponents } : p
        ),
      };
    }),
  updateComponent: (id, updates) =>
    set((state) => {
      const newComponents = state.components.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      return {
        components: newComponents,
        pages: state.pages.map((p) =>
          p.id === state.currentPageId ? { ...p, components: newComponents } : p
        ),
      };
    }),
  togglePreviewMode: () =>
    set((state) => ({
      isPreviewMode: !state.isPreviewMode,
    })),
}));

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,
  setUser: (user) => set({ user, loading: false }),
  setError: (error) => set({ error, loading: false }),
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user?.email_confirmed_at) {
        set({
          loading: false,
          error: "Please verify your email before logging in",
        });
        return null;
      }

      set({ loading: false, user: data.user });
      return data;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },
  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/login",
        },
      });

      if (error) throw error;

      set({
        loading: false,
        user: data.user,
        emailSent: true,
      });

      return data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, loading: false, error: null });
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  resetPassword: async (email) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      set({ loading: false, error: null });
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));
