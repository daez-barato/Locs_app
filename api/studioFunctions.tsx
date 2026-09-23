import { supabase } from "@/lib/supabase";
import { signThumbnails } from "@/utils/image-upload";
import { TemplatePayload } from "@/types/rpc";

export const fetchTemplate = async (templateId: string) => {
  try {
    const { data, error } = await supabase.rpc("get_template_by_id", { p_template_id: templateId });

    if (error || !data) {
      throw new Error(error?.message || "Template not found");
    }

    // jsonb returns arrive as Json; assert the documented shape once, here.
    // The RPC returns a flat object with questions as
    // { title: { question_id, options: [{ option_id, title }] } }, while the
    // studio wants a nested template and a plain title -> option titles map.
    const template = data as unknown as TemplatePayload;

    const questions: Record<string, string[]> = {};
    for (const [title, question] of Object.entries(template.questions || {})) {
      questions[title] = (question?.options ?? []).map((o) => o.title);
    }

    // event-thumbnail is private, so the stored path needs signing to render.
    let image: string | undefined;
    if (template.thumbnail_url) {
      const { data: signed } = await supabase.storage
        .from("event-thumbnail")
        .createSignedUrl(template.thumbnail_url, 60 * 60);
      image = signed?.signedUrl ?? undefined;
    }

    return {
      template: {
        id: template.template_id,
        title: template.title,
        description: template.description,
        image,
        creator_id: template.creator_id,
        is_public: template.is_public,
      },
      questions,
    };
  } catch (err: any) {
    return { error: true as const, msg: err.message };
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
    // TemplateCard reads id/thumbnail/type; the RPC returns template_id and a
    // raw storage path, and carries no type of its own.
    return signed.map((t: any) => ({ ...t, thumbnail: t.thumbnail_url, type: "template" }));
  } catch (err: any) {
    return { error: true as const, msg: err.message };
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
    return { error: true as const, msg: err.message };
  }
};
