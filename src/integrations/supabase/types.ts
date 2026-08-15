export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          currency: string
          id: number
          invoice_template: Json
          logo_url: string | null
          opening_as_of_date: string
          opening_bank: number
          opening_cash: number
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          currency?: string
          id?: number
          invoice_template?: Json
          logo_url?: string | null
          opening_as_of_date?: string
          opening_bank?: number
          opening_cash?: number
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          currency?: string
          id?: number
          invoice_template?: Json
          logo_url?: string | null
          opening_as_of_date?: string
          opening_bank?: number
          opening_cash?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_findings: {
        Row: {
          code: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          message: string | null
          resolved_at: string | null
          run_id: string
          severity: string
        }
        Insert: {
          code: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          run_id: string
          severity?: string
        }
        Update: {
          code?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          run_id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "audit_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      audit_runs: {
        Row: {
          created_by: string | null
          finished_at: string | null
          id: string
          started_at: string
          summary: Json | null
        }
        Insert: {
          created_by?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          summary?: Json | null
        }
        Update: {
          created_by?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          summary?: Json | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          legacy_id: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          legacy_id?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          legacy_id?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          legacy_id: string | null
          linked_supplier_id: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          legacy_id?: string | null
          linked_supplier_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          legacy_id?: string | null
          linked_supplier_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_linked_supplier_fk"
            columns: ["linked_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_linked_supplier_fk"
            columns: ["linked_supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_balance"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      doc_counters: {
        Row: {
          last_number: number
          scope: string
          year: number
        }
        Insert: {
          last_number?: number
          scope: string
          year: number
        }
        Update: {
          last_number?: number
          scope?: string
          year?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          category: string
          created_at: string
          created_by: string | null
          doc_number: string
          id: string
          idempotency_key: string | null
          legacy_id: string | null
          method: string
          notes: string | null
          status: Database["public"]["Enums"]["doc_status"]
          transaction_date: string
        }
        Insert: {
          amount: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          doc_number: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          method?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          transaction_date?: string
        }
        Update: {
          amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          doc_number?: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          method?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          transaction_date?: string
        }
        Relationships: []
      }
      inventory_adjustment_items: {
        Row: {
          adjustment_id: string
          created_at: string
          id: string
          notes: string | null
          product_id: string | null
          product_name: string
          qty_delta: number
          unit_cost: number
        }
        Insert: {
          adjustment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          qty_delta: number
          unit_cost?: number
        }
        Update: {
          adjustment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          qty_delta?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustment_items_adjustment_id_fkey"
            columns: ["adjustment_id"]
            isOneToOne: false
            referencedRelation: "inventory_adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustment_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustment_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          doc_number: string
          id: string
          idempotency_key: string | null
          legacy_id: string | null
          notes: string | null
          reason: string
          status: Database["public"]["Enums"]["doc_status"]
          transaction_date: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          doc_number: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          reason: string
          status?: Database["public"]["Enums"]["doc_status"]
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          doc_number?: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          reason?: string
          status?: Database["public"]["Enums"]["doc_status"]
          transaction_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          qty_delta: number
          source_id: string
          source_type: Database["public"]["Enums"]["ledger_source_type"]
          transaction_date: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          qty_delta: number
          source_id: string
          source_type: Database["public"]["Enums"]["ledger_source_type"]
          transaction_date?: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          qty_delta?: number
          source_id?: string
          source_type?: Database["public"]["Enums"]["ledger_source_type"]
          transaction_date?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
        ]
      }
      opening_balances: {
        Row: {
          amount: number
          as_of_date: string
          created_at: string
          id: string
          notes: string | null
          party_id: string
          party_type: Database["public"]["Enums"]["party_type"]
        }
        Insert: {
          amount?: number
          as_of_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          party_id: string
          party_type: Database["public"]["Enums"]["party_type"]
        }
        Update: {
          amount?: number
          as_of_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          party_id?: string
          party_type?: Database["public"]["Enums"]["party_type"]
        }
        Relationships: []
      }
      party_ledger: {
        Row: {
          created_at: string
          credit: number
          debit: number
          id: string
          notes: string | null
          party_id: string
          party_type: Database["public"]["Enums"]["party_type"]
          source_id: string
          source_type: Database["public"]["Enums"]["ledger_source_type"]
          transaction_date: string
        }
        Insert: {
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          notes?: string | null
          party_id: string
          party_type: Database["public"]["Enums"]["party_type"]
          source_id: string
          source_type: Database["public"]["Enums"]["ledger_source_type"]
          transaction_date?: string
        }
        Update: {
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          notes?: string | null
          party_id?: string
          party_type?: Database["public"]["Enums"]["party_type"]
          source_id?: string
          source_type?: Database["public"]["Enums"]["ledger_source_type"]
          transaction_date?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          direction: Database["public"]["Enums"]["payment_direction"]
          doc_number: string
          id: string
          idempotency_key: string | null
          legacy_id: string | null
          method: string
          notes: string | null
          party_id: string
          party_name: string | null
          party_type: Database["public"]["Enums"]["party_type"]
          source_doc_id: string | null
          source_doc_type: string | null
          status: Database["public"]["Enums"]["doc_status"]
          transaction_date: string
        }
        Insert: {
          amount: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          direction: Database["public"]["Enums"]["payment_direction"]
          doc_number: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          method?: string
          notes?: string | null
          party_id: string
          party_name?: string | null
          party_type: Database["public"]["Enums"]["party_type"]
          source_doc_id?: string | null
          source_doc_type?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          transaction_date?: string
        }
        Update: {
          amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          direction?: Database["public"]["Enums"]["payment_direction"]
          doc_number?: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          method?: string
          notes?: string | null
          party_id?: string
          party_name?: string | null
          party_type?: Database["public"]["Enums"]["party_type"]
          source_doc_id?: string | null
          source_doc_type?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          transaction_date?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          barcode: string | null
          category_id: string | null
          cost_price: number
          created_at: string
          expiry_date: string | null
          id: string
          image_url: string | null
          legacy_id: string | null
          min_stock: number
          name: string
          notes: string | null
          pack_size: number
          sale_price: number
          sku: string | null
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          legacy_id?: string | null
          min_stock?: number
          name: string
          notes?: string | null
          pack_size?: number
          sale_price?: number
          sku?: string | null
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          legacy_id?: string | null
          min_stock?: number
          name?: string
          notes?: string | null
          pack_size?: number
          sale_price?: number
          sku?: string | null
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          line_discount: number
          line_total: number
          product_id: string | null
          product_name: string
          purchase_id: string
          qty: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_discount?: number
          line_total?: number
          product_id?: string | null
          product_name: string
          purchase_id: string
          qty: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_discount?: number
          line_total?: number
          product_id?: string | null
          product_name?: string
          purchase_id?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          product_id: string | null
          product_name: string
          qty: number
          return_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string | null
          product_name: string
          qty: number
          return_id: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string | null
          product_name?: string
          qty?: number
          return_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_returns: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          doc_number: string
          id: string
          idempotency_key: string | null
          legacy_id: string | null
          notes: string | null
          original_purchase_id: string | null
          payment_method: string | null
          refunded: number
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number
          supplier_id: string | null
          supplier_name: string | null
          total: number
          transaction_date: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          doc_number: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          original_purchase_id?: string | null
          payment_method?: string | null
          refunded?: number
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string | null
          total?: number
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          doc_number?: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          original_purchase_id?: string | null
          payment_method?: string | null
          refunded?: number
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string | null
          total?: number
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_original_purchase_id_fkey"
            columns: ["original_purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_balance"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      purchases: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          discount: number
          doc_number: string
          id: string
          idempotency_key: string | null
          legacy_id: string | null
          notes: string | null
          paid: number
          payment_method: string | null
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number
          supplier_id: string | null
          supplier_name: string | null
          tax: number
          total: number
          transaction_date: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          doc_number: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          paid?: number
          payment_method?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string | null
          tax?: number
          total?: number
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          doc_number?: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          paid?: number
          payment_method?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string | null
          tax?: number
          total?: number
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_balance"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          line_discount: number
          line_total: number
          product_id: string | null
          product_name: string
          qty: number
          sale_id: string
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_discount?: number
          line_total?: number
          product_id?: string | null
          product_name: string
          qty: number
          sale_id: string
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_discount?: number
          line_total?: number
          product_id?: string | null
          product_name?: string
          qty?: number
          sale_id?: string
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_return_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          product_id: string | null
          product_name: string
          qty: number
          return_id: string
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string | null
          product_name: string
          qty: number
          return_id: string
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string | null
          product_name?: string
          qty?: number
          return_id?: string
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "sale_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_returns: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          doc_number: string
          id: string
          idempotency_key: string | null
          legacy_id: string | null
          notes: string | null
          original_sale_id: string | null
          payment_method: string | null
          refunded: number
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number
          total: number
          total_cost: number
          transaction_date: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          doc_number: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          original_sale_id?: string | null
          payment_method?: string | null
          refunded?: number
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          total?: number
          total_cost?: number
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          doc_number?: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          original_sale_id?: string | null
          payment_method?: string | null
          refunded?: number
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          total?: number
          total_cost?: number
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balance"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sale_returns_original_sale_id_fkey"
            columns: ["original_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          discount: number
          doc_number: string
          id: string
          idempotency_key: string | null
          legacy_id: string | null
          notes: string | null
          paid: number
          payment_method: string | null
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number
          tax: number
          total: number
          total_cost: number
          transaction_date: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number
          doc_number: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          paid?: number
          payment_method?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          tax?: number
          total?: number
          total_cost?: number
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number
          doc_number?: string
          id?: string
          idempotency_key?: string | null
          legacy_id?: string | null
          notes?: string | null
          paid?: number
          payment_method?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          tax?: number
          total?: number
          total_cost?: number
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balance"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          legacy_id: string | null
          linked_customer_id: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          legacy_id?: string | null
          linked_customer_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          legacy_id?: string | null
          linked_customer_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_linked_customer_id_fkey"
            columns: ["linked_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_linked_customer_id_fkey"
            columns: ["linked_customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balance"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      treasury_movements: {
        Row: {
          amount: number
          created_at: string
          direction: Database["public"]["Enums"]["payment_direction"]
          id: string
          method: string
          notes: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["ledger_source_type"]
          transaction_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          direction: Database["public"]["Enums"]["payment_direction"]
          id?: string
          method?: string
          notes?: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["ledger_source_type"]
          transaction_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          direction?: Database["public"]["Enums"]["payment_direction"]
          id?: string
          method?: string
          notes?: string | null
          source_id?: string
          source_type?: Database["public"]["Enums"]["ledger_source_type"]
          transaction_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_customer_balance: {
        Row: {
          balance: number | null
          customer_id: string | null
          name: string | null
        }
        Relationships: []
      }
      v_product_stock: {
        Row: {
          name: string | null
          on_hand: number | null
          product_id: string | null
        }
        Relationships: []
      }
      v_supplier_balance: {
        Row: {
          balance: number | null
          name: string | null
          supplier_id: string | null
        }
        Relationships: []
      }
      v_treasury_balance: {
        Row: {
          balance: number | null
          method: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_opening_balance: {
        Args: {
          _amount: number
          _as_of: string
          _party_id: string
          _party_type: Database["public"]["Enums"]["party_type"]
        }
        Returns: undefined
      }
      cancel_document: {
        Args: { entity_id: string; entity_type: string; reason: string }
        Returns: undefined
      }
      is_setup_complete: { Args: never; Returns: boolean }
      next_doc_number: {
        Args: { _prefix: string; _scope: string }
        Returns: string
      }
      post_expense: { Args: { payload: Json }; Returns: string }
      post_payment: { Args: { payload: Json }; Returns: string }
      post_purchase: { Args: { payload: Json }; Returns: string }
      post_sale: { Args: { payload: Json }; Returns: string }
    }
    Enums: {
      doc_status: "draft" | "posted" | "cancelled"
      ledger_source_type:
        | "sale"
        | "purchase"
        | "sale_return"
        | "purchase_return"
        | "payment"
        | "expense"
        | "inventory_adjustment"
        | "opening_balance"
        | "manual"
      party_type: "customer" | "supplier"
      payment_direction: "in" | "out"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      doc_status: ["draft", "posted", "cancelled"],
      ledger_source_type: [
        "sale",
        "purchase",
        "sale_return",
        "purchase_return",
        "payment",
        "expense",
        "inventory_adjustment",
        "opening_balance",
        "manual",
      ],
      party_type: ["customer", "supplier"],
      payment_direction: ["in", "out"],
    },
  },
} as const
