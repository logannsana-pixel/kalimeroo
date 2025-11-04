-- Create table for menu item option groups (e.g., "Accompagnements", "Boissons", "Suppléments")
CREATE TABLE public.menu_item_option_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for menu item options (individual options within groups)
CREATE TABLE public.menu_item_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_group_id UUID NOT NULL REFERENCES public.menu_item_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier NUMERIC DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_item_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for option groups
CREATE POLICY "Anyone can view available option groups"
  ON public.menu_item_option_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_items
      WHERE menu_items.id = menu_item_option_groups.menu_item_id
      AND menu_items.is_available = true
    )
  );

CREATE POLICY "Restaurant owners can manage their option groups"
  ON public.menu_item_option_groups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_items
      JOIN public.restaurants ON restaurants.id = menu_items.restaurant_id
      WHERE menu_items.id = menu_item_option_groups.menu_item_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to option groups"
  ON public.menu_item_option_groups
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for options
CREATE POLICY "Anyone can view available options"
  ON public.menu_item_options
  FOR SELECT
  USING (is_available = true);

CREATE POLICY "Restaurant owners can manage their options"
  ON public.menu_item_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_item_option_groups
      JOIN public.menu_items ON menu_items.id = menu_item_option_groups.menu_item_id
      JOIN public.restaurants ON restaurants.id = menu_items.restaurant_id
      WHERE menu_item_option_groups.id = menu_item_options.option_group_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to options"
  ON public.menu_item_options
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_option_groups_menu_item ON public.menu_item_option_groups(menu_item_id);
CREATE INDEX idx_options_group ON public.menu_item_options(option_group_id);

-- Create triggers for updated_at
CREATE TRIGGER update_option_groups_updated_at
  BEFORE UPDATE ON public.menu_item_option_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_options_updated_at
  BEFORE UPDATE ON public.menu_item_options
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Modify order_items to store selected options
ALTER TABLE public.order_items 
ADD COLUMN selected_options JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.order_items.selected_options IS 'Array of selected option objects: [{option_id: uuid, option_name: text, price_modifier: numeric}]';