import { User } from '@supabase/supabase-js';

export interface Page {
  id: string;
  title: string;
  slug: string;
  components: ComponentData[];
}

export interface ComponentData {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'button' | 'youtube' | 'grid' | 'footer' | 'spacer' | 'divider' | 'social' | 'container' | 'navbar' | 'link' | 'dropdown';
  content: string;
  props?: {
    columns?: number;
    spacing?: number;
    alignment?: 'left' | 'center' | 'right';
    children?: ComponentData[];
    backgroundColor?: string;
    padding?: string;
    href?: string;
    target?: '_blank' | '_self';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    items?: Array<{ label: string; href: string }>;
    width?: string;
    height?: string;
    fontSize?: number;
  };
}

export interface BuilderStore {
  pages: Page[];
  currentPageId: string | null;
  components: ComponentData[];
  isPreviewMode: boolean;
  addPage: (page: Page) => void;
  removePage: (id: string) => void;
  setCurrentPage: (id: string) => void;
  updatePage: (id: string, updates: Partial<Page>) => void;
  addComponent: (component: ComponentData) => void;
  removeComponent: (id: string) => void;
  reorderComponents: (activeId: string, overId: string) => void;
  updateComponent: (id: string, updates: Partial<ComponentData>) => void;
  togglePreviewMode: () => void;
}

export interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  preview_image: string;
  created_at: string;
  updated_at: string;
  pages: Page[];
}