import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/database.types';
import type { Json } from '@/lib/database.types';

export interface CartItemLocal {
  product: Pick<Product, 'id' | 'name' | 'name_ko' | 'price' | 'original_price' | 'thumbnail' | 'product_type'>;
  quantity: number;
  selectedOptions: Record<string, string>;
}

interface CartStore {
  items: CartItemLocal[];
  isOpen: boolean;

  // Actions
  addItem: (item: CartItemLocal) => void;
  removeItem: (productId: string, options?: Record<string, string>) => void;
  updateQuantity: (productId: string, quantity: number, options?: Record<string, string>) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
}

const optionsKey = (options?: Record<string, string>) =>
  JSON.stringify(options || {});

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === newItem.product.id &&
              optionsKey(item.selectedOptions) === optionsKey(newItem.selectedOptions)
          );

          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + newItem.quantity,
            };
            return { items: updated };
          }

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId, options) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                optionsKey(item.selectedOptions) === optionsKey(options)
              )
          ),
        }));
      },

      updateQuantity: (productId, quantity, options) => {
        if (quantity <= 0) {
          get().removeItem(productId, options);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId &&
            optionsKey(item.selectedOptions) === optionsKey(options)
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (open) => set({ isOpen: open }),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
      
      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),
    }),
    {
      name: 'style-heba-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
