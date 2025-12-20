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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          can_manage_admins: boolean | null
          can_manage_drivers: boolean | null
          can_manage_marketing: boolean | null
          can_manage_orders: boolean | null
          can_manage_payments: boolean | null
          can_manage_restaurants: boolean | null
          can_manage_settings: boolean | null
          can_manage_support: boolean | null
          can_manage_users: boolean | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_manage_admins?: boolean | null
          can_manage_drivers?: boolean | null
          can_manage_marketing?: boolean | null
          can_manage_orders?: boolean | null
          can_manage_payments?: boolean | null
          can_manage_restaurants?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_support?: boolean | null
          can_manage_users?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_manage_admins?: boolean | null
          can_manage_drivers?: boolean | null
          can_manage_marketing?: boolean | null
          can_manage_orders?: boolean | null
          can_manage_payments?: boolean | null
          can_manage_restaurants?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_support?: boolean | null
          can_manage_users?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_fraud_logs: {
        Row: {
          admin_notes: string | null
          affiliate_id: string | null
          created_at: string | null
          details: Json | null
          device_fingerprint: string | null
          event_type: string
          id: string
          ip_address: string | null
          referral_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          user_agent: string | null
          withdrawal_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id?: string | null
          created_at?: string | null
          details?: Json | null
          device_fingerprint?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          referral_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          withdrawal_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string | null
          created_at?: string | null
          details?: Json | null
          device_fingerprint?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          referral_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_fraud_logs_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_fraud_logs_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_fraud_logs_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "affiliate_withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      affiliate_withdrawals: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string | null
          fraud_check_notes: string | null
          fraud_check_passed: boolean | null
          id: string
          mobile_money_number: string | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string | null
          fraud_check_notes?: string | null
          fraud_check_passed?: boolean | null
          id?: string
          mobile_money_number?: string | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string | null
          fraud_check_notes?: string | null
          fraud_check_passed?: boolean | null
          id?: string
          mobile_money_number?: string | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          available_balance: number | null
          ban_reason: string | null
          created_at: string | null
          eligible_referrals: number | null
          id: string
          is_eligible: boolean | null
          pending_balance: number | null
          referral_code: string
          referral_link: string | null
          status: string | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_balance?: number | null
          ban_reason?: string | null
          created_at?: string | null
          eligible_referrals?: number | null
          id?: string
          is_eligible?: boolean | null
          pending_balance?: number | null
          referral_code: string
          referral_link?: string | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_balance?: number | null
          ban_reason?: string | null
          created_at?: string | null
          eligible_referrals?: number | null
          id?: string
          is_eligible?: boolean | null
          pending_balance?: number | null
          referral_code?: string
          referral_link?: string | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_category: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_category: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_category?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bundles: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_available: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          name: string
          price?: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          quantity: number
          selected_options: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          quantity?: number
          selected_options?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          quantity?: number
          selected_options?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_reviews: {
        Row: {
          comment: string | null
          created_at: string
          driver_id: string
          id: string
          order_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          driver_id: string
          id?: string
          order_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          order_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      faq_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category_id: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faq_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_banners: {
        Row: {
          background_color: string | null
          click_count: number | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          position: string | null
          starts_at: string | null
          subtitle: string | null
          target_audience: string | null
          text_color: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          background_color?: string | null
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          position?: string | null
          starts_at?: string | null
          subtitle?: string | null
          target_audience?: string | null
          text_color?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          background_color?: string | null
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          position?: string | null
          starts_at?: string | null
          subtitle?: string | null
          target_audience?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          actual_metrics: Json | null
          banner_ids: string[] | null
          budget: number | null
          campaign_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          name: string
          popup_ids: string[] | null
          promo_code_ids: string[] | null
          spent: number | null
          starts_at: string | null
          status: string | null
          target_metrics: Json | null
          updated_at: string | null
        }
        Insert: {
          actual_metrics?: Json | null
          banner_ids?: string[] | null
          budget?: number | null
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          name: string
          popup_ids?: string[] | null
          promo_code_ids?: string[] | null
          spent?: number | null
          starts_at?: string | null
          status?: string | null
          target_metrics?: Json | null
          updated_at?: string | null
        }
        Update: {
          actual_metrics?: Json | null
          banner_ids?: string[] | null
          budget?: number | null
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          popup_ids?: string[] | null
          promo_code_ids?: string[] | null
          spent?: number | null
          starts_at?: string | null
          status?: string | null
          target_metrics?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_popups: {
        Row: {
          button_text: string | null
          button_url: string | null
          click_count: number | null
          content: string | null
          created_at: string | null
          created_by: string | null
          display_count: number | null
          display_frequency: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          popup_type: string | null
          starts_at: string | null
          target_pages: string[] | null
          title: string
          trigger_type: string | null
          trigger_value: number | null
          updated_at: string | null
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          click_count?: number | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          display_count?: number | null
          display_frequency?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          popup_type?: string | null
          starts_at?: string | null
          target_pages?: string[] | null
          title: string
          trigger_type?: string | null
          trigger_value?: number | null
          updated_at?: string | null
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          click_count?: number | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          display_count?: number | null
          display_frequency?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          popup_type?: string | null
          starts_at?: string | null
          target_pages?: string[] | null
          title?: string
          trigger_type?: string | null
          trigger_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_item_option_groups: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          max_selections: number | null
          menu_item_id: string
          min_selections: number | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          menu_item_id: string
          min_selections?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          menu_item_id?: string
          min_selections?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_option_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_options: {
        Row: {
          bundle_id: string | null
          created_at: string
          display_order: number | null
          id: string
          is_available: boolean | null
          name: string
          option_group_id: string
          price_modifier: number | null
          updated_at: string
        }
        Insert: {
          bundle_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          name: string
          option_group_id: string
          price_modifier?: number | null
          updated_at?: string
        }
        Update: {
          bundle_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          name?: string
          option_group_id?: string
          price_modifier?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_options_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_options_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "menu_item_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          is_typing: boolean | null
          order_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_typing?: boolean | null
          order_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_typing?: boolean | null
          order_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          order_id: string
          price: number
          quantity: number
          selected_options: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          order_id: string
          price: number
          quantity?: number
          selected_options?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          order_id?: string
          price?: number
          quantity?: number
          selected_options?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: string
          delivery_driver_id: string | null
          delivery_fee: number
          discount_amount: number | null
          id: string
          notes: string | null
          phone: string
          promo_code_id: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string
          voice_note_url: string | null
        }
        Insert: {
          created_at?: string
          delivery_address: string
          delivery_driver_id?: string | null
          delivery_fee: number
          discount_amount?: number | null
          id?: string
          notes?: string | null
          phone: string
          promo_code_id?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id: string
          voice_note_url?: string | null
        }
        Update: {
          created_at?: string
          delivery_address?: string
          delivery_driver_id?: string | null
          delivery_fee?: number
          discount_amount?: number | null
          id?: string
          notes?: string | null
          phone?: string
          promo_code_id?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_sent: boolean | null
          payout_id: string | null
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_sent?: boolean | null
          payout_id?: string | null
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_sent?: boolean | null
          payout_id?: string | null
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          bank_account_number: string | null
          bank_name: string | null
          created_at: string | null
          custom_frequency_days: number | null
          entity_id: string
          entity_type: string
          id: string
          is_auto_payout: boolean | null
          min_payout_amount: number | null
          mobile_money_number: string | null
          next_payout_date: string | null
          payment_frequency: string | null
          payment_method: string | null
          updated_at: string | null
        }
        Insert: {
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          custom_frequency_days?: number | null
          entity_id: string
          entity_type: string
          id?: string
          is_auto_payout?: boolean | null
          min_payout_amount?: number | null
          mobile_money_number?: string | null
          next_payout_date?: string | null
          payment_frequency?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          custom_frequency_days?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_auto_payout?: boolean | null
          min_payout_amount?: number | null
          mobile_money_number?: string | null
          next_payout_date?: string | null
          payment_frequency?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          batch_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payout_type: string | null
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          processed_by: string | null
          recipient_id: string
          recipient_type: string
          reference: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payout_type?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          recipient_id: string
          recipient_type: string
          reference?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payout_type?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          recipient_id?: string
          recipient_type?: string
          reference?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          district: string | null
          driver_rating: number | null
          driver_reviews_count: number | null
          email: string | null
          full_name: string | null
          id: string
          is_available: boolean | null
          is_validated: boolean | null
          latitude: number | null
          license_number: string | null
          location_updated_at: string | null
          longitude: number | null
          phone: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_documents: Json | null
          validation_notes: string | null
          vehicle_type: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          driver_rating?: number | null
          driver_reviews_count?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          is_available?: boolean | null
          is_validated?: boolean | null
          latitude?: number | null
          license_number?: string | null
          location_updated_at?: string | null
          longitude?: number | null
          phone?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_documents?: Json | null
          validation_notes?: string | null
          vehicle_type?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          driver_rating?: number | null
          driver_reviews_count?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_available?: boolean | null
          is_validated?: boolean | null
          latitude?: number | null
          license_number?: string | null
          location_updated_at?: string | null
          longitude?: number | null
          phone?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_documents?: Json | null
          validation_notes?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          restaurant_id: string | null
          updated_at: string
          uses_count: number | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          restaurant_id?: string | null
          updated_at?: string
          uses_count?: number | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          restaurant_id?: string | null
          updated_at?: string
          uses_count?: number | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          device_fingerprint: string | null
          fraud_reason: string | null
          id: string
          ip_address: string | null
          is_suspicious: boolean | null
          orders_count: number | null
          referred_user_id: string
          referrer_id: string
          reward_amount: number | null
          rewarded_at: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_reason?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          orders_count?: number | null
          referred_user_id: string
          referrer_id: string
          reward_amount?: number | null
          rewarded_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_reason?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          orders_count?: number | null
          referred_user_id?: string
          referrer_id?: string
          reward_amount?: number | null
          rewarded_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          business_hours: Json | null
          city: string | null
          created_at: string
          cuisine_type: string | null
          delivery_fee: number | null
          delivery_time: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_sponsored: boolean | null
          is_validated: boolean | null
          latitude: number | null
          longitude: number | null
          min_order: number | null
          name: string
          owner_id: string | null
          pause_message: string | null
          pause_until: string | null
          paused_at: string | null
          phone: string | null
          rating: number | null
          sponsored_position: number | null
          sponsored_until: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_documents: Json | null
          validation_notes: string | null
        }
        Insert: {
          address: string
          business_hours?: Json | null
          city?: string | null
          created_at?: string
          cuisine_type?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_sponsored?: boolean | null
          is_validated?: boolean | null
          latitude?: number | null
          longitude?: number | null
          min_order?: number | null
          name: string
          owner_id?: string | null
          pause_message?: string | null
          pause_until?: string | null
          paused_at?: string | null
          phone?: string | null
          rating?: number | null
          sponsored_position?: number | null
          sponsored_until?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_documents?: Json | null
          validation_notes?: string | null
        }
        Update: {
          address?: string
          business_hours?: Json | null
          city?: string | null
          created_at?: string
          cuisine_type?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_sponsored?: boolean | null
          is_validated?: boolean | null
          latitude?: number | null
          longitude?: number | null
          min_order?: number | null
          name?: string
          owner_id?: string | null
          pause_message?: string | null
          pause_until?: string | null
          paused_at?: string | null
          phone?: string | null
          rating?: number | null
          sponsored_position?: number | null
          sponsored_until?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_documents?: Json | null
          validation_notes?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string | null
          rating: number
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating: number
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating?: number
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          order_id: string | null
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          order_id?: string | null
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          order_id?: string | null
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          order_id: string | null
          payout_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payout_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payout_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      anonymous_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          restaurant_id: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_orders_masked: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          delivery_driver_id: string | null
          delivery_fee: number | null
          discount_amount: number | null
          id: string | null
          notes: string | null
          phone: string | null
          promo_code_id: string | null
          restaurant_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_address?: never
          delivery_driver_id?: string | null
          delivery_fee?: number | null
          discount_amount?: number | null
          id?: string | null
          notes?: string | null
          phone?: never
          promo_code_id?: string | null
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_address?: never
          delivery_driver_id?: string | null
          delivery_fee?: number | null
          discount_amount?: number | null
          id?: string | null
          notes?: string | null
          phone?: never
          promo_code_id?: string | null
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_resume_restaurants: { Args: never; Returns: undefined }
      calculate_driver_balance: { Args: { driver_id: string }; Returns: number }
      calculate_restaurant_balance: {
        Args: { restaurant_owner_id: string }
        Returns: number
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "restaurant_owner" | "delivery_driver" | "admin"
      order_status:
        | "pending"
        | "accepted"
        | "confirmed"
        | "preparing"
        | "pickup_pending"
        | "pickup_accepted"
        | "picked_up"
        | "ready"
        | "delivering"
        | "delivered"
        | "cancelled"
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
      app_role: ["customer", "restaurant_owner", "delivery_driver", "admin"],
      order_status: [
        "pending",
        "accepted",
        "confirmed",
        "preparing",
        "pickup_pending",
        "pickup_accepted",
        "picked_up",
        "ready",
        "delivering",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
