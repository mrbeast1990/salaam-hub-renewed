import { supabase } from "@/integrations/supabase/client";

export async function uploadProductImage(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

export async function deleteProductImage(url: string): Promise<boolean> {
  try {
    if (!url) return true;
    
    // Extract path from public URL
    // Format: .../storage/v1/object/public/product-images/products/filename.ext
    const parts = url.split('/product-images/');
    if (parts.length < 2) return false;
    
    const filePath = parts[1];
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
