

export interface TemplateDto {
  optionsDict: { [key: string]: string[] },
  title: string,
  description: string,
  image: string,
}

export interface EventDto {
  privacy: string,
  durationMinutes: number,
  templateId: string | undefined
}