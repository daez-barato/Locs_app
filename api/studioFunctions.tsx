import { supabase } from "@/lib/supabase";
import { signThumbnails } from "@/utils/image-upload";

export const fetchTemplate = async (templateId: string) => {
  try {
    const { data, error } = await supabase.rpc("get_template_by_id", { p_template_id: templateId });

    if (error || !data) {
      throw new Error(error?.message || "Template not found");
    }

    return data;
  } catch (err: any) {
    return { error: true, msg: err.message };
  }
};

export const fetchSavedTemplates = async () => {
  try {
    const { data, error } = await supabase.rpc("get_saved_templates");

    if (error) {
      throw new Error(error.message);
    }

    const signed = await signThumbnails<any>(
      (data ?? []).map((t: any) => ({ ...t, id: t.template_id }))
    );
    return signed.map((t: any) => ({ ...t, thumbnail: t.thumbnail_url }));
  } catch (err: any) {
    return { error: true, msg: err.message };
  }
};

export const deleteSavedTemplate = async (templateId: string) => {
  try {
    const { error } = await supabase.rpc("unsave_template", { _template_id: templateId });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: "Template removed from saved list" };
  } catch (err: any) {
    return { error: true, msg: err.message };
  }
};
