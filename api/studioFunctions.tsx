import { SERVER_PORT } from "./config";
import axiosInstance from "./utils/axiosInstance";

export const postEvent = async (optionsDict: { [key: string]: string[] }, title: string, description: string, image: string, privacy: string, time: string, templateId: string | undefined) => {
    // remove last '+' option from optionsDict
    for (const key in optionsDict) {
        optionsDict[key].pop();
    };
    
    try {
        const result = await axiosInstance.post(`${SERVER_PORT}/event/postEvent`, {
            optionsDict,
            title,
            description,
            image,
            privacy,
            time,
            templateId, // Pass the templateId to the server
        });

        if (result.status !== 201) {
            throw new Error("Failed to create event");
        }

        const eventLink = result.data.id; // Assuming the server returns the event link

        console.log("Event created successfully:", eventLink);
        // Return the event link or ID for further use
        if (!eventLink) {
            throw new Error("Error creating event, no link returned");
        };
        return eventLink;

    } catch (err: any){
        return { error: true, msg:  err.response.data.error };
    }
}

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
}