import { SERVER_PORT } from "./config";
import axiosInstance from "./utils/axiosInstance";


export const postEvent = async (
  optionsDict: { [key: string]: string[] },
  title: string,
  description: string,
  image: string,
  privacy: string,
  time: string,
  templateId: string | undefined
) => {
  // remove last '+' option from optionsDict
  const options = JSON.parse(JSON.stringify(optionsDict));
;
  for (const key in options) {
    options[key].pop();
  }

  const formData = new FormData();

  if (image) {
    formData.append("image", {
      uri: image,
      name: "event.jpg",
      type: "image/jpeg",
    } as any);
  }

  // append other fields (must all be strings)
  formData.append("optionsDict", JSON.stringify(options));
  formData.append("title", title);
  formData.append("description", description);
  formData.append("privacy", privacy);
  formData.append("time", time);
  if (templateId) formData.append("templateId", templateId);

  try {
    const result = await axiosInstance.post(
      `${SERVER_PORT}/event/postEvent`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (result.status !== 201) {
      throw new Error("Failed to create event");
    }

    const eventLink = result.data.id; // Assuming server returns the event link
    console.log("Event created successfully:", eventLink);

    if (!eventLink) {
      throw new Error("Error creating event, no link returned");
    }

    return eventLink;
  } catch (err: any) {
    return { error: true, msg: err.response?.data?.error || err.message };
  }
};


export const fetchTemplate = async (templateId: string) => {
    try {

        const template = await axiosInstance.get(`/event/getTemplate/${templateId}`);

        if (template.status !== 200) {
            throw new Error("Failed to fetch template");
        };

        return template.data;

    } catch (err: any){
        return { error: true, msg:  err.message };
    }
};

export const fetchSavedTemplates = async () => {
    try {
        const templates = await axiosInstance.get("/users/savedTemplates");

        if (templates.status != 200){
            throw new Error("Failed to fetch templates");
        };

        return templates.data.result;

    } catch (err: any){
        return { error: true, msg:  err.message };
    }
};

export const deleteSavedTemplate = async (templateId: string) => {
     try {
        const result = await axiosInstance.delete(`/users/delete/savedTemplate/${templateId}`);

        if (result.status != 200){
            throw new Error("Failed to delete template");
        };

        console.log(result.data.message);

        return result.data;

    } catch (err: any){
        return { error: true, msg:  err.message };
    }
};